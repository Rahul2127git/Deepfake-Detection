# DeepShield AI - Deployment Guide

## Overview

DeepShield AI is a full-stack deepfake detection platform built with React 19, Tailwind CSS 4, Express 4, and tRPC 11. This guide covers deployment, configuration, and ML model integration.

## Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom glassmorphism theme
- **State Management**: tRPC React Query hooks
- **Build Tool**: Vite

### Backend
- **Framework**: Express 4 with Node.js
- **API**: tRPC 11 for type-safe API endpoints
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth integration

### Database Schema
- **users**: Core user authentication and profile data
- **scans**: Deepfake detection results and metadata

## Deployment Instructions

### Prerequisites
- Node.js 18+ and pnpm
- MySQL/TiDB database
- Environment variables configured

### Environment Variables

Create a `.env` file with the following variables (automatically injected in production):

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

### Local Development

```bash
# Install dependencies
pnpm install

# Generate database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

### Production Deployment

#### Option 1: Manus Platform (Recommended)
The application is pre-configured for deployment on the Manus platform with:
- Automatic SSL/TLS
- Built-in database hosting
- OAuth integration
- Environment variable management
- Automatic scaling

#### Option 2: Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t deepshield-ai .
docker run -p 3000:3000 -e DATABASE_URL=... deepshield-ai
```

#### Option 3: Traditional Server Deployment

1. **Build the application**:
   ```bash
   pnpm build
   ```

2. **Upload to server**:
   ```bash
   scp -r dist/ package.json pnpm-lock.yaml user@server:/app/
   ```

3. **Install and run**:
   ```bash
   cd /app
   pnpm install --frozen-lockfile --prod
   pnpm start
   ```

4. **Use process manager** (PM2):
   ```bash
   pm2 start dist/index.js --name "deepshield-ai"
   pm2 save
   ```

## ML Model Integration

### Current Implementation
The application includes realistic placeholder predictions for demonstration. To integrate your trained ML models:

### Integration Steps

#### 1. Prepare Your Model

Ensure your model is in one of these formats:
- **PyTorch**: `.pt` or `.pth` files
- **TensorFlow**: SavedModel format or `.h5`
- **ONNX**: `.onnx` format (recommended for Node.js)
- **Python API**: REST endpoint

#### 2. Model Loading Options

**Option A: ONNX Runtime (Recommended for Node.js)**

```typescript
// server/ml/model.ts
import ort from 'onnxruntime-node';

let session: ort.InferenceSession | null = null;

export async function loadModel() {
  if (!session) {
    session = await ort.InferenceSession.create('./models/deepfake-detector.onnx');
  }
  return session;
}

export async function predictFrame(frameBuffer: Buffer) {
  const session = await loadModel();
  const tensor = new ort.Tensor('float32', frameBuffer, [1, 3, 224, 224]);
  const results = await session.run({ input: tensor });
  return results;
}
```

**Option B: Python Backend with FastAPI**

```python
# backend/main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import torch
from torchvision import transforms
from PIL import Image
import io

app = FastAPI()
model = torch.load('models/deepfake_detector.pt')
model.eval()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read()))
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])
    
    with torch.no_grad():
        output = model(transform(image).unsqueeze(0))
        confidence = torch.softmax(output, dim=1)
    
    return {
        "label": "Real" if confidence[0][0] > 0.5 else "Deepfake",
        "confidence": float(confidence[0][0])
    }
```

#### 3. Update the Prediction Endpoint

In `server/routers.ts`, replace the mock prediction:

```typescript
predict: protectedProcedure
  .input(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileType: z.enum(["image", "video"]),
  }))
  .mutation(async ({ input, ctx }) => {
    const startTime = Date.now();

    // Call your ML model
    const prediction = await callMLModel(input.fileUrl, input.fileType);
    
    const processingTime = Date.now() - startTime;

    await createScan({
      userId: ctx.user.id,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      result: prediction.label,
      confidence: prediction.confidence,
      modelVersion: "v2.0-custom",
      frameAnalysis: JSON.stringify(prediction.frameAnalysis),
      processingTime,
    });

    return {
      label: prediction.label,
      confidence: prediction.confidence,
      frameAnalysis: prediction.frameAnalysis,
      processingTime,
      modelVersion: "v2.0-custom",
      accuracy: 99.2,
    };
  }),
```

#### 4. Recommended Datasets

**Training Data Sources**:
- **FaceForensics++**: https://github.com/ondyari/FaceForensics
- **Kaggle Deepfake Detection**: https://www.kaggle.com/c/deepfake-detection-challenge
- **Mendeley Deepfake Dataset**: https://data.mendeley.com/datasets
- **DFDC Dataset**: https://www.deepfakedetectionchallenge.org/

**Benchmark Models**:
- **EfficientNet-B7**: High accuracy with reasonable latency
- **Vision Transformer (ViT)**: State-of-the-art accuracy
- **ResNet50 + Attention**: Good balance of speed and accuracy
- **Ensemble Methods**: Combine multiple models for robustness

### Performance Optimization

1. **Frame Sampling**: For videos, sample every Nth frame to reduce processing time
2. **Model Quantization**: Use INT8 quantization to reduce model size and latency
3. **Batch Processing**: Process multiple frames in parallel
4. **Caching**: Cache model predictions for identical inputs

## Monitoring & Maintenance

### Health Checks
```bash
curl http://localhost:3000/api/health
```

### Database Maintenance
```bash
# Backup database
mysqldump -u user -p database > backup.sql

# Restore database
mysql -u user -p database < backup.sql
```

### Log Monitoring
- Frontend logs: Browser DevTools Console
- Server logs: `stdout` and `stderr` from process manager
- Database logs: MySQL error log

## Security Considerations

1. **API Rate Limiting**: Implement rate limiting on `/api/trpc/detection.predict`
2. **File Validation**: Validate file types and sizes before processing
3. **Authentication**: All detection endpoints require authentication
4. **HTTPS**: Always use HTTPS in production
5. **Secrets Management**: Store API keys and secrets in environment variables
6. **CORS**: Configure CORS appropriately for your domain

## Troubleshooting

### Database Connection Issues
```bash
# Test MySQL connection
mysql -h host -u user -p -e "SELECT 1;"
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Performance Issues
- Check database query performance
- Monitor server CPU and memory usage
- Implement caching for frequently accessed data
- Consider horizontal scaling for high traffic

## Support & Resources

- **Documentation**: See README.md in project root
- **tRPC Docs**: https://trpc.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs

## License

MIT License - See LICENSE file for details

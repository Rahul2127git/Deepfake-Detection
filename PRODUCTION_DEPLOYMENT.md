# Deepfake Detection - Production Deployment Guide

## Overview

This guide covers deploying your custom-trained deepfake detection models to production environments. It includes containerization, cloud deployment, monitoring, and scaling strategies.

## Pre-Deployment Checklist

Before deploying to production, verify the following:

### Model Readiness

- [ ] Model accuracy ≥ 95% on test set
- [ ] Model tested on real-world deepfakes
- [ ] Model exported to production format (ONNX or PyTorch)
- [ ] Model size < 500MB
- [ ] Inference time < 30 seconds per video
- [ ] Model versioning implemented

### Application Readiness

- [ ] All tests passing (7/7 vitest tests)
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Error handling implemented
- [ ] Logging configured

### Infrastructure Readiness

- [ ] Production database configured
- [ ] Storage backend (S3) configured
- [ ] SSL/TLS certificates ready
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

## Deployment Options

### Option 1: Manus Hosting (Recommended)

Manus provides built-in hosting with automatic scaling and monitoring.

#### 1.1 Prepare for Deployment

```bash
# 1. Verify all tests pass
cd /path/to/deepshield-ai
pnpm test

# 2. Build production bundle
pnpm build

# 3. Create checkpoint
webdev_save_checkpoint --description "Production deployment: custom ML model v1.0"
```

#### 1.2 Deploy via Manus UI

1. Open Manus Management UI
2. Navigate to Dashboard
3. Click "Publish" button
4. Select checkpoint version
5. Configure domain (custom or auto-generated)
6. Click "Deploy"

#### 1.3 Verify Deployment

```bash
# Test deployed application
curl https://your-domain.manus.space/api/trpc/auth.me

# Monitor logs
# Available in Manus Dashboard → Logs

# Check status
# Available in Manus Dashboard → Status
```

### Option 2: Docker Deployment

Deploy using Docker containers for maximum flexibility.

#### 2.1 Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-slim

# Install Python for ML service
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY package.json pnpm-lock.yaml ./
COPY . .

# Install Node dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Install Python dependencies
RUN pip install --no-cache-dir \
    torch torchvision \
    opencv-python \
    numpy \
    scikit-learn \
    pandas \
    tqdm

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/trpc/auth.me || exit 1

# Start application
CMD ["node", "server/_core/index.ts"]
```

#### 2.2 Build Docker Image

```bash
# Build image
docker build -t deepfake-detection:latest .

# Tag for registry
docker tag deepfake-detection:latest your-registry/deepfake-detection:latest

# Push to registry
docker push your-registry/deepfake-detection:latest
```

#### 2.3 Run Docker Container

```bash
# Run locally
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host/db" \
  -e JWT_SECRET="your-secret" \
  -e VITE_APP_ID="your-app-id" \
  deepfake-detection:latest

# Run with GPU support
docker run -p 3000:3000 \
  --gpus all \
  -e DATABASE_URL="mysql://user:pass@host/db" \
  -e CUDA_VISIBLE_DEVICES=0 \
  deepfake-detection:latest
```

### Option 3: AWS Deployment

Deploy to AWS using ECS, Lambda, or EC2.

#### 3.1 Deploy to AWS ECS

```bash
# 1. Create ECS cluster
aws ecs create-cluster --cluster-name deepfake-detection

# 2. Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 3. Create service
aws ecs create-service \
  --cluster deepfake-detection \
  --service-name deepfake-api \
  --task-definition deepfake-detection:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

**task-definition.json:**

```json
{
  "family": "deepfake-detection",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "deepfake-api",
      "image": "your-registry/deepfake-detection:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "mysql://user:pass@rds-endpoint/db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/deepfake-detection",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3.2 Deploy to AWS Lambda

```bash
# 1. Package application
zip -r lambda_deployment.zip . -x "node_modules/*" ".git/*"

# 2. Install dependencies in deployment package
mkdir -p package/nodejs
cd package/nodejs
npm install --production
cd ../..

# 3. Add application code
cp -r . package/

# 4. Create deployment package
cd package
zip -r ../lambda_deployment.zip .

# 5. Create Lambda function
aws lambda create-function \
  --function-name deepfake-detection \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler server/_core/index.handler \
  --zip-file fileb://lambda_deployment.zip \
  --timeout 300 \
  --memory-size 3008 \
  --environment Variables={DATABASE_URL=mysql://...,NODE_ENV=production}
```

#### 3.3 Deploy to AWS EC2

```bash
# 1. SSH into EC2 instance
ssh -i key.pem ubuntu@ec2-instance-ip

# 2. Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm python3 python3-pip ffmpeg

# 3. Clone repository
git clone https://github.com/your-repo/deepshield-ai.git
cd deepshield-ai

# 4. Install dependencies
npm install -g pnpm
pnpm install

# 5. Configure environment
cp .env.example .env
# Edit .env with production values

# 6. Start application
pnpm build
pnpm start

# 7. (Optional) Use PM2 for process management
npm install -g pm2
pm2 start server/_core/index.ts --name deepfake-detection
pm2 startup
pm2 save
```

### Option 4: Google Cloud Deployment

Deploy to Google Cloud using Cloud Run or Compute Engine.

#### 4.1 Deploy to Google Cloud Run

```bash
# 1. Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/deepfake-detection

# 2. Deploy to Cloud Run
gcloud run deploy deepfake-detection \
  --image gcr.io/PROJECT_ID/deepfake-detection \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 600 \
  --set-env-vars DATABASE_URL=mysql://...,NODE_ENV=production

# 3. Get service URL
gcloud run services describe deepfake-detection --platform managed
```

#### 4.2 Deploy to Google Compute Engine

```bash
# 1. Create VM instance
gcloud compute instances create deepfake-detection \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=n1-standard-4 \
  --zone=us-central1-a

# 2. SSH into instance
gcloud compute ssh deepfake-detection --zone=us-central1-a

# 3. Install dependencies and deploy (similar to EC2)
```

## Environment Configuration

### Production Environment Variables

Create `.env.production` with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://user:password@host:3306/deepfake_detection_prod

# Authentication
JWT_SECRET=your-production-secret-key
VITE_APP_ID=your-production-app-id
OAUTH_SERVER_URL=https://api.manus.im

# ML Service
ML_MODEL_PATH=ml/models/deepfake_detector_best.pth
ML_INFERENCE_TIMEOUT=60000
ML_BATCH_SIZE=8

# Storage
S3_BUCKET=deepfake-detection-prod
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Performance
NODE_OPTIONS=--max-old-space-size=4096
```

### Secrets Management

Use your cloud provider's secrets management service:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name deepfake-detection/prod \
  --secret-string '{"DATABASE_URL":"mysql://...","JWT_SECRET":"..."}'

# Google Secret Manager
gcloud secrets create deepfake-detection-prod \
  --replication-policy="automatic"

# Azure Key Vault
az keyvault secret set \
  --vault-name deepfake-detection \
  --name DATABASE_URL \
  --value "mysql://..."
```

## Database Setup

### Create Production Database

```bash
# 1. Create database
mysql -h your-host -u admin -p << 'EOF'
CREATE DATABASE deepfake_detection_prod;
CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON deepfake_detection_prod.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
EOF

# 2. Run migrations
DATABASE_URL="mysql://app_user:password@host/deepfake_detection_prod" \
pnpm drizzle-kit migrate

# 3. Verify migrations
mysql -h your-host -u app_user -p deepfake_detection_prod << 'EOF'
SHOW TABLES;
DESCRIBE users;
DESCRIBE scans;
EOF
```

### Backup Strategy

```bash
# Daily automated backups
# Add to cron job:
0 2 * * * mysqldump -h host -u user -p database > /backups/db_$(date +\%Y\%m\%d).sql

# Or use cloud provider backup:
# AWS RDS: Enable automated backups (retention: 30 days)
# Google Cloud SQL: Enable automated backups
# Azure Database: Enable geo-redundant backups
```

## Monitoring and Logging

### Application Monitoring

```bash
# 1. Set up error tracking (Sentry)
npm install @sentry/node @sentry/tracing

# In server/_core/index.ts:
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

# 2. Set up performance monitoring
# Use cloud provider APM:
# - AWS CloudWatch
# - Google Cloud Trace
# - Azure Application Insights

# 3. Set up log aggregation
# - AWS CloudWatch Logs
# - Google Cloud Logging
# - ELK Stack (Elasticsearch, Logstash, Kibana)
```

### Health Checks

```bash
# Add health check endpoint
# GET /health

# In server/routers.ts:
export const router = t.router({
  health: publicProcedure.query(async () => {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }),
});

# Monitor health checks
# - AWS ELB Health Checks
# - Google Cloud Load Balancer Health Checks
# - Kubernetes Liveness/Readiness Probes
```

### ML Model Monitoring

```python
# Monitor model performance in production
import json
from datetime import datetime

def log_prediction(file_name, prediction, confidence):
    """Log prediction for monitoring"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'file': file_name,
        'prediction': prediction,
        'confidence': confidence,
    }
    
    # Send to monitoring service
    # - CloudWatch Metrics
    # - Datadog
    # - New Relic
    
    with open('/var/log/deepfake-detection/predictions.jsonl', 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

# Monitor model drift
def check_model_drift():
    """Detect if model performance is degrading"""
    # Compare recent accuracy with baseline
    # Alert if accuracy drops > 5%
    # Trigger retraining if needed
    pass
```

## Scaling Strategies

### Horizontal Scaling

```bash
# Load balancing configuration (Nginx)
upstream deepfake_api {
    server api1.example.com:3000;
    server api2.example.com:3000;
    server api3.example.com:3000;
}

server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://deepfake_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Vertical Scaling

Increase resources for single instance:

```bash
# AWS: Change instance type
aws ec2 modify-instance-attribute \
  --instance-id i-xxxxx \
  --instance-type t3.xlarge

# Google Cloud: Resize VM
gcloud compute instances create new-instance \
  --machine-type n1-standard-8 \
  --image-family ubuntu-2204-lts
```

### Auto-Scaling

```bash
# AWS Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name deepfake-detection-asg \
  --launch-configuration deepfake-detection-lc \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3 \
  --availability-zones us-east-1a us-east-1b

# Scale based on CPU utilization
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name deepfake-detection-asg \
  --policy-name scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://scaling-policy.json
```

## Security Best Practices

### Network Security

```bash
# 1. Use HTTPS/TLS
# - Get SSL certificate (Let's Encrypt, AWS ACM)
# - Configure HTTPS in application

# 2. Configure firewall
# - Allow only necessary ports (80, 443)
# - Restrict SSH access (specific IPs)
# - Block all other ports

# 3. Use VPN/Private networks
# - Deploy database in private subnet
# - Use VPN for admin access
# - Restrict API access to authorized clients
```

### Application Security

```bash
# 1. Input validation
# - Validate file uploads (size, format)
# - Sanitize user input
# - Rate limiting on API endpoints

# 2. Authentication & Authorization
# - Use JWT tokens with expiration
# - Implement role-based access control
# - Audit access logs

# 3. Data encryption
# - Encrypt data in transit (HTTPS)
# - Encrypt data at rest (database, storage)
# - Use secure key management
```

### Infrastructure Security

```bash
# 1. Keep systems updated
# - Regular OS patches
# - Update dependencies
# - Security scanning

# 2. Access control
# - Use IAM roles and policies
# - Implement MFA
# - Audit access logs

# 3. Compliance
# - GDPR compliance (data privacy)
# - CCPA compliance (user rights)
# - Industry standards (ISO 27001, SOC 2)
```

## Rollback Procedures

### Rollback to Previous Version

```bash
# 1. Identify previous stable version
git log --oneline | head -10

# 2. Rollback application
git revert <commit-hash>
git push origin main

# 3. Redeploy
# - Manus: Click "Rollback" in checkpoint history
# - Docker: Deploy previous image tag
# - AWS: Update task definition to previous version

# 4. Verify rollback
curl https://your-domain/api/trpc/auth.me
```

### Database Rollback

```bash
# 1. Restore from backup
mysql -h host -u user -p database < /backups/db_backup.sql

# 2. Verify data integrity
mysql -h host -u user -p database << 'EOF'
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM scans;
EOF

# 3. Rerun migrations if needed
DATABASE_URL="mysql://..." pnpm drizzle-kit migrate
```

## Disaster Recovery

### Backup and Recovery Plan

```bash
# 1. Automated daily backups
# - Database: 30-day retention
# - Application code: Git repository
# - User uploads: S3 with versioning

# 2. Recovery time objectives (RTO)
# - Database: 1 hour
# - Application: 15 minutes
# - Full system: 4 hours

# 3. Recovery point objectives (RPO)
# - Database: 1 hour
# - Application: Immediate (git)
# - User data: 1 hour

# 4. Test recovery monthly
# - Restore database from backup
# - Verify data integrity
# - Test application startup
```

## Post-Deployment Checklist

After deploying to production, verify:

- [ ] Application is running and responding to requests
- [ ] Database is connected and migrations applied
- [ ] ML model is loaded and making predictions
- [ ] Monitoring and logging are active
- [ ] SSL/TLS certificates are valid
- [ ] Backups are being created
- [ ] Health checks are passing
- [ ] Load balancing is working
- [ ] Error tracking is capturing errors
- [ ] Performance metrics are being collected

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker logs deepfake-detection

# Verify environment variables
env | grep DATABASE_URL

# Check database connection
mysql -h host -u user -p -e "SELECT 1"

# Verify ML model exists
ls -la ml/models/deepfake_detector_best.pth
```

### High Memory Usage

```bash
# Check memory usage
ps aux | grep node

# Reduce Node.js heap size
export NODE_OPTIONS=--max-old-space-size=2048

# Restart application
pm2 restart deepfake-detection
```

### Slow Inference

```bash
# Check GPU availability
nvidia-smi

# Monitor inference time
# Check ml/output/predictions.jsonl for processing_time

# Optimize model
# - Reduce batch size
# - Use faster model (MesoNet instead of XceptionNet)
# - Enable GPU acceleration
```

## Next Steps

1. **Prepare for Deployment** (1 hour)
   - Verify pre-deployment checklist
   - Configure environment variables
   - Set up database

2. **Choose Deployment Option** (30 minutes)
   - Select cloud provider or self-hosted
   - Configure infrastructure
   - Set up monitoring

3. **Deploy Application** (1-2 hours)
   - Build and push Docker image
   - Deploy to chosen platform
   - Verify deployment

4. **Monitor and Maintain** (Ongoing)
   - Monitor application health
   - Track performance metrics
   - Plan for scaling and updates

---

**Ready to deploy?** Start with the Pre-Deployment Checklist!

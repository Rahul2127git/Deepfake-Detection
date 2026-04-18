# Deepfake Detection - Model Evaluation & Validation Guide

## Overview

This guide provides comprehensive instructions for evaluating and validating deepfake detection models. Proper evaluation ensures your custom-trained models achieve production-quality accuracy and generalize well to real-world deepfakes.

## Evaluation Framework

### Core Metrics

The evaluation framework measures model performance across multiple dimensions:

| Metric | Formula | Interpretation |
|--------|---------|-----------------|
| **Accuracy** | (TP + TN) / (TP + TN + FP + FN) | Overall correctness (0-1, higher is better) |
| **Precision** | TP / (TP + FP) | Deepfake detection reliability (0-1, higher is better) |
| **Recall** | TP / (TP + FN) | Deepfake detection completeness (0-1, higher is better) |
| **F1-Score** | 2 × (Precision × Recall) / (Precision + Recall) | Balanced metric (0-1, higher is better) |
| **ROC-AUC** | Area under ROC curve | Discrimination ability (0-1, higher is better) |
| **Specificity** | TN / (TN + FP) | Real video detection rate (0-1, higher is better) |

Where:
- **TP** (True Positive): Correctly identified deepfake
- **TN** (True Negative): Correctly identified real video
- **FP** (False Positive): Real video incorrectly identified as deepfake
- **FN** (False Negative): Deepfake incorrectly identified as real

### Confusion Matrix

The confusion matrix visualizes model predictions:

```
                 Predicted
                 Real    Deepfake
Actual Real      TN      FP
       Deepfake  FN      TP
```

## Step 1: Prepare Evaluation Dataset

### 1.1 Create Test Set

```bash
# Ensure test set is separate from training data
# Recommended split: 64% train, 16% validation, 20% test

mkdir -p ml/evaluation/{test_real,test_deepfake}

# Copy test videos (should be 1000+ videos)
# These must NOT overlap with training data!
cp ml/data/test/real/* ml/evaluation/test_real/
cp ml/data/test/deepfake/* ml/evaluation/test_deepfake/

# Verify test set size
find ml/evaluation -type f | wc -l  # Should be 1000+
```

### 1.2 Create Diverse Test Scenarios

For robust evaluation, test across different deepfake types:

```bash
# Create test subsets for different deepfake methods
mkdir -p ml/evaluation/{face_swap,lip_sync,expression_reenactment,voice_conversion}

# Face Swap: Entire face replaced
# Lip Sync: Mouth movements synchronized to audio
# Expression Reenactment: Facial expressions transferred
# Voice Conversion: Audio synthesized or modified

# Organize test videos by type
# This allows per-method accuracy analysis
```

### 1.3 Create Challenging Test Cases

```bash
# Create test set with challenging scenarios
mkdir -p ml/evaluation/challenging/{low_quality,fast_motion,extreme_lighting,partial_face}

# Low Quality: Compressed/low-resolution videos
# Fast Motion: Quick head movements, gestures
# Extreme Lighting: Very bright or very dark scenes
# Partial Face: Face partially obscured or at angles
```

## Step 2: Run Evaluation

### 2.1 Basic Evaluation

```bash
# Run evaluation on test set
cd /path/to/deepshield-ai

python3 ml/training_pipeline.py --mode evaluate

# Expected output:
# [INFO] Loading test data...
# [INFO] Test dataset: 1000 samples
# [INFO] Loading model: ml/models/deepfake_detector_best.pth
# [INFO] Running evaluation...
# [████████████████████] 100%
# [INFO] Evaluation complete!
# 
# Test Accuracy: 0.9567
# Test Precision: 0.9512
# Test Recall: 0.9623
# Test F1-Score: 0.9567
# Test ROC-AUC: 0.9834
# Test Specificity: 0.9511
```

### 2.2 Detailed Evaluation Report

```python
# Generate comprehensive evaluation report
python3 << 'EOF'
import torch
import numpy as np
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    roc_curve, precision_recall_curve, auc
)
import json
import matplotlib.pyplot as plt
import seaborn as sns

# Load model and test data
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = torch.load('ml/models/deepfake_detector_best.pth', map_location=device)
model.eval()

# ... load test_loader ...

# Collect predictions
all_predictions = []
all_confidences = []
all_labels = []

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)
        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)
        
        all_predictions.extend(torch.argmax(outputs, dim=1).cpu().numpy())
        all_confidences.extend(probs[:, 1].cpu().numpy())  # Deepfake probability
        all_labels.extend(labels.cpu().numpy())

all_predictions = np.array(all_predictions)
all_confidences = np.array(all_confidences)
all_labels = np.array(all_labels)

# Generate classification report
print("=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)
print(classification_report(
    all_labels, all_predictions,
    target_names=['Real', 'Deepfake'],
    digits=4
))

# Confusion matrix
cm = confusion_matrix(all_labels, all_predictions)
print("\nCONFUSION MATRIX:")
print(cm)

# ROC-AUC Score
roc_auc = roc_auc_score(all_labels, all_confidences)
print(f"\nROC-AUC Score: {roc_auc:.4f}")

# Save results
results = {
    'accuracy': np.mean(all_predictions == all_labels),
    'roc_auc': roc_auc,
    'confusion_matrix': cm.tolist(),
    'per_class_metrics': classification_report(
        all_labels, all_predictions,
        target_names=['Real', 'Deepfake'],
        output_dict=True
    )
}

with open('ml/output/evaluation_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nResults saved to ml/output/evaluation_results.json")
EOF
```

### 2.3 Per-Method Evaluation

```python
# Evaluate on specific deepfake methods
python3 << 'EOF'
import torch
import os
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = torch.load('ml/models/deepfake_detector_best.pth', map_location=device)
model.eval()

methods = ['face_swap', 'lip_sync', 'expression_reenactment', 'voice_conversion']
results = {}

for method in methods:
    method_dir = f'ml/evaluation/{method}'
    if not os.path.exists(method_dir):
        continue
    
    # Load method-specific test data
    # ... load test_loader for this method ...
    
    predictions = []
    labels = []
    
    with torch.no_grad():
        for images, method_labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            predictions.extend(torch.argmax(outputs, dim=1).cpu().numpy())
            labels.extend(method_labels.cpu().numpy())
    
    # Calculate metrics
    results[method] = {
        'accuracy': accuracy_score(labels, predictions),
        'precision': precision_score(labels, predictions),
        'recall': recall_score(labels, predictions),
        'f1': f1_score(labels, predictions)
    }
    
    print(f"\n{method.upper()}:")
    print(f"  Accuracy:  {results[method]['accuracy']:.4f}")
    print(f"  Precision: {results[method]['precision']:.4f}")
    print(f"  Recall:    {results[method]['recall']:.4f}")
    print(f"  F1-Score:  {results[method]['f1']:.4f}")

# Save per-method results
import json
with open('ml/output/per_method_results.json', 'w') as f:
    json.dump(results, f, indent=2)
EOF
```

## Step 3: Visualize Results

### 3.1 Confusion Matrix Heatmap

```python
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import confusion_matrix

# Generate confusion matrix
cm = confusion_matrix(all_labels, all_predictions)

# Plot heatmap
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Real', 'Deepfake'],
            yticklabels=['Real', 'Deepfake'])
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.savefig('ml/output/confusion_matrix.png', dpi=150)
print("Saved to ml/output/confusion_matrix.png")
```

### 3.2 ROC Curve

```python
from sklearn.metrics import roc_curve, auc
import matplotlib.pyplot as plt

# Calculate ROC curve
fpr, tpr, _ = roc_curve(all_labels, all_confidences)
roc_auc = auc(fpr, tpr)

# Plot ROC curve
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color='darkorange', lw=2, 
         label=f'ROC Curve (AUC = {roc_auc:.4f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend(loc="lower right")
plt.tight_layout()
plt.savefig('ml/output/roc_curve.png', dpi=150)
print("Saved to ml/output/roc_curve.png")
```

### 3.3 Precision-Recall Curve

```python
from sklearn.metrics import precision_recall_curve, auc
import matplotlib.pyplot as plt

# Calculate precision-recall curve
precision, recall, _ = precision_recall_curve(all_labels, all_confidences)
pr_auc = auc(recall, precision)

# Plot precision-recall curve
plt.figure(figsize=(8, 6))
plt.plot(recall, precision, color='blue', lw=2,
         label=f'PR Curve (AUC = {pr_auc:.4f})')
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title('Precision-Recall Curve')
plt.legend(loc="upper right")
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.tight_layout()
plt.savefig('ml/output/precision_recall_curve.png', dpi=150)
print("Saved to ml/output/precision_recall_curve.png")
```

### 3.4 Confidence Distribution

```python
import matplotlib.pyplot as plt
import numpy as np

# Separate confidences by true label
real_confidences = all_confidences[all_labels == 0]
fake_confidences = all_confidences[all_labels == 1]

# Plot distribution
plt.figure(figsize=(10, 6))
plt.hist(real_confidences, bins=30, alpha=0.6, label='Real Videos', color='blue')
plt.hist(fake_confidences, bins=30, alpha=0.6, label='Deepfake Videos', color='red')
plt.xlabel('Model Confidence (Deepfake Probability)')
plt.ylabel('Frequency')
plt.title('Confidence Distribution by True Label')
plt.legend()
plt.tight_layout()
plt.savefig('ml/output/confidence_distribution.png', dpi=150)
print("Saved to ml/output/confidence_distribution.png")
```

## Step 4: Analyze Failure Cases

### 4.1 Identify Misclassifications

```python
# Find misclassified samples
import numpy as np

misclassified_indices = np.where(all_predictions != all_labels)[0]
misclassified_labels = all_labels[misclassified_indices]
misclassified_predictions = all_predictions[misclassified_indices]
misclassified_confidences = all_confidences[misclassified_indices]

print(f"Total misclassifications: {len(misclassified_indices)}")
print(f"Misclassification rate: {len(misclassified_indices)/len(all_labels):.2%}")

# False positives (real classified as deepfake)
false_positives = misclassified_indices[misclassified_labels == 0]
print(f"\nFalse Positives: {len(false_positives)}")
print(f"False Positive Rate: {len(false_positives)/np.sum(all_labels == 0):.2%}")

# False negatives (deepfake classified as real)
false_negatives = misclassified_indices[misclassified_labels == 1]
print(f"\nFalse Negatives: {len(false_negatives)}")
print(f"False Negative Rate: {len(false_negatives)/np.sum(all_labels == 1):.2%}")

# Save misclassified samples for manual review
with open('ml/output/misclassified_samples.txt', 'w') as f:
    f.write("False Positives (Real classified as Deepfake):\n")
    for idx in false_positives[:20]:  # Top 20
        f.write(f"  Sample {idx}: Confidence={all_confidences[idx]:.4f}\n")
    
    f.write("\nFalse Negatives (Deepfake classified as Real):\n")
    for idx in false_negatives[:20]:  # Top 20
        f.write(f"  Sample {idx}: Confidence={all_confidences[idx]:.4f}\n")

print("\nMisclassified samples saved to ml/output/misclassified_samples.txt")
```

### 4.2 Analyze Difficult Cases

```python
# Find samples with low confidence (near decision boundary)
import numpy as np

# Samples with confidence between 0.4 and 0.6 (uncertain predictions)
uncertain_mask = (all_confidences > 0.4) & (all_confidences < 0.6)
uncertain_indices = np.where(uncertain_mask)[0]

print(f"Uncertain predictions: {len(uncertain_indices)}")
print(f"Uncertainty rate: {len(uncertain_indices)/len(all_labels):.2%}")

# Analyze characteristics of uncertain samples
uncertain_labels = all_labels[uncertain_indices]
uncertain_predictions = all_predictions[uncertain_indices]
uncertain_accuracy = np.mean(uncertain_predictions == uncertain_labels)

print(f"Accuracy on uncertain samples: {uncertain_accuracy:.2%}")

# These samples may benefit from:
# 1. Additional training data
# 2. Ensemble methods
# 3. Confidence thresholding
```

## Step 5: Validation on Real-World Data

### 5.1 Test on Public Deepfakes

```bash
# Download public deepfake datasets for validation
mkdir -p ml/validation/public_deepfakes

# Deepfaceswap dataset (public)
# https://github.com/deepfaceswap/faceswap

# FaceForensics++ (public)
# https://github.com/ondyari/FaceForensics

# Test on these public deepfakes
python3 << 'EOF'
import os
import json
from ml.inference import DeepfakeInference

inference = DeepfakeInference()
results = []

for video_file in os.listdir('ml/validation/public_deepfakes'):
    if video_file.endswith(('.mp4', '.avi', '.mov')):
        video_path = f'ml/validation/public_deepfakes/{video_file}'
        result = inference.predict_video(video_path)
        result['video'] = video_file
        results.append(result)

# Save results
with open('ml/output/public_deepfake_validation.json', 'w') as f:
    json.dump(results, f, indent=2)

# Analyze results
correct = sum(1 for r in results if r['label'] == 'Deepfake')
print(f"Detected {correct}/{len(results)} public deepfakes correctly")
print(f"Detection rate: {correct/len(results):.2%}")
EOF
```

### 5.2 Test on Real Videos

```bash
# Test on real-world videos
mkdir -p ml/validation/real_videos

# Download real videos from:
# - YouTube (interviews, speeches)
# - Pexels (https://www.pexels.com/videos/)
# - Pixabay (https://pixabay.com/videos/)

# Test on real videos
python3 << 'EOF'
import os
import json
from ml.inference import DeepfakeInference

inference = DeepfakeInference()
results = []

for video_file in os.listdir('ml/validation/real_videos'):
    if video_file.endswith(('.mp4', '.avi', '.mov')):
        video_path = f'ml/validation/real_videos/{video_file}'
        result = inference.predict_video(video_path)
        result['video'] = video_file
        results.append(result)

# Save results
with open('ml/output/real_video_validation.json', 'w') as f:
    json.dump(results, f, indent=2)

# Analyze results
correct = sum(1 for r in results if r['label'] == 'Real')
print(f"Correctly identified {correct}/{len(results)} real videos")
print(f"Real video detection rate: {correct/len(results):.2%}")
EOF
```

## Step 6: Compare with Pre-trained Models

### 6.1 Benchmark Against Pre-trained Models

```python
# Compare custom model with pre-trained models
import torch
import numpy as np
from sklearn.metrics import accuracy_score, f1_score
from ml.pretrained_model import PretrainedDeepfakeDetector

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load custom model
custom_model = torch.load('ml/models/deepfake_detector_best.pth', map_location=device)
custom_model.eval()

# Load pre-trained models
mesonet = PretrainedDeepfakeDetector('mesonet')
efficientnet = PretrainedDeepfakeDetector('efficientnet')
xception = PretrainedDeepfakeDetector('xception')

# Evaluate all models
models = {
    'Custom Model': custom_model,
    'MesoNet': mesonet,
    'EfficientNet': efficientnet,
    'XceptionNet': xception
}

results = {}

for model_name, model in models.items():
    # ... run inference on test set ...
    # Calculate metrics
    results[model_name] = {
        'accuracy': accuracy,
        'f1_score': f1,
        'inference_time': avg_time
    }

# Print comparison
print("MODEL COMPARISON")
print("=" * 60)
print(f"{'Model':<20} {'Accuracy':<15} {'F1-Score':<15} {'Time (ms)':<15}")
print("-" * 60)
for model_name, metrics in results.items():
    print(f"{model_name:<20} {metrics['accuracy']:.4f}        "
          f"{metrics['f1_score']:.4f}        {metrics['inference_time']:.2f}")
```

## Step 7: Production Readiness Checklist

Before deploying your custom model to production, verify:

### Accuracy Requirements

- [ ] Test accuracy ≥ 95%
- [ ] Precision ≥ 94% (minimize false positives)
- [ ] Recall ≥ 94% (minimize false negatives)
- [ ] F1-Score ≥ 94%
- [ ] ROC-AUC ≥ 0.98

### Robustness Requirements

- [ ] Tested on diverse deepfake methods (face swap, lip sync, etc.)
- [ ] Tested on challenging scenarios (low quality, fast motion, extreme lighting)
- [ ] Tested on public deepfake datasets
- [ ] Tested on real-world videos
- [ ] Misclassification rate < 5%

### Performance Requirements

- [ ] Inference time < 30 seconds per video
- [ ] Memory usage < 4GB
- [ ] CPU usage < 80%
- [ ] GPU memory < 8GB (if GPU available)

### Deployment Requirements

- [ ] Model exported to ONNX format
- [ ] Inference script updated to load custom model
- [ ] Docker image built and tested
- [ ] Environment variables configured
- [ ] Monitoring and logging enabled

## Continuous Evaluation

### Monitor Production Performance

```python
# Log predictions in production
def log_production_prediction(file_name, prediction, confidence):
    import json
    from datetime import datetime
    
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'file': file_name,
        'prediction': prediction,
        'confidence': confidence,
    }
    
    with open('ml/output/production_predictions.jsonl', 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

# Analyze production performance
def analyze_production_performance():
    import json
    import numpy as np
    
    predictions = []
    with open('ml/output/production_predictions.jsonl', 'r') as f:
        for line in f:
            predictions.append(json.loads(line))
    
    confidences = [p['confidence'] for p in predictions]
    
    print(f"Total predictions: {len(predictions)}")
    print(f"Average confidence: {np.mean(confidences):.4f}")
    print(f"Min confidence: {np.min(confidences):.4f}")
    print(f"Max confidence: {np.max(confidences):.4f}")
    print(f"Std deviation: {np.std(confidences):.4f}")
```

### Periodic Revalidation

```bash
# Monthly revalidation
# 1. Collect new test data
# 2. Run evaluation
# 3. Compare with baseline
# 4. Retrain if accuracy drops

# Schedule monthly evaluation
# (Add to cron job or CI/CD pipeline)
0 0 1 * * python3 ml/training_pipeline.py --mode evaluate
```

## Troubleshooting

### Low Accuracy on Test Set

**Possible causes:**
- Insufficient training data (< 1000 videos)
- Training data too similar to test data (data leakage)
- Model underfitting (too simple architecture)
- Hyperparameters not optimized

**Solutions:**
- Collect more diverse training data
- Verify train/test split is correct
- Increase model complexity (more layers, larger batch size)
- Adjust learning rate and training epochs

### High False Positive Rate

**Possible causes:**
- Model too sensitive to deepfake indicators
- Training data imbalanced (more deepfakes than real)
- Real videos in training data are too similar to deepfakes

**Solutions:**
- Increase confidence threshold for deepfake prediction
- Balance training data (equal deepfakes and real videos)
- Add more diverse real videos to training data
- Use ensemble methods to reduce false positives

### High False Negative Rate

**Possible causes:**
- Model not sensitive enough to deepfake indicators
- Training data doesn't include all deepfake types
- Model architecture too simple

**Solutions:**
- Decrease confidence threshold for deepfake prediction
- Add more deepfake types to training data
- Use more complex model architecture
- Increase training epochs

## Next Steps

1. **Run Evaluation** (30 minutes)
   - Execute evaluation on test set
   - Generate evaluation report

2. **Visualize Results** (30 minutes)
   - Create confusion matrix heatmap
   - Plot ROC and precision-recall curves
   - Analyze confidence distribution

3. **Analyze Failures** (1 hour)
   - Identify misclassified samples
   - Analyze difficult cases
   - Determine improvement areas

4. **Validate on Real Data** (1-2 hours)
   - Test on public deepfakes
   - Test on real-world videos
   - Compare with pre-trained models

5. **Deploy to Production** (30 minutes)
   - Verify production readiness checklist
   - Export and deploy model
   - Enable monitoring and logging

---

**Ready to evaluate?** Start with Step 1: Prepare Evaluation Dataset!

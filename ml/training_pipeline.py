"""
DeepShield AI - Deepfake Detection Training Pipeline
This script provides a complete pipeline for training deepfake detection models.

REQUIREMENTS:
- Python 3.8+
- GPU with CUDA support (recommended: 8GB+ VRAM)
- ~100GB disk space for datasets

INSTALLATION:
pip install torch torchvision torchaudio
pip install tensorflow
pip install opencv-python
pip install scikit-learn
pip install pandas numpy
pip install tqdm
pip install kaggle
pip install requests

USAGE:
python training_pipeline.py --mode download  # Download datasets
python training_pipeline.py --mode preprocess  # Preprocess videos
python training_pipeline.py --mode train  # Train model
python training_pipeline.py --mode evaluate  # Evaluate model
"""

import os
import sys
import argparse
import json
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
from torchvision import transforms
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    'data_dir': './ml/data',
    'model_dir': './ml/models',
    'output_dir': './ml/output',
    'batch_size': 16,
    'epochs': 50,
    'learning_rate': 0.001,
    'num_workers': 4,
    'frame_sample_rate': 5,  # Sample every 5th frame
    'image_size': (224, 224),
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
}

# Create directories
for directory in [CONFIG['data_dir'], CONFIG['model_dir'], CONFIG['output_dir']]:
    Path(directory).mkdir(parents=True, exist_ok=True)


class DeepfakeDataset(Dataset):
    """Custom dataset for deepfake detection"""
    
    def __init__(self, video_paths, labels, frame_sample_rate=5, image_size=(224, 224)):
        self.video_paths = video_paths
        self.labels = labels
        self.frame_sample_rate = frame_sample_rate
        self.image_size = image_size
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize(image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
    
    def __len__(self):
        return len(self.video_paths)
    
    def __getitem__(self, idx):
        video_path = self.video_paths[idx]
        label = self.labels[idx]
        
        # Extract frames from video
        frames = self._extract_frames(video_path)
        
        if len(frames) == 0:
            # Return a dummy frame if extraction fails
            frames = [np.zeros((self.image_size[0], self.image_size[1], 3), dtype=np.uint8)]
        
        # Convert frames to tensors
        frame_tensors = [self.transform(frame) for frame in frames]
        frame_tensor = torch.stack(frame_tensors)
        
        # Average pooling across frames
        frame_tensor = frame_tensor.mean(dim=0)
        
        return frame_tensor, torch.tensor(label, dtype=torch.long)
    
    def _extract_frames(self, video_path, max_frames=10):
        """Extract frames from video file"""
        frames = []
        try:
            cap = cv2.VideoCapture(video_path)
            frame_count = 0
            extracted_count = 0
            
            while extracted_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % self.frame_sample_rate == 0:
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame)
                    extracted_count += 1
                
                frame_count += 1
            
            cap.release()
        except Exception as e:
            logger.warning(f"Error extracting frames from {video_path}: {e}")
        
        return frames


class DeepfakeDetectionModel(nn.Module):
    """ResNet-50 based deepfake detection model"""
    
    def __init__(self, num_classes=2):
        super(DeepfakeDetectionModel, self).__init__()
        
        # Load pre-trained ResNet-50
        self.backbone = models.resnet50(pretrained=True)
        
        # Freeze early layers
        for param in list(self.backbone.parameters())[:-2]:
            param.requires_grad = False
        
        # Replace classification head
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)


class DeepfakeTrainer:
    """Trainer class for deepfake detection model"""
    
    def __init__(self, model, device, config):
        self.model = model.to(device)
        self.device = device
        self.config = config
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=config['learning_rate'])
        self.best_accuracy = 0
    
    def train_epoch(self, train_loader):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        progress_bar = tqdm(train_loader, desc='Training')
        for images, labels in progress_bar:
            images, labels = images.to(self.device), labels.to(self.device)
            
            self.optimizer.zero_grad()
            outputs = self.model(images)
            loss = self.criterion(outputs, labels)
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            progress_bar.set_postfix({'loss': loss.item(), 'acc': correct/total})
        
        return total_loss / len(train_loader), correct / total
    
    def evaluate(self, val_loader):
        """Evaluate model on validation set"""
        self.model.eval()
        correct = 0
        total = 0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for images, labels in tqdm(val_loader, desc='Evaluating'):
                images, labels = images.to(self.device), labels.to(self.device)
                outputs = self.model(images)
                _, predicted = torch.max(outputs.data, 1)
                
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        accuracy = correct / total
        precision = precision_score(all_labels, all_preds, average='weighted', zero_division=0)
        recall = recall_score(all_labels, all_preds, average='weighted', zero_division=0)
        f1 = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
        
        return accuracy, precision, recall, f1
    
    def train(self, train_loader, val_loader):
        """Full training loop"""
        logger.info(f"Starting training on {self.device}")
        
        for epoch in range(self.config['epochs']):
            train_loss, train_acc = self.train_epoch(train_loader)
            val_acc, val_precision, val_recall, val_f1 = self.evaluate(val_loader)
            
            logger.info(f"Epoch {epoch+1}/{self.config['epochs']}")
            logger.info(f"  Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}")
            logger.info(f"  Val Acc: {val_acc:.4f}, Precision: {val_precision:.4f}, Recall: {val_recall:.4f}, F1: {val_f1:.4f}")
            
            # Save best model
            if val_acc > self.best_accuracy:
                self.best_accuracy = val_acc
                self.save_model(f"best_model_epoch_{epoch+1}.pth")
                logger.info(f"  Saved best model with accuracy: {val_acc:.4f}")
    
    def save_model(self, filename):
        """Save model checkpoint"""
        filepath = os.path.join(self.config['model_dir'], filename)
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'config': self.config
        }, filepath)
        logger.info(f"Model saved to {filepath}")


def download_datasets():
    """Download datasets from Kaggle and other sources"""
    logger.info("Downloading deepfake datasets...")
    
    # Note: Requires Kaggle API setup
    # Place your kaggle.json in ~/.kaggle/
    
    logger.info("To download Kaggle datasets:")
    logger.info("1. Install kaggle: pip install kaggle")
    logger.info("2. Download kaggle.json from https://www.kaggle.com/settings/account")
    logger.info("3. Place it in ~/.kaggle/kaggle.json")
    logger.info("4. Run: kaggle datasets download -d ziya07/deepfake-face-swapping-video-detection")
    
    logger.info("\nFor Pexels videos:")
    logger.info("1. Visit https://www.pexels.com/search/videos/human%20face/")
    logger.info("2. Download videos manually or use pexels-api")
    
    logger.info("\nDatasets will be stored in:", CONFIG['data_dir'])


def preprocess_videos():
    """Preprocess video files"""
    logger.info("Preprocessing videos...")
    
    data_dir = Path(CONFIG['data_dir'])
    
    # Create train/val splits
    real_videos = list(data_dir.glob('real/**/*.mp4'))
    fake_videos = list(data_dir.glob('fake/**/*.mp4'))
    
    logger.info(f"Found {len(real_videos)} real videos and {len(fake_videos)} fake videos")
    
    # Save metadata
    metadata = {
        'real_videos': [str(v) for v in real_videos],
        'fake_videos': [str(v) for v in fake_videos],
        'total_videos': len(real_videos) + len(fake_videos)
    }
    
    with open(os.path.join(CONFIG['output_dir'], 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Metadata saved to {CONFIG['output_dir']}/metadata.json")


def train_model():
    """Train deepfake detection model"""
    logger.info("Training deepfake detection model...")
    
    # Load metadata
    metadata_path = os.path.join(CONFIG['output_dir'], 'metadata.json')
    if not os.path.exists(metadata_path):
        logger.error("Metadata not found. Run preprocessing first.")
        return
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # Prepare datasets
    video_paths = metadata['real_videos'] + metadata['fake_videos']
    labels = [0] * len(metadata['real_videos']) + [1] * len(metadata['fake_videos'])
    
    # Split into train/val
    split_idx = int(0.8 * len(video_paths))
    train_videos = video_paths[:split_idx]
    train_labels = labels[:split_idx]
    val_videos = video_paths[split_idx:]
    val_labels = labels[split_idx:]
    
    # Create datasets
    train_dataset = DeepfakeDataset(train_videos, train_labels, **{
        'frame_sample_rate': CONFIG['frame_sample_rate'],
        'image_size': CONFIG['image_size']
    })
    val_dataset = DeepfakeDataset(val_videos, val_labels, **{
        'frame_sample_rate': CONFIG['frame_sample_rate'],
        'image_size': CONFIG['image_size']
    })
    
    # Create dataloaders
    train_loader = DataLoader(train_dataset, batch_size=CONFIG['batch_size'], 
                             shuffle=True, num_workers=CONFIG['num_workers'])
    val_loader = DataLoader(val_dataset, batch_size=CONFIG['batch_size'], 
                           shuffle=False, num_workers=CONFIG['num_workers'])
    
    # Initialize model and trainer
    model = DeepfakeDetectionModel(num_classes=2)
    trainer = DeepfakeTrainer(model, CONFIG['device'], CONFIG)
    
    # Train
    trainer.train(train_loader, val_loader)


def main():
    parser = argparse.ArgumentParser(description='DeepShield AI Training Pipeline')
    parser.add_argument('--mode', choices=['download', 'preprocess', 'train', 'evaluate'],
                       default='download', help='Operation mode')
    parser.add_argument('--config', type=str, help='Path to config file')
    
    args = parser.parse_args()
    
    if args.mode == 'download':
        download_datasets()
    elif args.mode == 'preprocess':
        preprocess_videos()
    elif args.mode == 'train':
        train_model()
    elif args.mode == 'evaluate':
        logger.info("Evaluation mode - load model and evaluate on test set")


if __name__ == '__main__':
    main()

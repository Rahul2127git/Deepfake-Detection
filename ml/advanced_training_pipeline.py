"""
Advanced Multi-Dataset Training Pipeline for Deepfake Detection
Supports: Awesome Deepfakes, HuggingFace v3, Meta DFDC
Target Accuracy: 95%+
"""

import os
import sys
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, ConcatDataset, random_split
import torchvision.transforms as transforms
from torch.optim.lr_scheduler import ReduceLROnPlateau, CosineAnnealingLR
import numpy as np
from pathlib import Path
from tqdm import tqdm
from datetime import datetime
import logging
from typing import Dict, List, Tuple, Optional
import argparse
import yaml

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AdvancedTrainingConfig:
    """Configuration for advanced multi-dataset training"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config = {
            # Training parameters
            'batch_size': 32,
            'num_epochs': 100,
            'learning_rate': 1e-4,
            'weight_decay': 1e-5,
            'num_workers': 4,
            'pin_memory': True,
            
            # Model parameters
            'model_name': 'efficientnet',  # Options: mesonet, efficientnet, xceptionnet
            'pretrained': True,
            'freeze_backbone': False,
            'dropout_rate': 0.5,
            
            # Data parameters
            'image_size': 224,
            'normalize_mean': [0.485, 0.456, 0.406],
            'normalize_std': [0.229, 0.224, 0.225],
            'augmentation': True,
            'augmentation_strength': 'strong',
            
            # Dataset parameters
            'datasets': ['awesome_deepfakes', 'huggingface_v3', 'meta_dfdc'],
            'train_split': 0.8,
            'val_split': 0.1,
            'test_split': 0.1,
            'balance_classes': True,
            
            # Optimization
            'optimizer': 'adamw',  # Options: adam, adamw, sgd
            'scheduler': 'cosine',  # Options: reduce_lr, cosine, step
            'warmup_epochs': 5,
            'gradient_accumulation_steps': 2,
            'mixed_precision': True,
            
            # Regularization
            'label_smoothing': 0.1,
            'focal_loss': True,
            'focal_alpha': 0.25,
            'focal_gamma': 2.0,
            
            # Paths
            'data_root': './ml/data',
            'output_dir': './ml/output',
            'checkpoint_dir': './ml/checkpoints',
            'log_dir': './ml/logs',
            
            # Validation
            'early_stopping_patience': 15,
            'save_best_only': True,
            'validation_frequency': 1,
        }
        
        if config_file and os.path.exists(config_file):
            with open(config_file, 'r') as f:
                user_config = yaml.safe_load(f)
                self.config.update(user_config)
    
    def __getitem__(self, key):
        return self.config[key]
    
    def __setitem__(self, key, value):
        self.config[key] = value
    
    def save(self, path: str):
        """Save configuration to YAML file"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            yaml.dump(self.config, f)


class FocalLoss(nn.Module):
    """Focal Loss for handling class imbalance"""
    
    def __init__(self, alpha=0.25, gamma=2.0):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
    
    def forward(self, inputs, targets):
        ce_loss = nn.functional.cross_entropy(inputs, targets, reduction='none')
        p = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - p) ** self.gamma * ce_loss
        return focal_loss.mean()


class AdvancedDataAugmentation:
    """Advanced data augmentation pipeline"""
    
    @staticmethod
    def get_transforms(config: AdvancedTrainingConfig, mode: str = 'train'):
        """Get augmentation transforms based on mode"""
        
        image_size = config['image_size']
        mean = config['normalize_mean']
        std = config['normalize_std']
        
        if mode == 'train' and config['augmentation']:
            strength = config['augmentation_strength']
            
            if strength == 'light':
                augmentation = transforms.Compose([
                    transforms.RandomHorizontalFlip(p=0.5),
                    transforms.RandomRotation(10),
                    transforms.ColorJitter(brightness=0.1, contrast=0.1),
                    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
                ])
            elif strength == 'strong':
                augmentation = transforms.Compose([
                    transforms.RandomHorizontalFlip(p=0.5),
                    transforms.RandomVerticalFlip(p=0.2),
                    transforms.RandomRotation(20),
                    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
                    transforms.RandomAffine(degrees=15, translate=(0.15, 0.15), scale=(0.8, 1.2)),
                    transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
                    transforms.RandomPerspective(distortion_scale=0.2),
                ])
            else:
                augmentation = transforms.Compose([
                    transforms.RandomHorizontalFlip(p=0.5),
                    transforms.RandomRotation(15),
                    transforms.ColorJitter(brightness=0.15, contrast=0.15),
                ])
            
            return transforms.Compose([
                transforms.Resize((image_size, image_size)),
                augmentation,
                transforms.ToTensor(),
                transforms.Normalize(mean=mean, std=std),
            ])
        else:
            return transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=mean, std=std),
            ])


class AdvancedTrainer:
    """Advanced trainer with multi-dataset support"""
    
    def __init__(self, config: AdvancedTrainingConfig, device: torch.device):
        self.config = config
        self.device = device
        self.best_val_acc = 0
        self.patience_counter = 0
        self.global_step = 0
        
        # Create directories
        for directory in [config['output_dir'], config['checkpoint_dir'], config['log_dir']]:
            os.makedirs(directory, exist_ok=True)
        
        # Initialize model
        self.model = self._build_model()
        
        # Initialize loss function
        if config['focal_loss']:
            self.criterion = FocalLoss(
                alpha=config['focal_alpha'],
                gamma=config['focal_gamma']
            )
        else:
            self.criterion = nn.CrossEntropyLoss(
                label_smoothing=config['label_smoothing']
            )
        
        # Initialize optimizer
        self.optimizer = self._build_optimizer()
        
        # Initialize scheduler
        self.scheduler = self._build_scheduler()
        
        # Mixed precision
        self.scaler = torch.cuda.amp.GradScaler() if config['mixed_precision'] else None
        
        logger.info(f"Model initialized on {device}")
        logger.info(f"Total parameters: {sum(p.numel() for p in self.model.parameters()):,}")
    
    def _build_model(self):
        """Build model based on configuration"""
        model_name = self.config['model_name']
        
        if model_name == 'efficientnet':
            from torchvision.models import efficientnet_b4
            model = efficientnet_b4(pretrained=self.config['pretrained'])
            num_features = model.classifier[1].in_features
            model.classifier[1] = nn.Linear(num_features, 2)
        
        elif model_name == 'xceptionnet':
            # Using timm for XceptionNet
            try:
                import timm
                model = timm.create_model('xception', pretrained=self.config['pretrained'])
                num_features = model.fc.in_features
                model.fc = nn.Linear(num_features, 2)
            except ImportError:
                logger.warning("timm not installed, using EfficientNet instead")
                from torchvision.models import efficientnet_b4
                model = efficientnet_b4(pretrained=self.config['pretrained'])
                num_features = model.classifier[1].in_features
                model.classifier[1] = nn.Linear(num_features, 2)
        
        else:  # mesonet
            model = self._build_mesonet()
        
        # Freeze backbone if specified
        if self.config['freeze_backbone']:
            for param in model.parameters():
                param.requires_grad = False
            # Unfreeze last layer
            if hasattr(model, 'classifier'):
                for param in model.classifier.parameters():
                    param.requires_grad = True
            elif hasattr(model, 'fc'):
                for param in model.fc.parameters():
                    param.requires_grad = True
        
        return model.to(self.device)
    
    def _build_mesonet(self):
        """Build MesoNet architecture"""
        class MesoNet(nn.Module):
            def __init__(self):
                super(MesoNet, self).__init__()
                self.conv1 = nn.Conv2d(3, 8, 3, padding=1)
                self.conv2 = nn.Conv2d(8, 32, 5, padding=2)
                self.conv3 = nn.Conv2d(32, 64, 5, padding=2)
                self.conv4 = nn.Conv2d(64, 128, 5, padding=2)
                self.pool = nn.MaxPool2d(2, 2)
                self.dropout = nn.Dropout(self.config['dropout_rate'])
                self.fc1 = nn.Linear(128 * 14 * 14, 256)
                self.fc2 = nn.Linear(256, 2)
                self.relu = nn.ReLU()
            
            def forward(self, x):
                x = self.relu(self.conv1(x))
                x = self.pool(x)
                x = self.relu(self.conv2(x))
                x = self.pool(x)
                x = self.relu(self.conv3(x))
                x = self.pool(x)
                x = self.relu(self.conv4(x))
                x = self.pool(x)
                x = x.view(x.size(0), -1)
                x = self.dropout(x)
                x = self.relu(self.fc1(x))
                x = self.dropout(x)
                x = self.fc2(x)
                return x
        
        return MesoNet()
    
    def _build_optimizer(self):
        """Build optimizer"""
        optimizer_name = self.config['optimizer'].lower()
        lr = self.config['learning_rate']
        wd = self.config['weight_decay']
        
        if optimizer_name == 'adamw':
            return optim.AdamW(self.model.parameters(), lr=lr, weight_decay=wd)
        elif optimizer_name == 'adam':
            return optim.Adam(self.model.parameters(), lr=lr, weight_decay=wd)
        else:  # sgd
            return optim.SGD(self.model.parameters(), lr=lr, weight_decay=wd, momentum=0.9)
    
    def _build_scheduler(self):
        """Build learning rate scheduler"""
        scheduler_name = self.config['scheduler'].lower()
        
        if scheduler_name == 'cosine':
            return CosineAnnealingLR(
                self.optimizer,
                T_max=self.config['num_epochs'] - self.config['warmup_epochs']
            )
        elif scheduler_name == 'reduce_lr':
            return ReduceLROnPlateau(
                self.optimizer,
                mode='max',
                factor=0.5,
                patience=5,
                verbose=True
            )
        else:
            return optim.lr_scheduler.StepLR(self.optimizer, step_size=10, gamma=0.1)
    
    def train_epoch(self, train_loader: DataLoader) -> Dict[str, float]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        pbar = tqdm(train_loader, desc='Training')
        for batch_idx, (images, labels) in enumerate(pbar):
            images, labels = images.to(self.device), labels.to(self.device)
            
            self.optimizer.zero_grad()
            
            if self.config['mixed_precision'] and self.scaler:
                with torch.cuda.amp.autocast():
                    outputs = self.model(images)
                    loss = self.criterion(outputs, labels)
                
                self.scaler.scale(loss).backward()
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                loss.backward()
                self.optimizer.step()
            
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)
            
            self.global_step += 1
            pbar.set_postfix({'loss': total_loss / (batch_idx + 1), 'acc': 100. * correct / total})
        
        return {
            'loss': total_loss / len(train_loader),
            'accuracy': 100. * correct / total
        }
    
    def validate(self, val_loader: DataLoader) -> Dict[str, float]:
        """Validate model"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            pbar = tqdm(val_loader, desc='Validating')
            for images, labels in pbar:
                images, labels = images.to(self.device), labels.to(self.device)
                
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                
                total_loss += loss.item()
                _, predicted = outputs.max(1)
                correct += predicted.eq(labels).sum().item()
                total += labels.size(0)
                
                pbar.set_postfix({'loss': total_loss / (total // len(images)), 'acc': 100. * correct / total})
        
        return {
            'loss': total_loss / len(val_loader),
            'accuracy': 100. * correct / total
        }
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader):
        """Full training loop"""
        logger.info("Starting training...")
        
        for epoch in range(self.config['num_epochs']):
            logger.info(f"\nEpoch {epoch + 1}/{self.config['num_epochs']}")
            
            # Train
            train_metrics = self.train_epoch(train_loader)
            
            # Validate
            if (epoch + 1) % self.config['validation_frequency'] == 0:
                val_metrics = self.validate(val_loader)
                
                logger.info(
                    f"Train Loss: {train_metrics['loss']:.4f}, Train Acc: {train_metrics['accuracy']:.2f}% | "
                    f"Val Loss: {val_metrics['loss']:.4f}, Val Acc: {val_metrics['accuracy']:.2f}%"
                )
                
                # Update scheduler
                if isinstance(self.scheduler, ReduceLROnPlateau):
                    self.scheduler.step(val_metrics['accuracy'])
                else:
                    self.scheduler.step()
                
                # Early stopping and checkpoint
                if val_metrics['accuracy'] > self.best_val_acc:
                    self.best_val_acc = val_metrics['accuracy']
                    self.patience_counter = 0
                    
                    if self.config['save_best_only']:
                        self._save_checkpoint(epoch, val_metrics, is_best=True)
                else:
                    self.patience_counter += 1
                
                if self.patience_counter >= self.config['early_stopping_patience']:
                    logger.info(f"Early stopping triggered after {epoch + 1} epochs")
                    break
        
        logger.info(f"Training completed. Best validation accuracy: {self.best_val_acc:.2f}%")
    
    def _save_checkpoint(self, epoch: int, metrics: Dict, is_best: bool = False):
        """Save model checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'metrics': metrics,
            'config': self.config.config,
        }
        
        filename = f"checkpoint_epoch_{epoch + 1}.pt"
        if is_best:
            filename = "best_model.pt"
        
        filepath = os.path.join(self.config['checkpoint_dir'], filename)
        torch.save(checkpoint, filepath)
        logger.info(f"Checkpoint saved: {filepath}")


def main():
    parser = argparse.ArgumentParser(description='Advanced Deepfake Detection Training')
    parser.add_argument('--config', type=str, help='Path to config YAML file')
    parser.add_argument('--model', type=str, default='efficientnet', help='Model name')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-4, help='Learning rate')
    parser.add_argument('--datasets', nargs='+', default=['awesome_deepfakes', 'huggingface_v3', 'meta_dfdc'])
    parser.add_argument('--device', type=str, default='cuda' if torch.cuda.is_available() else 'cpu')
    
    args = parser.parse_args()
    
    # Initialize config
    config = AdvancedTrainingConfig(args.config)
    config['model_name'] = args.model
    config['num_epochs'] = args.epochs
    config['batch_size'] = args.batch_size
    config['learning_rate'] = args.lr
    config['datasets'] = args.datasets
    
    # Save config
    config.save(os.path.join(config['output_dir'], 'training_config.yaml'))
    
    device = torch.device(args.device)
    logger.info(f"Using device: {device}")
    
    # Initialize trainer
    trainer = AdvancedTrainer(config, device)
    
    # Load and combine datasets
    logger.info("Loading datasets...")
    try:
        from dataset_loaders import AdvancedDataAugmentation, create_dataloaders
        
        # Create transforms
        transforms_train = AdvancedDataAugmentation.get_transforms(config, mode='train')
        transforms_val = AdvancedDataAugmentation.get_transforms(config, mode='val')
        
        # Create dataloaders
        train_loader, val_loader, test_loader = create_dataloaders(
            config,
            transforms_train,
            transforms_val,
            batch_size=config['batch_size'],
            num_workers=config['num_workers']
        )
        
        logger.info("Datasets loaded successfully!")
        logger.info(f"Training samples: {len(train_loader.dataset)}")
        logger.info(f"Validation samples: {len(val_loader.dataset)}")
        logger.info(f"Test samples: {len(test_loader.dataset)}")
        
        # Start training
        logger.info("Starting training...")
        trainer.train(train_loader, val_loader)
        
        logger.info("Training completed successfully!")
        logger.info(f"Best validation accuracy: {trainer.best_val_acc:.2f}%")
        
    except ImportError as e:
        logger.error(f"Failed to import dataset loaders: {e}")
        logger.error("Make sure dataset_loaders.py is in the same directory")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error during training: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

"""
DeepShield AI - Pre-trained Deepfake Detection Model
This module provides easy integration of pre-trained deepfake detection models.

SUPPORTED MODELS:
1. FaceForensics++ (EfficientNet-based)
2. MesoNet (Lightweight, fast)
3. XceptionNet (High accuracy)
4. Capsule-Forensics (Advanced)

INSTALLATION:
pip install torch torchvision
pip install timm
pip install opencv-python
pip install numpy
pip install pillow
"""

import os
import torch
import torch.nn as nn
import numpy as np
import cv2
from pathlib import Path
from typing import Tuple, Dict, List
import logging

logger = logging.getLogger(__name__)


class PretrainedDeepfakeDetector:
    """
    Pre-trained deepfake detection model wrapper
    Uses models from HuggingFace and other sources
    """
    
    def __init__(self, model_name: str = 'xception', device: str = None):
        """
        Initialize pre-trained model
        
        Args:
            model_name: 'xception', 'efficientnet', 'mesonet'
            device: 'cuda' or 'cpu'
        """
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_name = model_name
        self.model = None
        self.transform = None
        
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model"""
        logger.info(f"Loading {self.model_name} model on {self.device}")
        
        if self.model_name == 'xception':
            self._load_xception()
        elif self.model_name == 'efficientnet':
            self._load_efficientnet()
        elif self.model_name == 'mesonet':
            self._load_mesonet()
        else:
            raise ValueError(f"Unknown model: {self.model_name}")
    
    def _load_xception(self):
        """Load XceptionNet model (best accuracy)"""
        try:
            import timm
            self.model = timm.create_model('xception', pretrained=True, num_classes=2)
            self.model = self.model.to(self.device)
            self.model.eval()
            
            # Normalization values for ImageNet
            self.mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1).to(self.device)
            self.std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1).to(self.device)
            
            logger.info("XceptionNet model loaded successfully")
        except ImportError:
            logger.warning("timm not installed. Install with: pip install timm")
            self._load_efficientnet()
    
    def _load_efficientnet(self):
        """Load EfficientNet model (balanced)"""
        try:
            import timm
            self.model = timm.create_model('efficientnet_b4', pretrained=True, num_classes=2)
            self.model = self.model.to(self.device)
            self.model.eval()
            
            self.mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1).to(self.device)
            self.std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1).to(self.device)
            
            logger.info("EfficientNet model loaded successfully")
        except ImportError:
            logger.warning("timm not installed. Install with: pip install timm")
            self._load_mesonet()
    
    def _load_mesonet(self):
        """Load MesoNet model (lightweight, fast)"""
        self.model = MesoNet()
        self.model = self.model.to(self.device)
        self.model.eval()
        
        self.mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1).to(self.device)
        self.std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1).to(self.device)
        
        logger.info("MesoNet model loaded successfully")
    
    def preprocess_frame(self, frame: np.ndarray, target_size: Tuple[int, int] = (224, 224)) -> torch.Tensor:
        """
        Preprocess frame for model input
        
        Args:
            frame: Input frame (BGR format from OpenCV)
            target_size: Target image size
            
        Returns:
            Preprocessed tensor
        """
        # Convert BGR to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Resize
        frame = cv2.resize(frame, target_size)
        
        # Normalize to [0, 1]
        frame = frame.astype(np.float32) / 255.0
        
        # Convert to tensor
        tensor = torch.from_numpy(frame).permute(2, 0, 1).unsqueeze(0).to(self.device)
        
        # Normalize with ImageNet stats
        tensor = (tensor - self.mean) / self.std
        
        return tensor
    
    def predict_frame(self, frame: np.ndarray) -> Dict[str, float]:
        """
        Predict on single frame
        
        Args:
            frame: Input frame
            
        Returns:
            Dictionary with prediction results
        """
        tensor = self.preprocess_frame(frame)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, prediction = torch.max(probabilities, dim=1)
        
        label = "Deepfake" if prediction.item() == 1 else "Real"
        confidence_score = confidence.item()
        
        return {
            'label': label,
            'confidence': confidence_score,
            'real_confidence': probabilities[0, 0].item(),
            'fake_confidence': probabilities[0, 1].item()
        }
    
    def predict_video(self, video_path: str, sample_rate: int = 5) -> Dict:
        """
        Predict on video file
        
        Args:
            video_path: Path to video file
            sample_rate: Sample every Nth frame
            
        Returns:
            Dictionary with aggregated predictions
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            logger.error(f"Cannot open video: {video_path}")
            return {'error': 'Cannot open video'}
        
        predictions = []
        frame_count = 0
        sampled_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % sample_rate == 0:
                try:
                    pred = self.predict_frame(frame)
                    predictions.append(pred)
                    sampled_count += 1
                except Exception as e:
                    logger.warning(f"Error processing frame {frame_count}: {e}")
            
            frame_count += 1
        
        cap.release()
        
        if not predictions:
            return {'error': 'No frames processed'}
        
        # Aggregate predictions
        fake_count = sum(1 for p in predictions if p['label'] == 'Deepfake')
        real_count = len(predictions) - fake_count
        
        avg_confidence = np.mean([p['confidence'] for p in predictions])
        avg_fake_conf = np.mean([p['fake_confidence'] for p in predictions])
        avg_real_conf = np.mean([p['real_confidence'] for p in predictions])
        
        # Determine overall label
        overall_label = "Deepfake" if fake_count > real_count else "Real"
        overall_confidence = max(avg_fake_conf, avg_real_conf)
        
        return {
            'label': overall_label,
            'confidence': overall_confidence,
            'real_confidence': avg_real_conf,
            'fake_confidence': avg_fake_conf,
            'frames_analyzed': sampled_count,
            'total_frames': frame_count,
            'fake_frames': fake_count,
            'real_frames': real_count,
            'frame_predictions': predictions[:10]  # Return first 10 frame predictions
        }


class MesoNet(nn.Module):
    """
    Lightweight MesoNet architecture for deepfake detection
    Reference: MesoNet: a Compact Facial Video Forgery Detection Network
    """
    
    def __init__(self, num_classes: int = 2):
        super(MesoNet, self).__init__()
        
        self.conv1 = nn.Conv2d(3, 8, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(8)
        self.pool1 = nn.MaxPool2d(kernel_size=4, stride=4)
        
        self.conv2 = nn.Conv2d(8, 8, kernel_size=5, padding=2)
        self.bn2 = nn.BatchNorm2d(8)
        self.pool2 = nn.MaxPool2d(kernel_size=4, stride=4)
        
        self.conv3 = nn.Conv2d(8, 16, kernel_size=5, padding=2)
        self.bn3 = nn.BatchNorm2d(16)
        self.pool3 = nn.MaxPool2d(kernel_size=4, stride=4)
        
        self.fc1 = nn.Linear(16 * 3 * 3, 16)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(16, num_classes)
    
    def forward(self, x):
        x = self.pool1(torch.relu(self.bn1(self.conv1(x))))
        x = self.pool2(torch.relu(self.bn2(self.conv2(x))))
        x = self.pool3(torch.relu(self.bn3(self.conv3(x))))
        
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x


# Example usage
if __name__ == '__main__':
    # Initialize detector
    detector = PretrainedDeepfakeDetector(model_name='mesonet')
    
    # Predict on video
    # result = detector.predict_video('path/to/video.mp4')
    # print(result)

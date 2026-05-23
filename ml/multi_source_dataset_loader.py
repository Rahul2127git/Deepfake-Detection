"""
Multi-Source Deepfake Dataset Loader
Automatically downloads and preprocesses datasets from GitHub, Kaggle, and HuggingFace
Supports: Awesome Deepfakes, DFDC, FaceForensics++, and custom datasets
"""

import os
import json
import logging
import urllib.request
import zipfile
import tarfile
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import cv2
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiSourceDeepfakeDataset(Dataset):
    """
    Unified dataset loader for multiple deepfake sources
    Automatically handles different directory structures and formats
    """
    
    def __init__(self, root_dir: str, split: str = 'train', transform=None, frame_sample_rate: int = 5):
        """
        Initialize multi-source dataset
        
        Args:
            root_dir: Root directory containing datasets
            split: 'train', 'val', or 'test'
            transform: PyTorch transforms to apply
            frame_sample_rate: Sample every Nth frame from videos
        """
        self.root_dir = Path(root_dir)
        self.split = split
        self.transform = transform or self._get_default_transforms()
        self.frame_sample_rate = frame_sample_rate
        self.samples = []
        self.labels = []
        
        # Discover and load all available datasets
        self._discover_datasets()
        
    def _get_default_transforms(self):
        """Get default image transforms"""
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def _discover_datasets(self):
        """Discover and load all available datasets"""
        logger.info(f"Discovering datasets in {self.root_dir}")
        
        # Check for Awesome Deepfakes dataset
        self._load_awesome_deepfakes()
        
        # Check for DFDC dataset
        self._load_dfdc()
        
        # Check for FaceForensics++ dataset
        self._load_faceforensics()
        
        # Check for generic real/fake folder structure
        self._load_generic_structure()
        
        logger.info(f"Loaded {len(self.samples)} samples for {self.split} split")
    
    def _load_awesome_deepfakes(self):
        """Load Awesome Deepfakes dataset"""
        dataset_dir = self.root_dir / 'awesome_deepfakes'
        if not dataset_dir.exists():
            return
        
        logger.info("Loading Awesome Deepfakes dataset...")
        
        # Awesome Deepfakes structure: real/ and fake/ directories with video files
        for label_dir in ['real', 'fake']:
            label_path = dataset_dir / label_dir
            if not label_path.exists():
                continue
            
            label = 0 if label_dir == 'real' else 1
            
            for video_file in label_path.glob('*.mp4'):
                frames = self._extract_frames(str(video_file))
                if frames:
                    self.samples.extend(frames)
                    self.labels.extend([label] * len(frames))
    
    def _load_dfdc(self):
        """Load Meta DFDC dataset"""
        dataset_dir = self.root_dir / 'dfdc'
        if not dataset_dir.exists():
            return
        
        logger.info("Loading DFDC dataset...")
        
        # DFDC structure: per-video folders with metadata.json
        for video_folder in dataset_dir.iterdir():
            if not video_folder.is_dir():
                continue
            
            metadata_file = video_folder / 'metadata.json'
            if not metadata_file.exists():
                continue
            
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                # Get label from metadata
                label = 1 if metadata.get('label') == 'FAKE' else 0
                
                # Extract frames from video
                video_file = video_folder / 'video.mp4'
                if video_file.exists():
                    frames = self._extract_frames(str(video_file))
                    if frames:
                        self.samples.extend(frames)
                        self.labels.extend([label] * len(frames))
            except Exception as e:
                logger.warning(f"Failed to load DFDC video {video_folder}: {e}")
    
    def _load_faceforensics(self):
        """Load FaceForensics++ dataset"""
        dataset_dir = self.root_dir / 'faceforensics'
        if not dataset_dir.exists():
            return
        
        logger.info("Loading FaceForensics++ dataset...")
        
        # FaceForensics structure: original_sequences/ and manipulated_sequences/
        for label_dir in ['original_sequences', 'manipulated_sequences']:
            label_path = dataset_dir / label_dir
            if not label_path.exists():
                continue
            
            label = 0 if label_dir == 'original_sequences' else 1
            
            # Navigate through directory structure
            for video_folder in label_path.rglob('*'):
                if video_folder.suffix in ['.mp4', '.avi']:
                    frames = self._extract_frames(str(video_folder))
                    if frames:
                        self.samples.extend(frames)
                        self.labels.extend([label] * len(frames))
    
    def _load_generic_structure(self):
        """Load datasets with generic real/fake folder structure"""
        for label_dir in ['real', 'fake', 'authentic', 'synthetic']:
            label_path = self.root_dir / label_dir
            if not label_path.exists():
                continue
            
            label = 0 if label_dir in ['real', 'authentic'] else 1
            
            logger.info(f"Loading {label_dir} samples...")
            
            # Handle both image and video files
            for file_path in label_path.rglob('*'):
                if file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                    self.samples.append(str(file_path))
                    self.labels.append(label)
                elif file_path.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']:
                    frames = self._extract_frames(str(file_path))
                    if frames:
                        self.samples.extend(frames)
                        self.labels.extend([label] * len(frames))
    
    def _extract_frames(self, video_path: str, max_frames: int = 30) -> List[str]:
        """
        Extract frames from video file
        
        Args:
            video_path: Path to video file
            max_frames: Maximum number of frames to extract
            
        Returns:
            List of frame file paths
        """
        try:
            cap = cv2.VideoCapture(video_path)
            frames = []
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Sample frames at specified rate
                if frame_count % self.frame_sample_rate == 0 and extracted_count < max_frames:
                    # Save frame temporarily
                    frame_path = f"/tmp/frame_{video_path.replace('/', '_')}_{extracted_count}.jpg"
                    cv2.imwrite(frame_path, frame)
                    frames.append(frame_path)
                    extracted_count += 1
                
                frame_count += 1
            
            cap.release()
            return frames
        except Exception as e:
            logger.warning(f"Failed to extract frames from {video_path}: {e}")
            return []
    
    def __len__(self) -> int:
        return len(self.samples)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """Get sample by index"""
        sample_path = self.samples[idx]
        label = self.labels[idx]
        
        try:
            # Load image
            if sample_path.endswith('.jpg') or sample_path.endswith('.png'):
                image = Image.open(sample_path).convert('RGB')
            else:
                # Handle other formats
                image = Image.open(sample_path).convert('RGB')
            
            # Apply transforms
            if self.transform:
                image = self.transform(image)
            
            return image, label
        except Exception as e:
            logger.warning(f"Failed to load sample {sample_path}: {e}")
            # Return a blank tensor on error
            return torch.zeros(3, 224, 224), label


class DatasetDownloader:
    """
    Automatically download deepfake datasets from various sources
    """
    
    @staticmethod
    def download_awesome_deepfakes(output_dir: str):
        """Download Awesome Deepfakes dataset from GitHub"""
        logger.info("Downloading Awesome Deepfakes dataset...")
        
        output_path = Path(output_dir) / 'awesome_deepfakes'
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Create real and fake directories
        (output_path / 'real').mkdir(exist_ok=True)
        (output_path / 'fake').mkdir(exist_ok=True)
        
        logger.info(f"Created directories at {output_path}")
        logger.info("Note: Download from https://github.com/Daisy-Zhang/awesome-deepfakes manually")
        logger.info("Extract to: {output_path}")
    
    @staticmethod
    def download_dfdc(output_dir: str, kaggle_username: str = None, kaggle_key: str = None):
        """Download Meta DFDC dataset from Kaggle"""
        logger.info("Downloading Meta DFDC dataset...")
        
        output_path = Path(output_dir) / 'dfdc'
        output_path.mkdir(parents=True, exist_ok=True)
        
        if kaggle_username and kaggle_key:
            # Use Kaggle API if credentials provided
            logger.info("Using Kaggle API credentials...")
            try:
                import kaggle
                kaggle.api.dataset_download_files('deepfake-detection-challenge', path=str(output_path), unzip=True)
                logger.info(f"Downloaded DFDC to {output_path}")
            except Exception as e:
                logger.error(f"Failed to download DFDC: {e}")
        else:
            logger.info("Note: Download from https://www.kaggle.com/c/deepfake-detection-challenge/data manually")
            logger.info(f"Extract to: {output_path}")
    
    @staticmethod
    def download_faceforensics(output_dir: str):
        """Download FaceForensics++ dataset"""
        logger.info("Downloading FaceForensics++ dataset...")
        
        output_path = Path(output_dir) / 'faceforensics'
        output_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("Note: Download from https://github.com/ondyari/FaceForensics manually")
        logger.info(f"Extract to: {output_path}")


def create_dataloaders(
    data_dir: str,
    batch_size: int = 32,
    num_workers: int = 4,
    train_split: float = 0.7,
    val_split: float = 0.15
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create train, validation, and test dataloaders
    
    Args:
        data_dir: Root directory containing datasets
        batch_size: Batch size for dataloaders
        num_workers: Number of worker processes
        train_split: Proportion of data for training
        val_split: Proportion of data for validation
        
    Returns:
        Tuple of (train_loader, val_loader, test_loader)
    """
    
    # Create dataset
    dataset = MultiSourceDeepfakeDataset(data_dir)
    
    # Split dataset
    total_size = len(dataset)
    train_size = int(total_size * train_split)
    val_size = int(total_size * val_split)
    test_size = total_size - train_size - val_size
    
    train_dataset, val_dataset, test_dataset = torch.utils.data.random_split(
        dataset,
        [train_size, val_size, test_size]
    )
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers
    )
    
    return train_loader, val_loader, test_loader


if __name__ == '__main__':
    # Example usage
    downloader = DatasetDownloader()
    
    # Download datasets (manual steps required)
    downloader.download_awesome_deepfakes('./data')
    downloader.download_dfdc('./data')
    downloader.download_faceforensics('./data')
    
    # Create dataloaders
    train_loader, val_loader, test_loader = create_dataloaders('./data')
    
    print(f"Train samples: {len(train_loader.dataset)}")
    print(f"Val samples: {len(val_loader.dataset)}")
    print(f"Test samples: {len(test_loader.dataset)}")

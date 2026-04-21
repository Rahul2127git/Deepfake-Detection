"""
Dataset Loaders for Deepfake Detection
Supports: Awesome Deepfakes, HuggingFace v3, Meta DFDC
"""

import os
import torch
import cv2
import numpy as np
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import logging
from PIL import Image
import json
from tqdm import tqdm

logger = logging.getLogger(__name__)


class DeepfakeDataset(Dataset):
    """Base class for deepfake datasets"""
    
    def __init__(self, image_paths: List[str], labels: List[int], transforms=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transforms = transforms
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]
        
        # Load image
        image = Image.open(img_path).convert('RGB')
        
        if self.transforms:
            image = self.transforms(image)
        
        return image, label


class AwesomeDeepfakesDataset(Dataset):
    """
    Awesome Deepfakes Dataset Loader
    GitHub: https://github.com/Daisy-Zhang/awesome-deepfakes
    
    Expected structure:
    data/awesome_deepfakes/
    ├── real/
    │   ├── video1/
    │   │   ├── frame_0.jpg
    │   │   ├── frame_1.jpg
    │   │   └── ...
    │   └── video2/
    └── fake/
        ├── video1/
        └── ...
    """
    
    def __init__(self, root_dir: str, transforms=None, max_frames_per_video: int = 30):
        self.root_dir = Path(root_dir)
        self.transforms = transforms
        self.max_frames_per_video = max_frames_per_video
        self.image_paths = []
        self.labels = []
        
        self._load_dataset()
    
    def _load_dataset(self):
        """Load all images from the dataset"""
        logger.info(f"Loading Awesome Deepfakes dataset from {self.root_dir}")
        
        # Load real videos
        real_dir = self.root_dir / 'real'
        if real_dir.exists():
            for video_dir in tqdm(real_dir.iterdir(), desc='Loading real videos'):
                if video_dir.is_dir():
                    frames = sorted(video_dir.glob('*.jpg'))[:self.max_frames_per_video]
                    for frame in frames:
                        self.image_paths.append(str(frame))
                        self.labels.append(0)  # Real
        
        # Load fake videos
        fake_dir = self.root_dir / 'fake'
        if fake_dir.exists():
            for video_dir in tqdm(fake_dir.iterdir(), desc='Loading fake videos'):
                if video_dir.is_dir():
                    frames = sorted(video_dir.glob('*.jpg'))[:self.max_frames_per_video]
                    for frame in frames:
                        self.image_paths.append(str(frame))
                        self.labels.append(1)  # Fake
        
        logger.info(f"Loaded {len(self.image_paths)} images")
        logger.info(f"Real: {sum(1 for l in self.labels if l == 0)}, Fake: {sum(1 for l in self.labels if l == 1)}")
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            logger.warning(f"Failed to load {img_path}: {e}")
            # Return a black image as fallback
            image = Image.new('RGB', (224, 224), color='black')
        
        if self.transforms:
            image = self.transforms(image)
        
        return image, label


class HuggingFaceDeepfakeV3Dataset(Dataset):
    """
    HuggingFace Deepfake Detection Dataset V3 Loader
    URL: https://huggingface.co/datasets/saakshigupta/deepfake-detection-dataset-v3
    
    Expected structure:
    data/huggingface_v3/
    ├── train/
    │   ├── real/
    │   │   ├── image1.jpg
    │   │   └── ...
    │   └── fake/
    │       ├── image1.jpg
    │       └── ...
    ├── val/
    └── test/
    """
    
    def __init__(self, root_dir: str, split: str = 'train', transforms=None):
        self.root_dir = Path(root_dir)
        self.split = split
        self.transforms = transforms
        self.image_paths = []
        self.labels = []
        
        self._load_dataset()
    
    def _load_dataset(self):
        """Load dataset from HuggingFace structure"""
        logger.info(f"Loading HuggingFace Deepfake V3 dataset ({self.split}) from {self.root_dir}")
        
        split_dir = self.root_dir / self.split
        if not split_dir.exists():
            logger.warning(f"Split directory {split_dir} does not exist")
            return
        
        # Load real images
        real_dir = split_dir / 'real'
        if real_dir.exists():
            for img_path in tqdm(real_dir.glob('*.jpg'), desc=f'Loading {self.split} real images'):
                self.image_paths.append(str(img_path))
                self.labels.append(0)
        
        # Load fake images
        fake_dir = split_dir / 'fake'
        if fake_dir.exists():
            for img_path in tqdm(fake_dir.glob('*.jpg'), desc=f'Loading {self.split} fake images'):
                self.image_paths.append(str(img_path))
                self.labels.append(1)
        
        logger.info(f"Loaded {len(self.image_paths)} images from {self.split}")
        logger.info(f"Real: {sum(1 for l in self.labels if l == 0)}, Fake: {sum(1 for l in self.labels if l == 1)}")
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            logger.warning(f"Failed to load {img_path}: {e}")
            image = Image.new('RGB', (224, 224), color='black')
        
        if self.transforms:
            image = self.transforms(image)
        
        return image, label


class MetaDFDCDataset(Dataset):
    """
    Meta DFDC (Deepfake Detection Challenge) Dataset Loader
    URL: https://ai.meta.com/datasets/dfdc/
    
    Expected structure:
    data/meta_dfdc/
    ├── train/
    │   ├── aagfhgtpmv/
    │   │   ├── 000.jpg
    │   │   ├── 001.jpg
    │   │   └── metadata.json
    │   └── ...
    ├── val/
    └── test/
    """
    
    def __init__(self, root_dir: str, split: str = 'train', transforms=None, max_frames_per_video: int = 30):
        self.root_dir = Path(root_dir)
        self.split = split
        self.transforms = transforms
        self.max_frames_per_video = max_frames_per_video
        self.image_paths = []
        self.labels = []
        
        self._load_dataset()
    
    def _load_dataset(self):
        """Load dataset from Meta DFDC structure"""
        logger.info(f"Loading Meta DFDC dataset ({self.split}) from {self.root_dir}")
        
        split_dir = self.root_dir / self.split
        if not split_dir.exists():
            logger.warning(f"Split directory {split_dir} does not exist")
            return
        
        # Iterate through video directories
        for video_dir in tqdm(split_dir.iterdir(), desc=f'Loading {self.split} videos'):
            if not video_dir.is_dir():
                continue
            
            # Load metadata
            metadata_path = video_dir / 'metadata.json'
            label = 0  # Default to real
            
            if metadata_path.exists():
                try:
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                        # Check if video is fake
                        if 'label' in metadata:
                            label = 1 if metadata['label'] == 'FAKE' else 0
                        elif 'fake' in metadata:
                            label = 1 if metadata['fake'] else 0
                except Exception as e:
                    logger.warning(f"Failed to load metadata from {metadata_path}: {e}")
            
            # Load frames
            frames = sorted(video_dir.glob('*.jpg'))[:self.max_frames_per_video]
            for frame in frames:
                self.image_paths.append(str(frame))
                self.labels.append(label)
        
        logger.info(f"Loaded {len(self.image_paths)} images from {self.split}")
        logger.info(f"Real: {sum(1 for l in self.labels if l == 0)}, Fake: {sum(1 for l in self.labels if l == 1)}")
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            logger.warning(f"Failed to load {img_path}: {e}")
            image = Image.new('RGB', (224, 224), color='black')
        
        if self.transforms:
            image = self.transforms(image)
        
        return image, label


class CombinedDeepfakeDataset(Dataset):
    """Combine multiple deepfake datasets"""
    
    def __init__(self, datasets: List[Dataset]):
        self.datasets = datasets
        self.cumulative_sizes = []
        total = 0
        
        for dataset in datasets:
            total += len(dataset)
            self.cumulative_sizes.append(total)
    
    def __len__(self):
        return self.cumulative_sizes[-1]
    
    def __getitem__(self, idx):
        dataset_idx = 0
        for cum_size in self.cumulative_sizes:
            if idx < cum_size:
                break
            dataset_idx += 1
        
        sample_idx = idx if dataset_idx == 0 else idx - self.cumulative_sizes[dataset_idx - 1]
        return self.datasets[dataset_idx][sample_idx]


def create_dataloaders(
    config: Dict,
    transforms_train,
    transforms_val,
    batch_size: int = 32,
    num_workers: int = 4,
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create dataloaders for all specified datasets
    
    Args:
        config: Configuration dictionary with dataset paths
        transforms_train: Training transforms
        transforms_val: Validation transforms
        batch_size: Batch size
        num_workers: Number of workers
    
    Returns:
        Tuple of (train_loader, val_loader, test_loader)
    """
    
    datasets_list = []
    
    # Load Awesome Deepfakes
    awesome_path = os.path.join(config['data_root'], 'awesome_deepfakes')
    if os.path.exists(awesome_path):
        logger.info("Loading Awesome Deepfakes dataset...")
        awesome_dataset = AwesomeDeepfakesDataset(awesome_path, transforms=transforms_train)
        datasets_list.append(awesome_dataset)
    
    # Load HuggingFace V3
    hf_path = os.path.join(config['data_root'], 'huggingface_v3')
    if os.path.exists(hf_path):
        logger.info("Loading HuggingFace Deepfake V3 dataset...")
        hf_dataset = HuggingFaceDeepfakeV3Dataset(hf_path, split='train', transforms=transforms_train)
        datasets_list.append(hf_dataset)
    
    # Load Meta DFDC
    meta_path = os.path.join(config['data_root'], 'meta_dfdc')
    if os.path.exists(meta_path):
        logger.info("Loading Meta DFDC dataset...")
        meta_dataset = MetaDFDCDataset(meta_path, split='train', transforms=transforms_train)
        datasets_list.append(meta_dataset)
    
    if not datasets_list:
        raise ValueError("No datasets found. Please download and place datasets in data_root directory.")
    
    # Combine datasets
    combined_dataset = CombinedDeepfakeDataset(datasets_list) if len(datasets_list) > 1 else datasets_list[0]
    
    # Split dataset
    train_size = int(len(combined_dataset) * config['train_split'])
    val_size = int(len(combined_dataset) * config['val_split'])
    test_size = len(combined_dataset) - train_size - val_size
    
    train_dataset, val_dataset, test_dataset = torch.utils.data.random_split(
        combined_dataset,
        [train_size, val_size, test_size]
    )
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    logger.info(f"Train samples: {len(train_dataset)}")
    logger.info(f"Val samples: {len(val_dataset)}")
    logger.info(f"Test samples: {len(test_dataset)}")
    
    return train_loader, val_loader, test_loader

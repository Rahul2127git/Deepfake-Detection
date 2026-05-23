"""
Advanced Preprocessing Pipeline for Deepfake Detection
Includes face detection, alignment, augmentation, and normalization
"""

import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from torchvision.transforms import functional as F
from PIL import Image, ImageEnhance
import logging
from typing import Tuple, List, Optional
import dlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedPreprocessor:
    """
    Advanced preprocessing with face detection, alignment, and augmentation
    """
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224), use_face_detection: bool = True):
        """
        Initialize preprocessor
        
        Args:
            target_size: Target image size (height, width)
            use_face_detection: Whether to detect and align faces
        """
        self.target_size = target_size
        self.use_face_detection = use_face_detection
        
        # Initialize face detector (using OpenCV Haar Cascade)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Try to load dlib face detector if available
        self.dlib_detector = None
        try:
            self.dlib_detector = dlib.get_frontal_face_detector()
            logger.info("dlib face detector loaded")
        except Exception as e:
            logger.warning(f"dlib not available: {e}")
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in image using multiple methods
        
        Args:
            image: Input image (BGR format)
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        faces = []
        
        # Convert to grayscale for detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Haar Cascade detection
        haar_faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        faces.extend([(x, y, w, h) for x, y, w, h in haar_faces])
        
        # dlib detection (if available)
        if self.dlib_detector is not None:
            try:
                dlib_faces = self.dlib_detector(gray, 1)
                for face in dlib_faces:
                    x, y, w, h = face.left(), face.top(), face.width(), face.height()
                    faces.append((x, y, w, h))
            except Exception as e:
                logger.warning(f"dlib detection failed: {e}")
        
        return faces
    
    def align_face(self, image: np.ndarray, face_box: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Extract and align face from image
        
        Args:
            image: Input image
            face_box: Face bounding box (x, y, w, h)
            
        Returns:
            Aligned face image or None if alignment fails
        """
        try:
            x, y, w, h = face_box
            
            # Add padding around face
            padding = int(0.2 * max(w, h))
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image.shape[1] - x, w + 2 * padding)
            h = min(image.shape[0] - y, h + 2 * padding)
            
            # Extract face region
            face = image[y:y+h, x:x+w]
            
            # Resize to target size
            face = cv2.resize(face, self.target_size, interpolation=cv2.INTER_CUBIC)
            
            return face
        except Exception as e:
            logger.warning(f"Face alignment failed: {e}")
            return None
    
    def preprocess_image(self, image_path: str, apply_augmentation: bool = False) -> Optional[torch.Tensor]:
        """
        Preprocess single image
        
        Args:
            image_path: Path to image file
            apply_augmentation: Whether to apply augmentation
            
        Returns:
            Preprocessed image tensor or None if preprocessing fails
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                logger.warning(f"Failed to read image: {image_path}")
                return None
            
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect and extract face if enabled
            if self.use_face_detection:
                faces = self.detect_faces(cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
                if faces:
                    # Use largest face
                    largest_face = max(faces, key=lambda f: f[2] * f[3])
                    face_image = self.align_face(image, largest_face)
                    if face_image is not None:
                        image = face_image
                    else:
                        # Fallback to resize if alignment fails
                        image = cv2.resize(image, self.target_size, interpolation=cv2.INTER_CUBIC)
                else:
                    # No face detected, just resize
                    image = cv2.resize(image, self.target_size, interpolation=cv2.INTER_CUBIC)
            else:
                # Just resize without face detection
                image = cv2.resize(image, self.target_size, interpolation=cv2.INTER_CUBIC)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(image)
            
            # Apply augmentation if requested
            if apply_augmentation:
                pil_image = self._apply_augmentation(pil_image)
            
            # Convert to tensor with normalization
            tensor = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])(pil_image)
            
            return tensor
        except Exception as e:
            logger.error(f"Failed to preprocess image {image_path}: {e}")
            return None
    
    def preprocess_video(self, video_path: str, frame_sample_rate: int = 5, max_frames: int = 30) -> List[torch.Tensor]:
        """
        Preprocess video by extracting and processing frames
        
        Args:
            video_path: Path to video file
            frame_sample_rate: Sample every Nth frame
            max_frames: Maximum number of frames to extract
            
        Returns:
            List of preprocessed frame tensors
        """
        frames = []
        try:
            cap = cv2.VideoCapture(video_path)
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Sample frames
                if frame_count % frame_sample_rate == 0 and extracted_count < max_frames:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Detect and extract face
                    if self.use_face_detection:
                        faces = self.detect_faces(frame)
                        if faces:
                            largest_face = max(faces, key=lambda f: f[2] * f[3])
                            face_frame = self.align_face(frame_rgb, largest_face)
                            if face_frame is not None:
                                frame_rgb = face_frame
                            else:
                                frame_rgb = cv2.resize(frame_rgb, self.target_size, interpolation=cv2.INTER_CUBIC)
                        else:
                            frame_rgb = cv2.resize(frame_rgb, self.target_size, interpolation=cv2.INTER_CUBIC)
                    else:
                        frame_rgb = cv2.resize(frame_rgb, self.target_size, interpolation=cv2.INTER_CUBIC)
                    
                    # Convert to tensor
                    pil_frame = Image.fromarray(frame_rgb)
                    tensor = transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize(
                            mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225]
                        )
                    ])(pil_frame)
                    
                    frames.append(tensor)
                    extracted_count += 1
                
                frame_count += 1
            
            cap.release()
            logger.info(f"Extracted {len(frames)} frames from {video_path}")
            return frames
        except Exception as e:
            logger.error(f"Failed to preprocess video {video_path}: {e}")
            return []
    
    def _apply_augmentation(self, image: Image.Image) -> Image.Image:
        """
        Apply random augmentations to image
        
        Args:
            image: PIL Image
            
        Returns:
            Augmented image
        """
        # Random rotation
        if np.random.random() > 0.5:
            angle = np.random.randint(-15, 15)
            image = image.rotate(angle, expand=False)
        
        # Random horizontal flip
        if np.random.random() > 0.5:
            image = image.transpose(Image.FLIP_LEFT_RIGHT)
        
        # Random brightness adjustment
        if np.random.random() > 0.5:
            enhancer = ImageEnhance.Brightness(image)
            factor = np.random.uniform(0.7, 1.3)
            image = enhancer.enhance(factor)
        
        # Random contrast adjustment
        if np.random.random() > 0.5:
            enhancer = ImageEnhance.Contrast(image)
            factor = np.random.uniform(0.7, 1.3)
            image = enhancer.enhance(factor)
        
        # Random color adjustment
        if np.random.random() > 0.5:
            enhancer = ImageEnhance.Color(image)
            factor = np.random.uniform(0.7, 1.3)
            image = enhancer.enhance(factor)
        
        # Random sharpness adjustment
        if np.random.random() > 0.5:
            enhancer = ImageEnhance.Sharpness(image)
            factor = np.random.uniform(0.7, 1.3)
            image = enhancer.enhance(factor)
        
        return image


class AugmentationTransforms:
    """
    Advanced augmentation transforms for training
    """
    
    @staticmethod
    def get_train_transforms(target_size: Tuple[int, int] = (224, 224)):
        """Get training transforms with augmentation"""
        return transforms.Compose([
            transforms.RandomRotation(15),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
            transforms.RandomPerspective(distortion_scale=0.2, p=0.5),
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
            transforms.Resize(target_size),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    @staticmethod
    def get_val_transforms(target_size: Tuple[int, int] = (224, 224)):
        """Get validation transforms without augmentation"""
        return transforms.Compose([
            transforms.Resize(target_size),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    @staticmethod
    def get_test_transforms(target_size: Tuple[int, int] = (224, 224)):
        """Get test transforms without augmentation"""
        return transforms.Compose([
            transforms.Resize(target_size),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])


if __name__ == '__main__':
    # Example usage
    preprocessor = AdvancedPreprocessor(target_size=(224, 224), use_face_detection=True)
    
    # Preprocess image
    image_tensor = preprocessor.preprocess_image('sample_image.jpg', apply_augmentation=True)
    if image_tensor is not None:
        print(f"Image tensor shape: {image_tensor.shape}")
    
    # Preprocess video
    video_frames = preprocessor.preprocess_video('sample_video.mp4', frame_sample_rate=5, max_frames=30)
    print(f"Extracted {len(video_frames)} frames")

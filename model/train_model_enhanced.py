"""
ENHANCED Training Script for YOLOv8 with Advanced Augmentation
Designed to maximize model performance with improved data handling
"""

import os
import sys
from pathlib import Path
import logging
import torch
from ultralytics import YOLO
import yaml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set device
device = 0 if torch.cuda.is_available() else "cpu"
if device == 0:
    logger.info(f"✓ Using GPU: {torch.cuda.get_device_name()}")
    logger.info(f"  CUDA Memory: {torch.cuda.get_device_properties(device).total_memory / 1e9:.2f}GB")
else:
    logger.info("⚠ GPU not available, using CPU (slower)")

class EnhancedTrainer:
    """Enhanced YOLOv8 trainer with advanced configurations"""
    
    def __init__(self, data_yaml_path, model_name="yolov8m", project_name="infrastructure_damage_enhanced"):
        """
        Initialize trainer
        
        Args:
            data_yaml_path: Path to data.yaml file
            model_name: Model size (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
            project_name: Project directory name
        """
        self.data_yaml = data_yaml_path
        self.model_name = model_name
        self.project_name = project_name
        
        # Load model
        logger.info(f"\n📦 Loading {model_name} model...")
        self.model = YOLO(f'{model_name}.pt')
        logger.info(f"✓ Model loaded successfully")
    
    def get_enhanced_training_args(self):
        """Get optimized training arguments"""
        
        return {
            # Data configuration
            'data': self.data_yaml,
            'imgsz': 640,  # Image size (can use 384 if memory constrained, 640 for better)
            'epochs': 100,  # Full training
            'batch': 32,   # Batch size (reduce to 16 or 8 if out of memory)
            
            # Optimization
            'optimizer': 'SGD',  # SGD or Adam - SGD often better for detection
            'lr0': 0.01,  # Initial learning rate
            'lrf': 0.01,  # Final learning rate
            'momentum': 0.937,
            'weight_decay': 0.0005,
            'warmup_epochs': 3.0,
            'warmup_bias_lr': 0.1,
            'label_smoothing': 0.1,
            
            # Augmentation (ENHANCED)
            'hsv_h': 0.015,  # HSV hue augmentation
            'hsv_s': 0.7,    # HSV saturation augmentation
            'hsv_v': 0.4,    # HSV value augmentation
            'degrees': 45,   # Rotation ±45 degrees
            'translate': 0.1,  # Image translate ±10%
            'scale': 0.5,    # Image scale ±50%
            'flipud': 0.5,   # Flip upside-down
            'fliplr': 0.5,   # Flip left-right
            'perspective': 0.0,  # Perspective augmentation
            'mosaic': 1.0,   # Mosaic augmentation
            'mixup': 0.1,    # Image mixup (0.0 to 1.0)
            'copy_paste': 0.1,  # Segment copy-paste
            'auto_augment': 'randaugment',  # Auto augmentation policy
            'erasing': 0.4,  # Random erasing with probability
            
            # Training configuration
            'patience': 50,   # Early stopping (50 epochs without improvement)
            'device': device,
            'workers': 4,  # Data loader workers
            'seed': 42,
            'deterministic': True,
            
            # Validation & Testing
            'val': True,
            'save': True,
            'save_period': 5,  # Save every 5 epochs
            'cache': 'ram',  # Cache images in RAM for speed
            'rect': False,  # Rectangular training
            'fraction': 1.0,  # Use 100% of training data
            
            # Logging & Tracking
            'project': f'runs/train/{self.project_name}',
            'name': 'weights',
            'exist_ok': False,  # Don't overwrite existing
            'verbose': True,
            'plots': True,  # Save training plots
            
            # IoU loss and NMS
            'iou': 0.6,  # IoU threshold for NMS
            'conf': 0.25,  # Confidence threshold
            'max_det': 300,  # Maximum detections
            
            # Callback settings
            'close_mosaic': 10,  # Close mosaic augmentation last 10 epochs
            'amp': True,  # Automatic mixed precision
        }
    
    def train(self):
        """Execute training with enhanced configuration"""
        
        logger.info("\n" + "="*70)
        logger.info("🚀 STARTING ENHANCED YOLOV8 TRAINING")
        logger.info("="*70)
        
        args = self.get_enhanced_training_args()
        
        logger.info("\n📋 Training Configuration:")
        logger.info(f"  Model: {self.model_name}")
        logger.info(f"  Dataset: {self.data_yaml}")
        logger.info(f"  Epochs: {args['epochs']}")
        logger.info(f"  Batch Size: {args['batch']}")
        logger.info(f"  Image Size: {args['imgsz']}x{args['imgsz']}")
        logger.info(f"  Optimizer: {args['optimizer']}")
        logger.info(f"  Learning Rate: {args['lr0']} (final: {args['lrf']})")
        logger.info(f"  Device: {'GPU' if args['device'] == 0 else 'CPU'}")
        logger.info(f"  Augmentation: ENHANCED (mosaic, mixup, auto_augment, etc.)")
        
        # Train
        logger.info(f"\n▶️  Starting training...")
        results = self.model.train(**args)
        
        logger.info("\n" + "="*70)
        logger.info("✅ TRAINING COMPLETE!")
        logger.info("="*70)
        
        # Print results summary
        if results:
            logger.info(f"\n📊 Final Results:")
            logger.info(f"  Total epochs trained: {len(results.times)}")
            
            # Get best metrics from results
            if hasattr(results, 'results_dict'):
                logger.info(f"  Best mAP50: {results.results_dict.get('metrics/mAP50(B)', 'N/A')}")
        
        return results
    
    def validate(self):
        """Validate model"""
        logger.info("\n" + "="*70)
        logger.info("🔍 VALIDATING MODEL")
        logger.info("="*70)
        
        metrics = self.model.val()
        return metrics
    
    def test(self):
        """Test model on test dataset"""
        logger.info("\n" + "="*70)
        logger.info("🧪 TESTING MODEL ON TEST SET")
        logger.info("="*70)
        
        # Test folder path
        test_dir = Path(self.data_yaml).parent / "images" / "test"
        
        if test_dir.exists():
            results = self.model.predict(source=str(test_dir), save=True, device=device)
            logger.info(f"✓ Test predictions saved")
        else:
            logger.warning(f"⚠ Test directory not found: {test_dir}")

def get_available_models():
    """Get available YOLO models with recommendations"""
    return {
        'yolov8n': {'name': 'Nano', 'params': '3.2M', 'speed': 'Very Fast', 'ram': '1GB', 'recommended': False},
        'yolov8s': {'name': 'Small', 'params': '11.1M', 'speed': 'Fast', 'ram': '2GB', 'recommended': False},
        'yolov8m': {'name': 'Medium', 'params': '25.9M', 'speed': 'Balanced', 'ram': '4GB', 'recommended': True},
        'yolov8l': {'name': 'Large', 'params': '43.7M', 'speed': 'Slower', 'ram': '8GB', 'recommended': False},
        'yolov8x': {'name': 'X-Large', 'params': '68.2M', 'speed': 'Very Slow', 'ram': '12GB', 'recommended': False},
    }

def main():
    """Main training entry point"""
    
    logger.info("🔧 Infrastructure Damage Detection - Enhanced Training")
    logger.info("="*70)
    
    # Path to enhanced dataset
    enhanced_dataset_path = Path("datasets/combined_dataset_v2/data.yaml")
    
    if not enhanced_dataset_path.exists():
        # Try alternative paths
        alt_path = Path(__file__).parent / "datasets" / "combined_dataset_v2" / "data.yaml"
        if alt_path.exists():
            enhanced_dataset_path = alt_path
        else:
            logger.error(f"❌ Dataset not found at {enhanced_dataset_path}")
            logger.info("\nRun prepare_dataset_enhanced.py first to prepare the dataset")
            sys.exit(1)
    
    logger.info(f"📦 Using dataset: {enhanced_dataset_path}")
    
    # Model selection
    models = get_available_models()
    logger.info("\n📋 Available Models:")
    for model_key, model_info in models.items():
        rec = " ⭐ RECOMMENDED" if model_info.get('recommended') else ""
        logger.info(f"  {model_key:10s}: {model_info['name']:12s} - "
                   f"Params: {model_info['params']:8s} | "
                   f"RAM: {model_info['ram']:6s}{rec}")
    
    # Use medium model (recommended for this GPU)
    model_choice = 'yolov8m'
    logger.info(f"\n✓ Using model: {model_choice}")
    
    # Create trainer and train
    trainer = EnhancedTrainer(
        data_yaml_path=str(enhanced_dataset_path),
        model_name=model_choice,
        project_name='infrastructure_damage_enhanced'
    )
    
    # Train
    trainer.train()
    
    # Validate
    logger.info("\n" + "="*70)
    if input("\nRun validation? (y/n): ").lower() == 'y':
        trainer.validate()
    
    # Test
    if input("Run testing? (y/n): ").lower() == 'y':
        trainer.test()
    
    logger.info("\n" + "="*70)
    logger.info("✅ Training Complete!")
    logger.info(f"   Results saved in: runs/train/infrastructure_damage_enhanced/")
    logger.info(f"\n💡 Next steps:")
    logger.info(f"   1. Review training plots: runs/train/infrastructure_damage_enhanced/weights/results.png")
    logger.info(f"   2. Copy best model: runs/train/infrastructure_damage_enhanced/weights/best.pt")
    logger.info(f"   3. Update detection service with new model")
    logger.info(f"   4. Run inference tests")

if __name__ == "__main__":
    main()

# YOLOv8 Model Training Guide

## Overview
This guide walks you through training the YOLOv8 model using your three datasets (Archive 2, 3, and 4).

## Datasets

### Archive 2: Cracked Classification
- **Location**: `archive (2)/Decks/Cracked/` and `Non-cracked/`
- **Type**: Binary classification (crack vs non-crack)
- **Class**: 0 = crack
- **Usage**: Training data for crack detection

### Archive 3: Road Issues
- **Location**: `archive (3)/data/Road Issues/`
- **Categories**:
  - Pothole Issues → Class 1
  - Damaged Road issues → Class 2
  - Broken Road Sign Issues → Class 3
  - Illegal Parking Issues → Class 3
  - Mixed Issues → Class 3
- **Type**: Multi-class classification
- **Usage**: Training data for various infrastructure damage types

### Archive 4: Segmentation with Masks
- **Location**: `archive (4)/Images/` and `Masks/`
- **Images**: 118 JPG files (001.jpg - 118.jpg)
- **Masks**: 118 PNG files (001_label.PNG - 118_label.PNG)
- **Type**: Semantic segmentation with pixel-level labels
- **Conversion**: Masks are automatically converted to bounding boxes for YOLOv8 training
- **Usage**: Training data for precise damage localization

## Class Mapping

| Class ID | Class Name | Source | Description |
|----------|-----------|--------|-------------|
| 0 | crack | Archive 2 | Structural cracks in surfaces |
| 1 | pothole | Archive 3 | Road surface potholes |
| 2 | structural | Archive 3 | Damaged road/pavement |
| 3 | mixed | Archive 3/4 | Mixed or other damage types |

## Training Pipeline

### Step 1: Prepare Environment
```bash
# Navigate to project root
cd "c:\Users\asus\Downloads\Road portfolio\infrastructure-damage-detection"

# Create Python virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # On Windows
```

### Step 2: Prepare Dataset
The training script automatically:
1. Scans all three archives
2. Converts segmentation masks to bounding boxes
3. Organizes images into YOLO format
4. Creates train/val/test splits (80/10/10)
5. Generates data.yaml configuration file

**Output Location**: `model/datasets/combined_dataset/`

### Step 3: Run Training

#### Automatic Training (Recommended)
```bash
python model/train_model.py
```

This runs the complete pipeline:
- ✓ Installs dependencies
- ✓ Prepares datasets
- ✓ Trains model (100 epochs)
- ✓ Validates results
- ✓ Tests inference

#### Manual Steps
```bash
# 1. Prepare dataset
python model/prepare_dataset.py

# 2. Train model directly
python model/train.py --action train --data model/datasets/combined_dataset/data.yaml --epochs 100 --batch-size 16
```

## Training Configuration

### Model Details
- **Architecture**: YOLOv8 Medium
- **Input Size**: 640×640 pixels
- **Batch Size**: 16
- **Epochs**: 100
- **Learning Rate**: Auto (default)
- **Augmentation**: Enabled (mosaic, random flip, rotation, etc.)
- **Device**: GPU (if available), otherwise CPU

### Expected Outputs
After training completes, you'll find:

```
model/trained_models/
├── infrastructure_damage/
│   └── weights/
│       ├── best.pt          # Best model (use this!)
│       └── last.pt          # Last checkpoint
├── results.csv              # Training metrics
└── best.pt                  # Copy of best model
```

## Training Results

### Metrics Monitored
- **box_loss**: Bounding box regression loss
- **cls_loss**: Classification loss
- **dfl_loss**: Distribution focal loss
- **Precision**: True positive rate
- **Recall**: Detection completeness
- **mAP50**: Mean Average Precision at IoU 0.5
- **mAP50-95**: mAP averaged across IoU thresholds

### Expected Performance
With your datasets:
- **Training time**: 30-60 minutes (with GPU), 2-4 hours (CPU)
- **Expected mAP50**: 0.60-0.75 (depends on image quality)
- **Expected classes to detect**: 4 (crack, pothole, structural, mixed)

## Integrating Trained Model

### 1. Update Configuration
Edit `config/settings.py`:
```python
MODEL_PATH = "model/trained_models/best.pt"
```

### 2. Test Backend Integration
```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload

# Test detection endpoint
curl -X POST http://localhost:8000/api/detect \
  -F "image=@test_image.jpg"
```

### 3. Verify System
- Test upload on Detection Page
- Check dashboard for detections
- Validate contractor recommendations

## Troubleshooting

### Issue: "No images found"
**Solution**: Ensure archive directories are correctly named and have write permissions

### Issue: "CUDA out of memory"
**Solution**: Reduce batch size in `train_model.py` (change `batch=16` to `batch=8`)

### Issue: Low accuracy
**Causes**:
- Limited dataset size
- Image quality issues
- Class imbalance
- Model overfitting

**Solutions**:
- Increase epochs (more training)
- Use data augmentation (already enabled)
- Adjust learning rate
- Add more diverse images

### Issue: Training too slow
**Solution**: Reduce `imgsz` parameter from 640 to 416 in `train_model.py`

## Advanced Configuration

### Custom Training
Edit `train_model.py` before running:

```python
results = model.train(
    data=data_yaml,
    epochs=150,           # Increase for more training
    imgsz=416,           # Smaller = faster
    batch=8,             # Smaller for less memory
    lr0=0.01,            # Initial learning rate
    momentum=0.937,      # Optimizer momentum
    device=0,            # GPU device
    patience=50,         # Early stopping patience
    augment=True         # Enable augmentation
)
```

## Validation Script

After training, validate with:
```python
from ultralytics import YOLO

model = YOLO("model/trained_models/best.pt")
metrics = model.val(data="model/datasets/combined_dataset/data.yaml")
print(f"mAP50: {metrics.box.map50:.3f}")
print(f"mAP50-95: {metrics.box.map:.3f}")
```

## Dataset Statistics

After preparation, view statistics:
```bash
python -c "
import os
dataset_path = 'model/datasets/combined_dataset'
for split in ['train', 'val', 'test']:
    images = len(os.listdir(f'{dataset_path}/images/{split}'))
    print(f'{split}: {images} images')
"
```

## Next Steps

1. ✅ **Run training pipeline**: `python model/train_model.py`
2. ✅ **Monitor training progress**: Watch console output and loss graphs
3. ✅ **Review results**: Check accuracy metrics
4. ✅ **Update config**: Set MODEL_PATH to new trained model
5. ✅ **Test backend**: Run detection API with test images
6. ✅ **Deploy model**: Update production settings with trained model path

## Additional Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com)
- [Dataset Format Guide](https://docs.ultralytics.com/datasets/detect)
- [Training Tips](https://docs.ultralytics.com/yolo/tutorials/tips-for-best-training-results)

---

**Happy Training!** 🚀

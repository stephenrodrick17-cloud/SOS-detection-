#!/usr/bin/env python
"""
GPU Setup Script - Install PyTorch with CUDA Support
Detects GPU and installs appropriate PyTorch version
"""

import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def check_gpu():
    """Check if GPU is available"""
    logger.info("=" * 60)
    logger.info("GPU DETECTION")
    logger.info("=" * 60)
    
    try:
        import torch
        logger.info(f"PyTorch version: {torch.__version__}")
        
        if torch.cuda.is_available():
            logger.info(f"✓ GPU detected: {torch.cuda.get_device_name(0)}")
            logger.info(f"✓ CUDA available: {torch.version.cuda}")
            logger.info(f"✓ Number of GPUs: {torch.cuda.device_count()}")
            logger.info(f"✓ GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
            return True
        else:
            logger.warning("⚠ GPU not detected - PyTorch installed but CUDA unavailable")
            logger.info("Installing PyTorch with CUDA support...")
            install_pytorch_with_cuda()
            return check_gpu()  # Check again after installation
    
    except ImportError:
        logger.info("PyTorch not installed - installing now with CUDA support...")
        install_pytorch_with_cuda()
        return check_gpu()

def install_pytorch_with_cuda():
    """Install PyTorch with CUDA support"""
    logger.info("\n" + "=" * 60)
    logger.info("INSTALLING PYTORCH WITH CUDA")
    logger.info("=" * 60)
    
    # Uninstall CPU-only PyTorch if exists
    logger.info("Removing existing PyTorch (CPU version)...")
    subprocess.run([sys.executable, "-m", "pip", "uninstall", "-y", "torch", "torchvision", "torchaudio"], 
                   capture_output=True)
    
    # Install PyTorch with CUDA 12.1 support
    logger.info("Installing PyTorch with CUDA 12.1 support...")
    install_cmd = [
        sys.executable, "-m", "pip", "install", "-U",
        "torch", "torchvision", "torchaudio",
        "--index-url", "https://download.pytorch.org/whl/cu121"
    ]
    
    result = subprocess.run(install_cmd)
    
    if result.returncode == 0:
        logger.info("✓ PyTorch with CUDA installed successfully")
    else:
        logger.error("✗ Failed to install PyTorch with CUDA")
        sys.exit(1)

def get_gpu_info():
    """Get detailed GPU information"""
    try:
        import torch
        
        if not torch.cuda.is_available():
            return None
        
        gpu_info = {
            'device': torch.cuda.get_device_name(0),
            'cuda_version': torch.version.cuda,
            'cudnn_version': torch.backends.cudnn.version(),
            'num_gpus': torch.cuda.device_count(),
            'total_memory': torch.cuda.get_device_properties(0).total_memory / 1e9,
            'free_memory': torch.cuda.mem_get_info()[0] / 1e9,
        }
        
        return gpu_info
    except:
        return None

def main():
    logger.info("🔧 GPU Setup for YOLOv8 Training\n")
    
    # Check and setup GPU
    gpu_available = check_gpu()
    
    if gpu_available:
        import torch
        info = get_gpu_info()
        
        logger.info(f"\n{'=' * 60}")
        logger.info("GPU READY FOR TRAINING!")
        logger.info(f"{'=' * 60}")
        logger.info(f"Device: {info['device']}")
        logger.info(f"CUDA Version: {info['cuda_version']}")
        logger.info(f"CUDNN Version: {info['cudnn_version']}")
        logger.info(f"Total GPU Memory: {info['total_memory']:.2f} GB")
        logger.info(f"Free GPU Memory: {info['free_memory']:.2f} GB")
        logger.info(f"\n✓ Ready to train with GPU!")
        logger.info(f"✓ Batch size can be: 32+ (recommended 32-64)")
        logger.info(f"✓ Image size can be: 640x640 (recommended) or 1024x1024")
        logger.info(f"✓ Training speed: 10-15x faster than CPU!\n")
        
        return True
    else:
        logger.error("\n✗ GPU setup failed")
        logger.info("Fallback: Will train on CPU (slower)")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

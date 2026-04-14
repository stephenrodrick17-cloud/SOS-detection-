#!/usr/bin/env python
"""Install PyTorch with CUDA support"""

import subprocess
import sys

# Install PyTorch with CUDA 11.8
print("Installing PyTorch with CUDA 11.8...")
cmd = [
    sys.executable, "-m", "pip", "install", "--upgrade",
    "torch", "torchvision", "torchaudio",
    "--index-url", "https://download.pytorch.org/whl/cu118"
]
subprocess.run(cmd)

# Check if GPU is available
print("\nChecking GPU availability...")
import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
else:
    print("GPU not available - system may not have NVIDIA GPU with drivers installed")

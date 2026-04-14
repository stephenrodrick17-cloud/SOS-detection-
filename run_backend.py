"""
Backend Startup Script - Handles path setup and runs the FastAPI app
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to access database and other modules
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

# Set working directory
os.chdir(str(project_root / "backend"))

# Now run uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

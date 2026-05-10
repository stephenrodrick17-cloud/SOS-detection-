import os
import sys
from pathlib import Path

# Add the root directory to sys.path so backend and database modules can be found
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))
sys.path.append(str(root_dir / "backend"))

# Import the FastAPI app from backend.main
try:
    from backend.main import app
except ImportError as e:
    print(f"Import error in api/index.py: {e}")
    # Fallback or diagnostic info could go here
    raise e

# Vercel needs the app object to be named 'app' by default or configured in vercel.json
# We've imported it as 'app'

# Setup and Installation Guide

## System Requirements

### Minimum
- **CPU**: 4 cores, 2.0 GHz
- **RAM**: 8 GB
- **Storage**: 20 GB (including models and database)
- **GPU**: Optional but recommended (NVIDIA CUDA 11.8+)

### Recommended
- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Storage**: 100+ GB SSD
- **GPU**: NVIDIA RTX 3060 or better (12GB+ VRAM)
- **OS**: Linux (Ubuntu 20.04+), macOS (12+), or Windows 10/11

## Step-by-Step Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/infrastructure-damage-detection.git
cd infrastructure-damage-detection
```

### 2. Install System Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y \
    python3.10 python3.10-venv python3-pip \
    nodejs npm \
    postgresql postgresql-contrib \
    cuda-toolkit-11-8 \
    build-essential
```

#### macOS
```bash
# Using Homebrew
brew install python@3.10 node postgresql
brew install --cask cuda
```

#### Windows
```bash
# Using Chocolatey
choco install python nodejs postgresql cuda
# Or download from official sites
```

### 3. Backend Setup

```bash
# Navigate to project root
cd infrastructure-damage-detection

# Create Python virtual environment
python3.10 -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download YOLOv8 pretrained model
python -c "from ultralytics import YOLO; YOLO('yolov8m.pt')"

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your favorite editor

# Initialize database
python -c "from database.database import init_db; init_db()"

# Verify installation
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
```

### 4. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

# Build (optional)
npm run build
```

### 5. Database Setup

#### SQLite (Default - No additional setup needed)
```bash
# Already initialized in Backend Setup step 3
python -c "from database.database import init_db; init_db()"
```

#### PostgreSQL
```bash
# Create database
createdb infrastructure_damage

# Create user
createuser damage_user

# Update .env
DATABASE_URL=postgresql://damage_user:password@localhost:5432/infrastructure_damage

# Initialize tables
python -c "from database.database import init_db; init_db()"
```

### 6. Configure API Services (Optional)

#### Twilio Setup (SMS Alerts)
1. Create account at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Verify or purchase a phone number
4. Add to .env:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1-555-0000
```

#### SendGrid Setup (Email Alerts)
1. Create account at https://sendgrid.com
2. Generate API key
3. Verify sender email
4. Add to .env:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
SENDER_EMAIL=your-email@example.com
```

#### Google Maps API
1. Create project in Google Cloud Console
2. Enable Maps JavaScript API
3. Create API key
4. Add to .env:
```
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxx
```

## Running the Application

### Development Mode

#### Terminal 1 - Backend API
```bash
cd infrastructure-damage-detection
source venv/bin/activate  # or venv\Scripts\activate on Windows
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend
```bash
cd infrastructure-damage-detection/frontend
npm start
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Mode

#### Backend
```bash
# Install production server
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 backend.main:app

# Or use systemd (see systemd.service example)
```

#### Frontend
```bash
# Build production bundle
npm run build

# Serve with production server
npm install -g serve
serve -s build -l 3000
```

## Running Tests

```bash
# Backend tests
cd backend
pytest -v

# Frontend tests
cd frontend
npm test

# Test API endpoints
python tests/test_api.py
```

## Verifying Installation

### Check Backend Health
```bash
curl http://localhost:8000/health
# Expected response: {"status": "healthy", "version": "1.0.0", ...}
```

### Check Frontend
```bash
# Open browser
# http://localhost:3000
```

### Test Detection Endpoint
```bash
# With sample image
curl -X POST http://localhost:8000/api/detection/detect \
  -F "file=@path/to/image.jpg" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

## Optional: GPU Acceleration

### NVIDIA GPU Setup

```bash
# Verify NVIDIA drivers
nvidia-smi

# Install CUDA (if not done)
# Ubuntu:
sudo apt-get install -y cuda-toolkit-11-8

# Verify CUDA installation
python -c "import torch; print(torch.cuda.is_available())"

# Test with YOLOv8
python -c "from ultralytics import YOLO; m = YOLO('yolov8m.pt'); results = m.predict(source='test.jpg', device=0)"
```

## Docker Setup (Alternative)

```bash
# Build Docker image
docker build -t damage-detection:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  -p 3000:3000 \
  -e DATABASE_URL=sqlite:///./infrastructure_damage.db \
  -v $(pwd)/uploads:/app/uploads \
  --name damage-detector \
  damage-detection:latest

# View logs
docker logs -f damage-detector

# Stop container
docker stop damage-detector
```

## Troubleshooting

### Python Version Issues
```bash
# Check Python version
python --version  # Should be 3.8+

# If using multiple Python versions
python3.10 -m venv venv
```

### CUDA/GPU Issues
```bash
# Check NVIDIA CUDA installation
nvidia-smi

# If CUDA not detected by PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

### Model Download Issues
```bash
# Manual download
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt -O model/yolov8m.pt

# Or use environment variable
export YOLO_HOME=/path/to/models
```

### Database Connection Issues
```bash
# Test SQLite connection
python -c "import sqlite3; sqlite3.connect('infrastructure_damage.db')"

# Test PostgreSQL connection
psql -h localhost -U damage_user -d infrastructure_damage
```

## Performance Tuning

### Backend Optimization
```python
# In main.py, adjust worker count based on CPU cores:
# For 8 cores: 2*8 + 1 = 17 workers
gunicorn -w 17 main:app
```

### Model Inference Optimization
```bash
# Convert model to ONNX for faster inference
python model/train.py --action export --model best.pt --format onnx

# Update config
MODEL_PATH=model/trained_models/best.onnx
```

### Database Optimization
```bash
# PostgreSQL performance tuning
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET work_mem = '256MB';
SELECT pg_reload_conf();
```

## Logs and Debugging

### Backend Logs
```bash
# Check application logs
tail -f logs/app.log

# Enable debug mode
DEBUG=True python main.py
```

### Frontend Logs
```bash
# Browser console (F12)
console.log()
```

## Next Steps

1. [Train Custom Model](TRAINING.md)
2. [Deploy to Cloud](DEPLOYMENT.md)
3. [Setup CI/CD](../../.github/workflows/)
4. [Configure Monitoring](MONITORING.md)

---

For detailed API documentation, visit: http://localhost:8000/docs

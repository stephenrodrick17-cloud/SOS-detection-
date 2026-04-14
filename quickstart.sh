#!/bin/bash

# Quick Start Script for Infrastructure Damage Detection System

echo "==================================="
echo "Infrastructure Damage Detection"
echo "Quick Start Setup"
echo "==================================="
echo ""

# Check Python version
echo "Checking Python version..."
python --version

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
echo "Creating environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ .env file created (edit with your credentials)"
else
    echo "✓ .env file already exists"
fi

# Create directories
echo "Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p model/trained_models

# Initialize database
echo "Initializing database..."
python -c "from database.database import init_db; init_db(); print('✓ Database initialized')"

# Seed sample data
echo "Seeding sample contractors..."
python database/seed.py

# Download model
echo "Downloading YOLOv8 model..."
python -c "from ultralytics import YOLO; YOLO('yolov8m.pt'); print('✓ Model downloaded')"

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Backend (Terminal 1):"
echo "   source venv/bin/activate"
echo "   cd backend"
echo "   uvicorn main:app --reload"
echo ""
echo "2. Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm install"
echo "   npm start"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""

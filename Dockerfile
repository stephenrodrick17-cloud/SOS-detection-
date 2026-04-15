# Build Stage for Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Production Stage
FROM python:3.10-slim

# Install system dependencies for OpenCV and YOLOv8
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY database/ ./database/
COPY config/ ./config/
COPY model/ ./model/
COPY utils/ ./utils/

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Set environment variables
ENV PYTHONPATH=/app/backend:/app
ENV PORT=8080

# Create upload directory
RUN mkdir -p uploads

# Start the application
CMD ["sh", "-c", "python -c 'from database.database import init_db; init_db()' && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]

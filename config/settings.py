"""
Configuration file for the application
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./infrastructure_damage.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# SendGrid Configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "alerts@infrastructure-damage.local")

# Google Maps Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Model Configuration
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.getcwd(), "model", "weights", "best.pt"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Upload Configuration
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", "52428800"))  # 50MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "bmp"}
UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIRECTORY", "uploads")

# Alert Configuration
ALERT_THRESHOLD_SEVERE = float(os.getenv("ALERT_THRESHOLD_SEVERE", "0.8"))
ALERT_THRESHOLD_MODERATE = float(os.getenv("ALERT_THRESHOLD_MODERATE", "0.5"))

# Contractor Configuration
CONTRACTOR_SERVICE_RADIUS_KM = float(os.getenv("CONTRACTOR_SERVICE_RADIUS_KM", "25.0"))
MAX_CONTRACTOR_RECOMMENDATIONS = int(os.getenv("MAX_CONTRACTOR_RECOMMENDATIONS", "5"))

# Cost Estimation
COST_MULTIPLIER_URBAN = float(os.getenv("COST_MULTIPLIER_URBAN", "1.1"))
COST_MULTIPLIER_RURAL = float(os.getenv("COST_MULTIPLIER_RURAL", "0.85"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "logs/app.log")

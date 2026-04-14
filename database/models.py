"""
Database Models for Infrastructure Damage Detection System
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class SeverityLevel(str, enum.Enum):
    """Damage severity levels"""
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"

class DamageType(str, enum.Enum):
    """Types of damage"""
    POTHOLE = "pothole"
    CRACK = "crack"
    STRUCTURAL = "structural"
    MIXED = "mixed"

class DamageReport(Base):
    """Model for recorded damage reports"""
    __tablename__ = "damage_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    damage_type = Column(String, default="unknown")
    severity = Column(String, default="moderate")  # minor, moderate, severe
    confidence_score = Column(Float, default=0.0)
    bounding_boxes = Column(Text, nullable=True)  # JSON string
    estimated_cost = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    damage_area = Column(Float, nullable=True)
    road_type = Column(String, nullable=True)  # highway, city_street, residential, etc.
    location_address = Column(String, nullable=True)
    alert_sent = Column(Boolean, default=False)
    contractor_assigned = Column(Integer, nullable=True)
    status = Column(String, default="reported")  # reported, assigned, in_progress, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<DamageReport(id={self.id}, type={self.damage_type}, severity={self.severity})>"

class Contractor(Base):
    """Model for registered contractors"""
    __tablename__ = "contractors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    specialization = Column(String)  # pothole_repair, crack_sealing, structural, general
    experience_years = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    available = Column(Boolean, default=True)
    max_jobs = Column(Integer, default=10)
    current_jobs = Column(Integer, default=0)
    service_radius_km = Column(Float, default=25.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Contractor(id={self.id}, name={self.name}, city={self.city})>"

class Alert(Base):
    """Model for sent alerts"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    damage_report_id = Column(Integer, nullable=False)
    phone_number = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String)  # sms, email, push
    contractor_id = Column(Integer, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    delivered = Column(Boolean, default=False)
    delivery_status = Column(String, default="pending")  # pending, sent, failed
    response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Alert(id={self.id}, report_id={self.damage_report_id}, type={self.alert_type})>"

class DetectionHistory(Base):
    """Model for tracking detection history"""
    __tablename__ = "detection_history"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String, nullable=False)  # GPS coordinates or location hash
    damage_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    detection_count = Column(Integer, default=1)
    first_detected = Column(DateTime, default=datetime.utcnow)
    last_detected = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")  # active, resolved, monitoring
    trend = Column(String, default="stable")  # stable, worsening, improving
    
    def __repr__(self):
        return f"<DetectionHistory(id={self.id}, location_id={self.location_id}, trend={self.trend})>"

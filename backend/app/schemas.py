"""
Pydantic Schemas for Request/Response Validation
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# ========== Detection Schemas ==========

class DetectionRequest(BaseModel):
    """Request model for image detection"""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_address: Optional[str] = None
    road_type: Optional[str] = None

class BoundingBox(BaseModel):
    """Bounding box coordinates"""
    x1: float
    y1: float
    x2: float
    y2: float
    class_name: str
    confidence: float

class DetectionResult(BaseModel):
    """Detection result from model"""
    damage_type: str
    severity: str
    confidence_score: float
    bounding_boxes: List[BoundingBox]
    damage_area: float

class DamageReportResponse(BaseModel):
    """Response for damage report"""
    id: int
    image_path: str
    damage_type: str
    severity: str
    confidence_score: float
    estimated_cost: float
    labor_cost: float
    total_cost: float
    latitude: Optional[float]
    longitude: Optional[float]
    location_address: Optional[str]
    alert_sent: bool
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ========== Cost Estimation Schemas ==========

class CostEstimationRequest(BaseModel):
    """Request for cost estimation"""
    damage_area: float
    damage_type: str
    severity: str
    road_type: str
    location: Optional[str] = None

class CostEstimationResponse(BaseModel):
    """Response for cost estimation"""
    material_cost: float
    labor_cost: float
    total_cost: float
    breakdown: Dict[str, float]

# ========== Contractor Schemas ==========

class ContractorCreate(BaseModel):
    """Create contractor request"""
    name: str
    email: EmailStr
    phone: str
    latitude: float
    longitude: float
    address: str
    city: str
    specialization: str
    experience_years: int = 0
    service_radius_km: float = 25.0

class ContractorResponse(BaseModel):
    """Contractor response"""
    id: int
    name: str
    email: str
    phone: str
    city: str
    specialization: str
    rating: float
    available: bool
    current_jobs: int
    service_radius_km: float
    
    class Config:
        from_attributes = True

class ContractorRecommendation(BaseModel):
    """Recommended contractor for damage"""
    contractor: ContractorResponse
    distance_km: float
    estimated_arrival_hours: float
    compatibility_score: float

# ========== Alert Schemas ==========

class AlertRequest(BaseModel):
    """Request to send alert"""
    damage_report_id: int
    phone_numbers: List[str]
    message_type: str = "sms"  # sms, email, both

class AlertResponse(BaseModel):
    """Alert response"""
    id: int
    damage_report_id: int
    alert_type: str
    sent_at: datetime
    delivery_status: str
    
    class Config:
        from_attributes = True

# ========== Dataset Schemas ==========

class DatasetImage(BaseModel):
    """Metadata for a dataset image"""
    id: str
    filename: str
    category: str
    archive_name: str
    path: str

class DatasetArchive(BaseModel):
    """Metadata for a dataset archive"""
    name: str
    total_images: int
    categories: List[str]
    sample_images: List[DatasetImage]

class DatasetOverview(BaseModel):
    """Overview of all datasets"""
    archives: List[DatasetArchive]
    total_images: int
    categories: Dict[str, int]

# ========== Dashboard Schemas ==========

class DamageStatistics(BaseModel):
    """Damage statistics for dashboard"""
    total_reports: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    total_estimated_cost: float
    avg_response_time: float
    on_time_completion_rate: float

class DashboardOverview(BaseModel):
    """Dashboard overview data"""
    statistics: DamageStatistics
    recent_reports: List[DamageReportResponse]
    active_contractors: int
    pending_alerts: int
    completed_repairs: int

class LocationCluster(BaseModel):
    """Cluster of damages at specific location"""
    latitude: float
    longitude: float
    count: int
    severity_levels: Dict[str, int]
    total_cost: float

# ========== Real-time Detection Schemas ==========

class LiveDetectionRequest(BaseModel):
    """Request for live detection stream"""
    stream_source: str  # webcam, rtsp_url, etc.
    process_every_n_frames: int = 10
    confidence_threshold: float = 0.5

class StreamFrame(BaseModel):
    """Single frame from detection stream"""
    timestamp: datetime
    detections: List[DetectionResult]
    frame_path: Optional[str] = None

# ========== History Schemas ==========

class DamageHistoryResponse(BaseModel):
    """Damage history entry"""
    location_id: str
    damage_type: str
    severity: str
    detection_count: int
    first_detected: datetime
    last_detected: datetime
    trend: str
    status: str
    
    class Config:
        from_attributes = True

"""
Real-Time Datasets Integration with Cracks, Cleanliness & Parking Services
Integrates: Archive 2 (Cracks), Archive 3 (Cleanliness), Parking & Road Services
"""

from fastapi import APIRouter, HTTPException, Query
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import math
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent

# Pydantic Models
class Location(BaseModel):
    latitude: float
    longitude: float

class CrackIssue(BaseModel):
    id: str
    location: str
    latitude: float
    longitude: float
    severity: str
    type: str
    detected_at: str
    image_path: Optional[str] = None
    status: str
    category: str

class CleanlinessIssue(BaseModel):
    id: str
    location: str
    latitude: float
    longitude: float
    issue_type: str
    severity: str
    reported_at: str
    description: str
    status: str

class ParkingSpot(BaseModel):
    id: str
    location: str
    latitude: float
    longitude: float
    available_spaces: int
    total_spaces: int
    pricing: float
    zone: str
    updated_at: str

class RoadService(BaseModel):
    id: str
    location: str
    latitude: float
    longitude: float
    service_type: str
    rating: float
    contact: str
    open_status: bool
    distance_km: float

class MapOverlay(BaseModel):
    cracks: List[CrackIssue]
    cleanliness: List[CleanlinessIssue]
    parking: List[ParkingSpot]
    services: List[RoadService]

# ============ DATASET LOADERS ============

def load_cracks_data() -> List[CrackIssue]:
    """Load crack detection data from archive 2 (Decks, Pavements, Walls)"""
    cracks = []
    archive_path = BASE_DIR / "archive (2)"
    
    categories = {
        "Decks": {"type": "Bridge Deck", "severity": "critical"},
        "Pavements": {"type": "Pavement Crack", "severity": "high"},
        "Walls": {"type": "Wall Damage", "severity": "medium"}
    }
    
    crack_id = 0
    for category, meta in categories.items():
        cat_path = archive_path / category / "Cracked"
        if cat_path.exists():
            for img in list(cat_path.glob("*.jpg"))[:50]:  # Limit to 50 per category
                crack_id += 1
                # Distribute across Delhi with random-like pattern
                base_lat = 28.6139
                base_lng = 77.2090
                offset = (crack_id % 20) * 0.003
                
                cracks.append(CrackIssue(
                    id=f"crack_{crack_id}",
                    location=f"{category} - Sector {crack_id % 12 + 1}",
                    latitude=base_lat + offset,
                    longitude=base_lng + offset,
                    severity=meta["severity"],
                    type=meta["type"],
                    detected_at=datetime.now().isoformat(),
                    image_path=f"/uploads/{img.name}",
                    status="reported" if crack_id % 4 == 0 else "resolved",
                    category=category
                ))
    
    return cracks

def load_cleanliness_data() -> List[CleanlinessIssue]:
    """Load cleanliness issues from archive 3"""
    issues = []
    archive_path = BASE_DIR / "archive (3)"
    data_path = archive_path / "data" / "Public Cleanliness + Environmental Issues"
    
    issue_config = {
        "Littering Garbage on Public Places Issues": {
            "type": "Littering",
            "severity": "high",
            "description": "Garbage and littering on public roads"
        },
        "Vandalism Issues": {
            "type": "Vandalism",
            "severity": "medium",
            "description": "Vandalism and graffiti on infrastructure"
        }
    }
    
    issue_id = 0
    for issue_folder, config in issue_config.items():
        issue_path = data_path / issue_folder
        if issue_path.exists():
            for item in list(issue_path.glob("*"))[:40]:
                issue_id += 1
                offset = (issue_id % 15) * 0.0025
                
                issues.append(CleanlinessIssue(
                    id=f"issue_{issue_id}",
                    location=f"{issue_folder} - Area {issue_id % 10 + 1}",
                    latitude=28.5139 + offset,
                    longitude=77.1090 + offset,
                    issue_type=config["type"],
                    severity=config["severity"],
                    reported_at=datetime.now().isoformat(),
                    description=config["description"],
                    status="pending" if issue_id % 3 == 0 else "in_progress"
                ))
    
    return issues

def load_parking_data() -> List[ParkingSpot]:
    """Generate real-time parking data for Delhi zones"""
    parking = []
    
    delhi_zones = [
        {"name": "Central Delhi", "lat": 28.6295, "lng": 77.2197, "zone": "Zone 1"},
        {"name": "South Delhi", "lat": 28.5244, "lng": 77.1855, "zone": "Zone 2"},
        {"name": "East Delhi", "lat": 28.6117, "lng": 77.3051, "zone": "Zone 3"},
        {"name": "West Delhi", "lat": 28.6581, "lng": 77.0441, "zone": "Zone 4"},
        {"name": "North Delhi", "lat": 28.7735, "lng": 77.1784, "zone": "Zone 5"},
    ]
    
    spot_id = 0
    for zone in delhi_zones:
        for i in range(8):
            spot_id += 1
            parking.append(ParkingSpot(
                id=f"parking_{spot_id}",
                location=f"{zone['name']} - Lot {i+1}",
                latitude=zone["lat"] + (i * 0.0008),
                longitude=zone["lng"] + (i * 0.0008),
                available_spaces=max(0, 20 - (i % 5)),
                total_spaces=50,
                pricing=50 + (i * 5),
                zone=zone["zone"],
                updated_at=datetime.now().isoformat()
            ))
    
    return parking

def load_road_services(latitude: float, longitude: float, radius_km: float = 5) -> List[RoadService]:
    """Generate nearby road services"""
    services = []
    
    service_types = [
        {"type": "Fuel Station", "rating": 4.5},
        {"type": "Mechanic Workshop", "rating": 4.2},
        {"type": "Tire Repair", "rating": 4.0},
        {"type": "Emergency Services", "rating": 4.8},
        {"type": "Food Court", "rating": 4.3},
        {"type": "Gas Station", "rating": 4.1},
        {"type": "Car Wash", "rating": 3.9},
    ]
    
    for i, svc in enumerate(service_types):
        offset = (i % 3) * 0.002
        distance = (i / len(service_types)) * radius_km
        
        services.append(RoadService(
            id=f"service_{i}",
            location=f"{svc['type']} - Branch {i+1}",
            latitude=latitude + offset,
            longitude=longitude + offset,
            service_type=svc["type"],
            rating=svc["rating"],
            contact=f"+91 {9000000000 + i * 1000000}",
            open_status=i % 2 == 0,
            distance_km=distance
        ))
    
    return services

# ============ API ENDPOINTS ============

@router.get("/cracks", response_model=List[CrackIssue])
async def get_cracks(
    latitude: Optional[float] = Query(28.6139),
    longitude: Optional[float] = Query(77.2090),
    severity: Optional[str] = Query(None)
):
    """Get real-time crack detection data"""
    cracks = load_cracks_data()
    if severity:
        cracks = [c for c in cracks if c.severity == severity]
    return cracks

@router.get("/cleanliness", response_model=List[CleanlinessIssue])
async def get_cleanliness(
    latitude: Optional[float] = Query(28.6139),
    longitude: Optional[float] = Query(77.2090),
    issue_type: Optional[str] = Query(None)
):
    """Get real-time cleanliness issues"""
    issues = load_cleanliness_data()
    if issue_type:
        issues = [i for i in issues if i.issue_type == issue_type]
    return issues

@router.get("/parking", response_model=List[ParkingSpot])
async def get_parking(
    available_only: Optional[bool] = Query(False),
    zone: Optional[str] = Query(None)
):
    """Get real-time parking availability"""
    parking = load_parking_data()
    if available_only:
        parking = [p for p in parking if p.available_spaces > 0]
    if zone:
        parking = [p for p in parking if p.zone == zone]
    return parking

@router.get("/services", response_model=List[RoadService])
async def get_services(
    latitude: Optional[float] = Query(28.6139),
    longitude: Optional[float] = Query(77.2090),
    service_type: Optional[str] = Query(None)
):
    """Get nearby road services"""
    services = load_road_services(latitude, longitude)
    if service_type:
        services = [s for s in services if s.service_type == service_type]
    return services

@router.get("/map-overlay", response_model=MapOverlay)
async def get_map_overlay(
    latitude: Optional[float] = Query(28.6139),
    longitude: Optional[float] = Query(77.2090)
):
    """Get all datasets for Google Maps visualization"""
    return MapOverlay(
        cracks=load_cracks_data(),
        cleanliness=load_cleanliness_data(),
        parking=load_parking_data(),
        services=load_road_services(latitude, longitude)
    )

@router.get("/overview")
async def get_overview():
    """Get real-time overview of all datasets"""
    cracks = load_cracks_data()
    cleanliness = load_cleanliness_data()
    parking = load_parking_data()
    
    return {
        "timestamp": datetime.now().isoformat(),
        "cracks": {
            "total": len(cracks),
            "critical": len([c for c in cracks if c.severity == "critical"]),
            "high": len([c for c in cracks if c.severity == "high"]),
            "medium": len([c for c in cracks if c.severity == "medium"]),
            "resolved": len([c for c in cracks if c.status == "resolved"])
        },
        "cleanliness": {
            "total": len(cleanliness),
            "high_priority": len([i for i in cleanliness if i.severity == "high"]),
            "medium_priority": len([i for i in cleanliness if i.severity == "medium"]),
            "pending": len([i for i in cleanliness if i.status == "pending"]),
            "in_progress": len([i for i in cleanliness if i.status == "in_progress"])
        },
        "parking": {
            "total_spaces": sum(p.total_spaces for p in parking),
            "available": sum(p.available_spaces for p in parking),
            "zones_active": len(set(p.zone for p in parking)),
            "utilization_percent": round((sum(p.total_spaces - p.available_spaces for p in parking) / sum(p.total_spaces for p in parking) * 100), 2)
        }
    }

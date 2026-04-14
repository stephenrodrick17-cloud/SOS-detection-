"""
Detection Routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import logging
from typing import Optional
from datetime import datetime
import shutil

from app.schemas import DetectionRequest, DamageReportResponse
from app.services.detection import DamageDetectionService
from app.services.cost_estimation import CostEstimationService
from database.database import SessionLocal
from database.models import DamageReport

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize detection service
detection_service = DamageDetectionService()

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/detect")
async def detect_damage(
    file: UploadFile = File(...),
    detection_request: DetectionRequest = None
):
    """
    Upload image and detect infrastructure damage
    
    Args:
        file: Image file
        detection_request: Optional request with GPS and location data
        
    Returns:
        Detection results with bounding boxes and severity
    """
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{datetime.utcnow().timestamp()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Image saved to {file_path}")
        
        # Run detection
        detection_result = detection_service.detect_damage(file_path, conf=0.5)
        
        if not detection_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"Detection failed: {detection_result.get('error', 'Unknown error')}"
            )
        
        # Process detections and calculate costs
        processed_detections = []
        for detection in detection_result["detections"]:
            # Calculate damage area in square meters (assuming 1 pixel ≈ 0.01 cm²)
            damage_area = (detection["area_percentage"] / 100) * 25  # Assume 5m x 5m area = 25 m²
            
            # Estimate cost
            cost_result = CostEstimationService.estimate_cost(
                damage_area=damage_area,
                damage_type=detection["damage_type"],
                severity=detection["severity"],
                road_type=getattr(detection_request, 'road_type', 'unknown') if detection_request else 'unknown'
            )
            
            processed_detections.append({
                **detection,
                "damage_area_m2": damage_area,
                "cost_estimation": cost_result
            })
        
        # Save to database
        db = SessionLocal()
        try:
            # Take the most severe detection as primary
            if processed_detections:
                primary = max(processed_detections, key=lambda x: {
                    "severe": 3,
                    "moderate": 2,
                    "minor": 1
                }.get(x["severity"], 0))
                
                damage_report = DamageReport(
                    image_path=file_path,
                    latitude=detection_request.latitude if detection_request else None,
                    longitude=detection_request.longitude if detection_request else None,
                    location_address=detection_request.location_address if detection_request else None,
                    damage_type=primary["damage_type"],
                    severity=primary["severity"],
                    confidence_score=primary["confidence"],
                    bounding_boxes=str(primary["bbox"]),
                    damage_area=primary["damage_area_m2"],
                    road_type=detection_request.road_type if detection_request else None,
                    estimated_cost=primary["cost_estimation"]["material_cost"],
                    labor_cost=primary["cost_estimation"]["labor_cost"],
                    total_cost=primary["cost_estimation"]["total_cost"],
                    status="reported"
                )
                
                db.add(damage_report)
                db.commit()
                db.refresh(damage_report)
                
                logger.info(f"Damage report saved with ID {damage_report.id}")
            else:
                # No damage detected
                damage_report = DamageReport(
                    image_path=file_path,
                    latitude=detection_request.latitude if detection_request else None,
                    longitude=detection_request.longitude if detection_request else None,
                    location_address=detection_request.location_address if detection_request else None,
                    damage_type="none",
                    severity="none",
                    confidence_score=0,
                    status="no_damage"
                )
                
                db.add(damage_report)
                db.commit()
                db.refresh(damage_report)
        finally:
            db.close()
        
        return {
            "success": True,
            "report_id": damage_report.id,
            "detections": processed_detections,
            "annotated_image_url": f"http://localhost:8000/api/detection/image/{os.path.basename(detection_result['annotated_image_path'])}",
            "summary": {
                "total_damage_areas": len(processed_detections),
                "max_severity": max([d["severity"] for d in processed_detections], default="none"),
                "total_estimated_cost": sum([d["cost_estimation"]["total_cost"] for d in processed_detections])
            }
        }
    
    except Exception as e:
        logger.error(f"Error in detect_damage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-video")
async def detect_damage_video(
    file: UploadFile = File(...),
    frame_interval: int = 30
):
    """
    Upload video and detect infrastructure damage at intervals
    
    Args:
        file: Video file
        frame_interval: Process every N-th frame
        
    Returns:
        Summary of detections throughout the video
    """
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{datetime.utcnow().timestamp()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Video saved to {file_path}")
        
        # Run video detection
        video_result = detection_service.detect_video(file_path, conf=0.5, frame_interval=frame_interval)
        
        if not video_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"Video detection failed: {video_result.get('error', 'Unknown error')}"
            )
            
        return video_result
        
    except Exception as e:
        logger.error(f"Error in detect_damage_video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-frame")
async def detect_damage_frame(
    file: UploadFile = File(...),
    conf: float = 0.5
):
    """
    Detect damage from a single frame (used for real-time streaming)
    """
    try:
        # Save frame temporarily
        temp_path = os.path.join(UPLOAD_DIR, f"temp_frame_{datetime.utcnow().timestamp()}.jpg")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run detection
        result = detection_service.detect_damage(temp_path, conf=conf)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return result
    except Exception as e:
        logger.error(f"Error in detect_damage_frame: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{filename}")
async def get_detection_image(filename: str):
    """
    Get uploaded or annotated image by filename
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

@router.get("/report/{report_id}")
async def get_damage_report(report_id: int):
    """
    Get damage report by ID
    
    Args:
        report_id: Report ID
        
    Returns:
        Damage report details
    """
    db = SessionLocal()
    try:
        report = db.query(DamageReport).filter(DamageReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return DamageReportResponse.model_validate(report)
    finally:
        db.close()

@router.get("/image/{report_id}")
async def get_report_image(report_id: int):
    """
    Get image from damage report
    
    Args:
        report_id: Report ID
        
    Returns:
        Image file
    """
    db = SessionLocal()
    try:
        report = db.query(DamageReport).filter(DamageReport.id == report_id).first()
        
        if not report or not os.path.exists(report.image_path):
            raise HTTPException(status_code=404, detail="Image not found")
        
        return FileResponse(report.image_path)
    finally:
        db.close()

@router.post("/annotate/{report_id}")
async def get_annotated_image(report_id: int):
    """
    Get annotated image with detection boxes
    
    Args:
        report_id: Report ID
        
    Returns:
        Annotated image
    """
    db = SessionLocal()
    try:
        report = db.query(DamageReport).filter(DamageReport.id == report_id).first()
        
        if not report or not os.path.exists(report.image_path):
            raise HTTPException(status_code=404, detail="Report or image not found")
        
        # Create annotated image
        output_path = os.path.join(UPLOAD_DIR, f"annotated_{report_id}.jpg")
        success = detection_service.visualize_detections(report.image_path, output_path)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create annotated image")
        
        return FileResponse(output_path)
    finally:
        db.close()

@router.get("/reports/recent")
async def get_recent_reports(limit: int = 10):
    """
    Get recent damage reports
    
    Args:
        limit: Number of reports to return
        
    Returns:
        List of recent reports
    """
    db = SessionLocal()
    try:
        reports = db.query(DamageReport).order_by(
            DamageReport.created_at.desc()
        ).limit(limit).all()
        
        return [DamageReportResponse.model_validate(r) for r in reports]
    finally:
        db.close()

@router.get("/stats")
async def get_detection_statistics():
    """
    Get detection statistics
    
    Returns:
        Statistics about detected damages
    """
    db = SessionLocal()
    try:
        total_reports = db.query(DamageReport).count()
        
        severity_counts = {}
        for report in db.query(DamageReport).all():
            severity = report.severity
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        type_counts = {}
        for report in db.query(DamageReport).all():
            dtype = report.damage_type
            type_counts[dtype] = type_counts.get(dtype, 0) + 1
        
        total_cost = db.query(DamageReport).filter(
            DamageReport.severity != "none"
        ).count()
        
        return {
            "total_reports": total_reports,
            "by_severity": severity_counts,
            "by_type": type_counts,
            "avg_confidence": 0.75,  # Placeholder
            "alerts_sent": db.query(DamageReport).filter(
                DamageReport.alert_sent == True
            ).count()
        }
    finally:
        db.close()

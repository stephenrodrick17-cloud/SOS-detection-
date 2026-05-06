"""
Alert Routes
"""

from fastapi import APIRouter, HTTPException, Depends
import logging
from typing import List
from sqlalchemy.orm import Session

from app.schemas import AlertRequest, AlertResponse
from app.services.alerts import AlertService
from app.services.contractors import ContractorService
from database.database import get_db
from database.models import DamageReport, Alert

logger = logging.getLogger(__name__)
router = APIRouter()

alert_service = AlertService()

def is_valid_india_coordinates(lat: float, lon: float) -> bool:
    """
    Validate that GPS coordinates are within India bounds
    
    Args:
        lat: Latitude coordinate
        lon: Longitude coordinate
        
    Returns:
        True if coordinates are valid, False otherwise
    """
    # India approximate bounds: 8°N to 35°N, 68°E to 97°E
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return False
    
    if lat == 0 and lon == 0:  # Invalid default/placeholder
        return False
        
    # Check approximate India bounds
    if not (8 <= lat <= 35 and 68 <= lon <= 97):
        logger.warning(f"Coordinates outside India bounds: {lat}, {lon}")
        return False
        
    return True

@router.post("/send-alert/{report_id}")
async def send_damage_alert(
    report_id: int,
    phone_numbers: List[str],
    message_type: str = "sms",
    db: Session = Depends(get_db)
):
    """
    Send alert about specific damage report
    
    Args:
        report_id: Damage report ID
        phone_numbers: List of phone numbers to alert
        message_type: Type of alert (sms, email, both)
        db: Database session (injected)
        
    Returns:
        Alert details
    """
    try:
        # Get damage report
        report = db.query(DamageReport).filter(DamageReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Format message
        message = alert_service.format_alert_message(
            damage_type=report.damage_type,
            severity=report.severity,
            location=report.location_address or "Unknown Location",
            cost=report.total_cost,
            report_id=report_id
        )
        
        # Send SMS alerts
        results = {}
        if message_type in ["sms", "both"]:
            sms_results = alert_service.send_sms_alert(
                phone_numbers=phone_numbers,
                message=message,
                severity=report.severity
            )
            results["sms"] = sms_results
        
        # Send email alerts (stub)
        if message_type in ["email", "both"]:
            email_results = alert_service.send_email_alert(
                email_addresses=phone_numbers,  # In production, separate email list
                subject=f"Infrastructure Damage Alert - {report.severity.upper()}",
                body=message
            )
            results["email"] = email_results
        
        # Save alerts to database
        for phone in phone_numbers:
            alert_record = Alert(
                damage_report_id=report_id,
                phone_number=phone,
                message=message,
                alert_type=message_type,
                delivery_status="sent"
            )
            db.add(alert_record)
        
        # Mark report as alerted
        report.alert_sent = True
        db.commit()
        
        logger.info(f"Alerts sent for report {report_id}")
        
        return {
            "success": True,
            "report_id": report_id,
            "alerts_sent": results,
            "message": message
        }
    
    except Exception as e:
        logger.error(f"Error sending alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-to-contractors/{report_id}")
async def send_alert_to_contractors(
    report_id: int,
    max_contractors: int = 3,
    db: Session = Depends(get_db)
):
    """
    Send alert to recommended contractors
    
    Args:
        report_id: Damage report ID
        max_contractors: Maximum contractors to notify
        db: Database session (injected)
        
    Returns:
        Alert details
    """
    try:
        # Get damage report
        report = db.query(DamageReport).filter(DamageReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if not report.latitude or not report.longitude:
            raise HTTPException(
                status_code=400,
                detail="Report missing GPS coordinates"
            )
        
        if not is_valid_india_coordinates(report.latitude, report.longitude):
            raise HTTPException(
                status_code=400,
                detail="Report has invalid GPS coordinates (outside service area)"
            )
        
        # Get contractor recommendations
        recommendations = ContractorService.recommend_contractors(
            damage_latitude=report.latitude,
            damage_longitude=report.longitude,
            damage_type=report.damage_type,
            severity=report.severity,
            max_recommendations=max_contractors
        )
        
        if not recommendations:
            raise HTTPException(
                status_code=404,
                detail="No contractors available in service area"
            )
        
        # Send alerts to contractors
        contractor_phones = [c["phone"] for c in recommendations]
        
        message = alert_service.format_alert_message(
            damage_type=report.damage_type,
            severity=report.severity,
            location=report.location_address or "Unknown Location",
            cost=report.total_cost,
            report_id=report_id
        )
        
        sms_results = alert_service.send_sms_alert(
            phone_numbers=contractor_phones,
            message=message + f"\nMap: https://maps.google.com/?q={report.latitude},{report.longitude}",
            severity=report.severity
        )
        
        # Save alerts and assign contractors
        for i, contractor in enumerate(recommendations):
            alert_record = Alert(
                damage_report_id=report_id,
                phone_number=contractor["phone"],
                message=message,
                alert_type="sms",
                contractor_id=contractor["contractor_id"],
                delivery_status="sent"
            )
            db.add(alert_record)
        
        # Assign to best contractor
        report.contractor_assigned = recommendations[0]["contractor_id"]
        report.status = "assigned"
        db.commit()
        
        return {
            "success": True,
            "report_id": report_id,
            "contractors_notified": len(recommendations),
            "primary_contractor": recommendations[0],
            "all_recommendations": recommendations,
            "sms_delivery_status": sms_results
        }
    
    except Exception as e:
        logger.error(f"Error sending contractor alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("/list/{report_id}")
async def get_report_alerts(report_id: int):
    """
    Get all alerts for a damage report
    
    Args:
        report_id: Damage report ID
        
    Returns:
        List of alerts
    """
    db = SessionLocal()
    try:
        alerts = db.query(Alert).filter(Alert.damage_report_id == report_id).all()
        
        return [AlertResponse.model_validate(a) for a in alerts]
    finally:
        db.close()

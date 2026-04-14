"""
Contractor Routes
"""

from fastapi import APIRouter, HTTPException
import logging
from typing import List, Optional

from app.schemas import ContractorResponse, ContractorRecommendation
from app.services.contractors import ContractorService
from database.database import SessionLocal
from database.models import Contractor

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/recommend/{report_id}")
async def recommend_contractors_for_report(
    report_id: int,
    max_results: int = 3
):
    """
    Get contractor recommendations for damage report
    
    Args:
        report_id: Damage report ID
        max_results: Maximum recommendations
        
    Returns:
        List of recommended contractors
    """
    from database.models import DamageReport
    
    db = SessionLocal()
    try:
        report = db.query(DamageReport).filter(DamageReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if not report.latitude or not report.longitude:
            raise HTTPException(
                status_code=400,
                detail="Report missing GPS coordinates for recommendations"
            )
        
        recommendations = ContractorService.recommend_contractors(
            damage_latitude=report.latitude,
            damage_longitude=report.longitude,
            damage_type=report.damage_type,
            severity=report.severity,
            max_recommendations=max_results
        )
        
        return {
            "success": True,
            "report_id": report_id,
            "recommendations": recommendations
        }
    
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("/nearby")
async def get_nearby_contractors(
    latitude: float,
    longitude: float,
    damage_type: Optional[str] = None,
    max_results: int = 10
):
    """
    Get contractors near a location
    
    Args:
        latitude: Latitude
        longitude: Longitude
        damage_type: Optional damage type filter
        max_results: Maximum results
        
    Returns:
        List of nearby contractors
    """
    try:
        contractors = ContractorService.SAMPLE_CONTRACTORS.copy()
        
        # Filter by specialization if provided
        if damage_type:
            contractors = ContractorService.get_contractors_by_specialization(
                damage_type, contractors
            )
        
        # Calculate distances and sort
        contractors_with_distance = []
        for contractor in contractors:
            distance = ContractorService.calculate_distance(
                latitude, longitude,
                contractor["latitude"], contractor["longitude"]
            )
            
            contractor_copy = contractor.copy()
            contractor_copy["distance_km"] = round(distance, 2)
            contractors_with_distance.append(contractor_copy)
        
        # Sort by distance
        contractors_with_distance.sort(key=lambda x: x["distance_km"])
        
        return {
            "success": True,
            "location": {"latitude": latitude, "longitude": longitude},
            "contractors": contractors_with_distance[:max_results]
        }
    
    except Exception as e:
        logger.error(f"Error getting nearby contractors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
async def get_all_contractors():
    """
    Get all contractors
    
    Returns:
        List of all contractors
    """
    try:
        contractors = ContractorService.SAMPLE_CONTRACTORS
        
        return {
            "success": True,
            "total": len(contractors),
            "contractors": contractors
        }
    
    except Exception as e:
        logger.error(f"Error getting contractors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{contractor_id}")
async def get_contractor_details(contractor_id: int):
    """
    Get contractor details
    
    Args:
        contractor_id: Contractor ID
        
    Returns:
        Contractor information
    """
    try:
        contractor = ContractorService.get_contractor_by_id(contractor_id)
        
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
        
        return {
            "success": True,
            "contractor": contractor
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contractor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/specialization/{specialization}")
async def get_contractors_by_spec(specialization: str):
    """
    Get contractors by specialization
    
    Args:
        specialization: Specialization type
        
    Returns:
        List of contractors with specialization
    """
    try:
        contractors = ContractorService.get_contractors_by_specialization(specialization)
        
        return {
            "success": True,
            "specialization": specialization,
            "total": len(contractors),
            "contractors": contractors
        }
    
    except Exception as e:
        logger.error(f"Error getting contractors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available/all")
async def get_available_contractors():
    """
    Get all available contractors
    
    Returns:
        List of available contractors
    """
    try:
        contractors = ContractorService.get_available_contractors()
        
        return {
            "success": True,
            "total": len(contractors),
            "contractors": contractors
        }
    
    except Exception as e:
        logger.error(f"Error getting available contractors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

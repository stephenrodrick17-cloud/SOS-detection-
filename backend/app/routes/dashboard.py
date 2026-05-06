"""
Dashboard Routes
"""

from fastapi import APIRouter, HTTPException, Depends
import logging
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.schemas import DashboardOverview, DamageStatistics, LocationCluster
from database.database import get_db
from database.models import DamageReport, Alert, Contractor
from app.services.contractors import ContractorService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/overview")
async def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Get dashboard overview with statistics
    
    Args:
        db: Database session (injected)
    
    Returns:
        Dashboard overview data
    """
    try:
        # Get statistics
        total_reports = db.query(DamageReport).count()
        
        # Count by severity
        severity_counts = {}
        for report in db.query(DamageReport).filter(DamageReport.severity != "none").all():
            severity = report.severity
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Count by type
        type_counts = {}
        for report in db.query(DamageReport).filter(DamageReport.damage_type != "none").all():
            dtype = report.damage_type
            type_counts[dtype] = type_counts.get(dtype, 0) + 1
        
        # Total cost
        total_cost = sum([r.total_cost or 0 for r in db.query(DamageReport).all()])
        
        # Response metrics
        alerts_sent = db.query(DamageReport).filter(DamageReport.alert_sent == True).count()
        completed_repairs = db.query(DamageReport).filter(DamageReport.status == "completed").count()
        active_contractors = len(ContractorService.get_available_contractors())
        pending_alerts = db.query(Alert).filter(Alert.delivery_status == "pending").count()
        
        # Recent reports
        recent_reports = db.query(DamageReport).order_by(
            DamageReport.created_at.desc()
        ).limit(5).all()
        
        statistics = DamageStatistics(
            total_reports=total_reports,
            by_severity=severity_counts,
            by_type=type_counts,
            total_estimated_cost=total_cost,
            avg_response_time=2.5,  # Placeholder: in production, calculate from actual data
            on_time_completion_rate=0.87  # Placeholder
        )
        
        from app.schemas import DamageReportResponse
        recent = [DamageReportResponse.model_validate(r) for r in recent_reports]
        
        overview = DashboardOverview(
            statistics=statistics,
            recent_reports=recent,
            active_contractors=active_contractors,
            pending_alerts=pending_alerts,
            completed_repairs=completed_repairs
        )
        
        return {
            "success": True,
            "dashboard": overview.model_dump()
        }
    
    except Exception as e:
        logger.error(f"Error getting dashboard overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_statistics(
    days: int = 30,
    damage_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get detailed statistics
    
    Args:
        days: Number of days to include
        damage_type: Filter by damage type
        db: Database session (injected)
        
    Returns:
        Detailed statistics
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = db.query(DamageReport).filter(DamageReport.created_at >= cutoff_date)
        
        if damage_type:
            query = query.filter(DamageReport.damage_type == damage_type)
        
        reports = query.all()
        
        # Calculate statistics
        severity_dist = {}
        type_dist = {}
        status_dist = {}
        daily_reports = {}
        
        for report in reports:
            # Severity distribution
            severity_dist[report.severity] = severity_dist.get(report.severity, 0) + 1
            
            # Type distribution
            type_dist[report.damage_type] = type_dist.get(report.damage_type, 0) + 1
            
            # Status distribution
            status_dist[report.status] = status_dist.get(report.status, 0) + 1
            
            # Daily distribution
            date_key = report.created_at.strftime("%Y-%m-%d")
            daily_reports[date_key] = daily_reports.get(date_key, 0) + 1
        
        total_cost = sum([r.total_cost or 0 for r in reports])
        avg_cost = total_cost / len(reports) if reports else 0
        avg_confidence = sum([r.confidence_score or 0 for r in reports]) / len(reports) if reports else 0
        
        return {
            "success": True,
            "period_days": days,
            "total_reports": len(reports),
            "severity_distribution": severity_dist,
            "type_distribution": type_dist,
            "status_distribution": status_dist,
            "daily_distribution": daily_reports,
            "cost_analysis": {
                "total": round(total_cost, 2),
                "average": round(avg_cost, 2),
                "max": max([r.total_cost or 0 for r in reports], default=0),
                "min": min([r.total_cost or 0 for r in reports if r.total_cost], default=0)
            },
            "avg_confidence_score": round(avg_confidence, 3),
            "alerts_sent": sum([1 for r in reports if r.alert_sent]),
            "completion_rate": len([r for r in reports if r.status == "completed"]) / len(reports) if reports else 0
        }
    
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/map-data")
async def get_map_data(db: Session = Depends(get_db)):
    """
    Get all damage locations for map view
    
    Returns:
        List of damage clusters for mapping
    """
    try:
        reports = db.query(DamageReport).filter(
            DamageReport.latitude.isnot(None),
            DamageReport.longitude.isnot(None)
        ).all()
        
        # Group by approximate location (within 0.5 km)
        clusters = {}
        
        for report in reports:
            # Create cluster key (round to 2 decimal places)
            cluster_key = (
                round(report.latitude, 2),
                round(report.longitude, 2)
            )
            
            if cluster_key not in clusters:
                clusters[cluster_key] = {
                    "latitude": report.latitude,
                    "longitude": report.longitude,
                    "count": 0,
                    "severity_levels": {},
                    "total_cost": 0,
                    "reports": []
                }
            
            cluster = clusters[cluster_key]
            cluster["count"] += 1
            cluster["severity_levels"][report.severity] = cluster["severity_levels"].get(report.severity, 0) + 1
            cluster["total_cost"] += report.total_cost or 0
            cluster["reports"].append(report.id)
        
        cluster_list = list(clusters.values())
        
        return {
            "success": True,
            "total_clusters": len(cluster_list),
            "total_damage_points": len(reports),
            "clusters": cluster_list
        }
    
    except Exception as e:
        logger.error(f"Error getting map data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts-status")
async def get_alerts_status(db: Session = Depends(get_db)):
    """
    Get status of sent alerts
    
    Args:
        db: Database session (injected)
    
    Returns:
        Alert delivery status
    """
    try:
        total_alerts = db.query(Alert).count()
        
        pending = db.query(Alert).filter(Alert.delivery_status == "pending").count()
        sent = db.query(Alert).filter(Alert.delivery_status == "sent").count()
        failed = db.query(Alert).filter(Alert.delivery_status == "failed").count()
        
        return {
            "success": True,
            "total_alerts": total_alerts,
            "pending": pending,
            "sent": sent,
            "failed": failed,
            "success_rate": round((sent / total_alerts * 100), 2) if total_alerts > 0 else 0
        }
    
    except Exception as e:
        logger.error(f"Error getting alert status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

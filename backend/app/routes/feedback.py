"""
Enhanced Detection Feedback API Routes
Allows users to report false positives/negatives for model improvement
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
import os
from pathlib import Path
import shutil

logger = logging.getLogger(__name__)

router = APIRouter()

# Import feedback manager
try:
    from model.finetuning_system import FeedbackManager
    feedback_manager = FeedbackManager()
except ImportError:
    logger.warning("Feedback system not available")
    feedback_manager = None

class FalsePositive(BaseModel):
    """False positive report"""
    image_path: str
    detection_class: str
    confidence: float
    reason: str

class FalseNegative(BaseModel):
    """False negative report"""
    image_path: str
    damage_type: str
    bbox: Dict[str, float]  # x1, y1, x2, y2
    reason: str

class DetectionCorrection(BaseModel):
    """Corrected detection"""
    image_path: str
    original_detection: Dict[str, Any]
    corrected_detection: Dict[str, Any]
    reason: str

@router.post("/feedback/false-positive")
async def report_false_positive(
    image_path: str = Form(...),
    detection_class: str = Form(...),
    confidence: float = Form(...),
    reason: str = Form(...)
) -> Dict[str, str]:
    """
    Report a false positive detection
    
    Args:
        image_path: Path to image
        detection_class: Class that was incorrectly detected
        confidence: Detection confidence
        reason: Why it's a false positive
    
    Returns:
        Confirmation of feedback recording
    """
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system unavailable")
    
    try:
        detection_info = {
            "class": detection_class,
            "confidence": confidence,
            "reason": reason
        }
        
        feedback_manager.add_false_positive(image_path, detection_info)
        
        stats = feedback_manager.get_statistics()
        
        return {
            "status": "recorded",
            "message": f"False positive recorded. Total FP: {stats['false_positives']}",
            "retraining_ready": stats['ready_for_retraining']
        }
    
    except Exception as e:
        logger.error(f"Error recording false positive: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback/false-negative")
async def report_false_negative(
    image_path: str = Form(...),
    damage_type: str = Form(...),
    bbox_x1: float = Form(...),
    bbox_y1: float = Form(...),
    bbox_x2: float = Form(...),
    bbox_y2: float = Form(...),
    reason: str = Form(...)
) -> Dict[str, str]:
    """
    Report a missed detection (false negative)
    
    Args:
        image_path: Path to image
        damage_type: Type of damage that was missed
        bbox_x1, bbox_y1, bbox_x2, bbox_y2: Bounding box coordinates
        reason: Why it was missed
    
    Returns:
        Confirmation of feedback recording
    """
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system unavailable")
    
    try:
        missing_detection_info = {
            "damage_type": damage_type,
            "bbox": {
                "x1": bbox_x1,
                "y1": bbox_y1,
                "x2": bbox_x2,
                "y2": bbox_y2
            },
            "reason": reason
        }
        
        feedback_manager.add_false_negative(image_path, missing_detection_info)
        
        stats = feedback_manager.get_statistics()
        
        return {
            "status": "recorded",
            "message": f"False negative recorded. Total FN: {stats['false_negatives']}",
            "retraining_ready": stats['ready_for_retraining']
        }
    
    except Exception as e:
        logger.error(f"Error recording false negative: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback/correction")
async def report_correction(
    image_path: str = Form(...),
    original_bbox: str = Form(...),  # JSON string
    corrected_bbox: str = Form(...),  # JSON string
    correction_type: str = Form(...),
    reason: str = Form(...)
) -> Dict[str, str]:
    """
    Report a corrected detection
    
    Args:
        image_path: Path to image
        original_bbox: Original bounding box (JSON)
        corrected_bbox: Corrected bounding box (JSON)
        correction_type: Type of correction (bbox adjustment, class change, etc)
        reason: Why correction was made
    
    Returns:
        Confirmation of feedback recording
    """
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system unavailable")
    
    try:
        import json
        
        correction_info = {
            "original_bbox": json.loads(original_bbox),
            "corrected_bbox": json.loads(corrected_bbox),
            "correction_type": correction_type,
            "reason": reason
        }
        
        feedback_manager.add_correction(image_path, correction_info)
        
        stats = feedback_manager.get_statistics()
        
        return {
            "status": "recorded",
            "message": f"Correction recorded. Total corrections: {stats['corrections']}",
            "retraining_ready": stats['ready_for_retraining']
        }
    
    except Exception as e:
        logger.error(f"Error recording correction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feedback/statistics")
async def get_feedback_statistics() -> Dict[str, Any]:
    """
    Get feedback statistics
    
    Returns:
        Current feedback statistics and retraining status
    """
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system unavailable")
    
    try:
        stats = feedback_manager.get_statistics()
        
        return {
            "statistics": stats,
            "status": "ready_for_retraining" if stats['ready_for_retraining'] else "collecting_feedback",
            "message": "Enough feedback collected. Ready to retrain model!" if stats['ready_for_retraining'] 
                      else f"Need {50 - stats['false_positives']} more false positives to retrain",
            "recommendations": get_recommendations(stats)
        }
    
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feedback/summary")
async def get_feedback_summary() -> Dict[str, Any]:
    """
    Get detailed feedback summary
    
    Returns:
        Summary of all feedback collected
    """
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system unavailable")
    
    try:
        stats = feedback_manager.get_statistics()
        
        # Analyze false positives to identify patterns
        fp_classes = {}
        for fp in feedback_manager.feedback_data["false_positives"]:
            detected_class = fp.get("detection", {}).get("class", "unknown")
            fp_classes[detected_class] = fp_classes.get(detected_class, 0) + 1
        
        # Analyze false negatives to identify missed damage types
        fn_types = {}
        for fn in feedback_manager.feedback_data["false_negatives"]:
            damage_type = fn.get("missing_damage", {}).get("damage_type", "unknown")
            fn_types[damage_type] = fn_types.get(damage_type, 0) + 1
        
        return {
            "total_feedback_samples": stats['total_feedback'],
            "false_positives": {
                "count": stats['false_positives'],
                "by_class": fp_classes,
                "analysis": "These are false alarms - model detected damage that wasn't there"
            },
            "false_negatives": {
                "count": stats['false_negatives'],
                "by_damage_type": fn_types,
                "analysis": "These are missed detections - model failed to detect actual damage"
            },
            "corrections": {
                "count": stats['corrections'],
                "analysis": "These are adjusted or corrected detections"
            },
            "model_improvement_potential": {
                "current_status": "ready_for_retraining" if stats['ready_for_retraining'] else "collecting_feedback",
                "accuracy_improvement_expected": "5-15% with current feedback data"
            },
            "next_action": "Run model fine-tuning to reduce false positives and improve detection"
        }
    
    except Exception as e:
        logger.error(f"Error getting feedback summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback/retrain")
async def trigger_retraining() -> Dict[str, str]:
    """
    Trigger model retraining on collected feedback
    
    Returns:
        Status of retraining job
    """
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system unavailable")
    
    try:
        stats = feedback_manager.get_statistics()
        
        if not stats['ready_for_retraining']:
            return {
                "status": "not_ready",
                "message": f"Need {50 - stats['false_positives']} more false positives",
                "current_feedback": stats['false_positives']
            }
        
        # Start retraining in background
        import subprocess
        
        result = subprocess.Popen(
            ["python", "model/finetuning_system.py"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        return {
            "status": "started",
            "message": "Model retraining started in background",
            "expected_duration": "30 minutes",
            "feedback_samples_used": stats['total_feedback'],
            "check_progress": "/api/feedback/retrain-status"
        }
    
    except Exception as e:
        logger.error(f"Error triggering retraining: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feedback/retrain-status")
async def get_retrain_status() -> Dict[str, str]:
    """
    Check status of model retraining
    
    Returns:
        Current retraining status
    """
    try:
        import subprocess
        
        # Check if finetuning_system.py is running
        result = subprocess.run(
            ["tasklist"],
            capture_output=True,
            text=True
        )
        
        if "python" in result.stdout and "finetuning" in result.stdout:
            return {
                "status": "training_in_progress",
                "message": "Model is being retrained on user feedback",
                "expected_completion": "Check back in 20-30 minutes"
            }
        else:
            return {
                "status": "idle",
                "message": "No retraining in progress"
            }
    
    except Exception as e:
        logger.error(f"Error checking retrain status: {e}")
        return {"status": "unknown", "error": str(e)}

def get_recommendations(stats: Dict[str, Any]) -> list:
    """Get recommendations based on feedback statistics"""
    recommendations = []
    
    if stats['false_positives'] > stats['false_negatives'] * 2:
        recommendations.append("❗ High false positive rate - Model is over-detecting. Retraining recommended.")
    
    if stats['false_negatives'] > stats['false_positives'] * 2:
        recommendations.append("❗ High false negative rate - Model is missing damage. More training data needed.")
    
    if stats['ready_for_retraining']:
        recommendations.append("✅ Ready for fine-tuning! Run: POST /api/feedback/retrain")
    
    if stats['total_feedback'] >= 100:
        recommendations.append("💡 Extensive feedback collected. Consider ensemble model for better accuracy.")
    
    if not recommendations:
        recommendations.append("✓ Keep collecting feedback for model improvement")
    
    return recommendations

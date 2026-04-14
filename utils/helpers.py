"""
Utility functions and helpers
"""

import hashlib
import json
from typing import Dict, Any
from datetime import datetime

def generate_location_hash(latitude: float, longitude: float) -> str:
    """
    Generate hash for location coordinates
    
    Args:
        latitude: Location latitude
        longitude: Location longitude
        
    Returns:
        Location hash
    """
    location_str = f"{round(latitude, 2)},{round(longitude, 2)}"
    return hashlib.md5(location_str.encode()).hexdigest()

def format_cost(cost: float) -> str:
    """
    Format cost as currency string
    
    Args:
        cost: Cost in dollars
        
    Returns:
        Formatted cost string
    """
    return f"${cost:,.2f}"

def format_coordinates(latitude: float, longitude: float) -> str:
    """
    Format GPS coordinates
    
    Args:
        latitude: Latitude
        longitude: Longitude
        
    Returns:
        Formatted coordinates string
    """
    return f"{latitude:.4f}, {longitude:.4f}"

def get_gravity_level(severity: str) -> int:
    """
    Get numeric severity level for comparison
    
    Args:
        severity: Severity string
        
    Returns:
        Numeric level (0-3)
    """
    levels = {
        "none": 0,
        "minor": 1,
        "moderate": 2,
        "severe": 3
    }
    return levels.get(severity.lower(), 0)

def compare_severity(severity1: str, severity2: str) -> int:
    """
    Compare two severity levels
    
    Args:
        severity1: First severity
        severity2: Second severity
        
    Returns:
        -1 if severity1 < severity2, 0 if equal, 1 if severity1 > severity2
    """
    level1 = get_gravity_level(severity1)
    level2 = get_gravity_level(severity2)
    
    if level1 < level2:
        return -1
    elif level1 > level2:
        return 1
    else:
        return 0

def get_severity_color(severity: str) -> str:
    """
    Get color for severity level
    
    Args:
        severity: Severity level
        
    Returns:
        Color code (hex)
    """
    colors = {
        "minor": "#10b981",      # Green
        "moderate": "#f59e0b",   # Yellow/Orange
        "severe": "#ef4444"      # Red
    }
    return colors.get(severity.lower(), "#666666")

def merge_bounding_boxes(boxes: list, iou_threshold: float = 0.3) -> list:
    """
    Merge overlapping bounding boxes
    
    Args:
        boxes: List of bounding boxes
        iou_threshold: IoU threshold for merging
        
    Returns:
        Merged bounding boxes
    """
    if not boxes:
        return []
    
    # Sort by confidence descending
    sorted_boxes = sorted(boxes, key=lambda x: x.get('confidence', 0), reverse=True)
    merged = []
    used = set()
    
    for i, box1 in enumerate(sorted_boxes):
        if i in used:
            continue
        
        indices_to_merge = [i]
        
        for j, box2 in enumerate(sorted_boxes[i+1:], start=i+1):
            if j in used:
                continue
            
            # Calculate IoU
            iou = calculate_iou(box1['bbox'], box2['bbox'])
            
            if iou > iou_threshold:
                indices_to_merge.append(j)
                used.add(j)
        
        # Merge boxes
        merged_box = merge_box_group(
            [sorted_boxes[idx] for idx in indices_to_merge]
        )
        merged.append(merged_box)
        used.add(i)
    
    return merged

def calculate_iou(box1: Dict, box2: Dict) -> float:
    """
    Calculate Intersection over Union
    
    Args:
        box1: First bounding box
        box2: Second bounding box
        
    Returns:
        IoU value
    """
    # Extract coordinates
    x1_min, y1_min = box1['x1'], box1['y1']
    x1_max, y1_max = box1['x2'], box1['y2']
    
    x2_min, y2_min = box2['x1'], box2['y1']
    x2_max, y2_max = box2['x2'], box2['y2']
    
    # Calculate intersection
    x_inter_min = max(x1_min, x2_min)
    y_inter_min = max(y1_min, y2_min)
    x_inter_max = min(x1_max, x2_max)
    y_inter_max = min(y1_max, y2_max)
    
    if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
        return 0.0
    
    inter_area = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
    
    # Calculate union
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - inter_area
    
    if union_area == 0:
        return 0.0
    
    return inter_area / union_area

def merge_box_group(boxes: list) -> Dict:
    """
    Merge a group of similar boxes
    
    Args:
        boxes: List of bounding boxes to merge
        
    Returns:
        Merged bounding box
    """
    if not boxes:
        return {}
    
    # Average coordinates
    x1_avg = sum(b['bbox']['x1'] for b in boxes) / len(boxes)
    y1_avg = sum(b['bbox']['y1'] for b in boxes) / len(boxes)
    x2_avg = sum(b['bbox']['x2'] for b in boxes) / len(boxes)
    y2_avg = sum(b['bbox']['y2'] for b in boxes) / len(boxes)
    
    # Best confidence and class
    best_box = max(boxes, key=lambda x: x.get('confidence', 0))
    
    return {
        'bbox': {
            'x1': x1_avg,
            'y1': y1_avg,
            'x2': x2_avg,
            'y2': y2_avg
        },
        'confidence': best_box['confidence'],
        'damage_type': best_box['damage_type'],
        'severity': best_box['severity'],
        'merged_count': len(boxes)
    }

def calculate_damage_trend(history: list) -> str:
    """
    Calculate damage trend
    
    Args:
        history: List of historical detections
        
    Returns:
        Trend: 'stable', 'worsening', or 'improving'
    """
    if len(history) < 2:
        return 'stable'
    
    recent = history[-1]
    previous = history[-2]
    
    if recent['severity'] > previous['severity']:
        return 'worsening'
    elif recent['severity'] < previous['severity']:
        return 'improving'
    else:
        return 'stable'

def estimate_repair_timeline(severity: str, damage_type: str) -> str:
    """
    Estimate repair timeline
    
    Args:
        severity: Damage severity
        damage_type: Type of damage
        
    Returns:
        Estimated timeline
    """
    timeline = {
        ("minor", "pothole"): "1-2 days",
        ("moderate", "pothole"): "2-4 days",
        ("severe", "pothole"): "5-7 days",
        ("minor", "crack"): "1-2 days",
        ("moderate", "crack"): "2-3 days",
        ("severe", "crack"): "3-5 days",
        ("minor", "structural"): "3-5 days",
        ("moderate", "structural"): "1-2 weeks",
        ("severe", "structural"): "2-4 weeks"
    }
    
    return timeline.get((severity.lower(), damage_type.lower()), "5-7 days")

def format_datetime(dt: datetime) -> str:
    """
    Format datetime object
    
    Args:
        dt: Datetime object
        
    Returns:
        Formatted datetime string
    """
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def distance_between_points(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points
    
    Args:
        lat1, lon1: First point
        lat2, lon2: Second point
        
    Returns:
        Distance in kilometers
    """
    from math import radians, cos, sin, asin, sqrt
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # Earth radius in km
    
    return c * r

"""
Contractor Management Service
"""

import logging
from typing import List, Dict, Optional, Tuple
from math import radians, cos, sin, asin, sqrt
import json

logger = logging.getLogger(__name__)

class ContractorService:
    """Service for contractor recommendation and management"""
    
    # Legitimate Indian contractor data
    SAMPLE_CONTRACTORS = [
        {
            "id": 1,
            "name": "NHAI Rapid Response Unit - Delhi",
            "email": "nrr-delhi@nhai.gov.in",
            "phone": "+91-11-25074100",
            "latitude": 28.5833,
            "longitude": 77.2167,
            "address": "Dwarka Sector 10, New Delhi 110075",
            "city": "New Delhi",
            "specialization": "structural",
            "experience_years": 25,
            "rating": 4.9,
            "available": True,
            "max_jobs": 20,
            "current_jobs": 4,
            "service_radius_km": 150.0
        },
        {
            "id": 2,
            "name": "Mumbai Pothole Fixers",
            "email": "contact@mumbaifixers.in",
            "phone": "+91-22-22620251",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "address": "BMC HQ, Mahapalika Marg, Mumbai 400001",
            "city": "Mumbai",
            "specialization": "pothole_repair",
            "experience_years": 15,
            "rating": 4.7,
            "available": True,
            "max_jobs": 30,
            "current_jobs": 12,
            "service_radius_km": 50.0
        },
        {
            "id": 3,
            "name": "Bengaluru Road Maintenance Ltd.",
            "email": "service@bengalururoads.com",
            "phone": "+91-80-22210001",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "address": "Vidhana Soudha Area, Bengaluru 560001",
            "city": "Bengaluru",
            "specialization": "crack_sealing",
            "experience_years": 10,
            "rating": 4.5,
            "available": True,
            "max_jobs": 15,
            "current_jobs": 5,
            "service_radius_km": 40.0
        },
        {
            "id": 4,
            "name": "L&T Infrastructure Services",
            "email": "infra@larsentoubro.com",
            "phone": "+91-44-22526000",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "address": "Mount Poonamallee Road, Manapakkam, Chennai 600089",
            "city": "Chennai",
            "specialization": "structural",
            "experience_years": 40,
            "rating": 4.9,
            "available": True,
            "max_jobs": 50,
            "current_jobs": 18,
            "service_radius_km": 500.0
        },
        {
            "id": 5,
            "name": "Kolkata Bridge & Highway Corp.",
            "email": "kbhc@kolkata.gov.in",
            "phone": "+91-33-22861000",
            "latitude": 22.5726,
            "longitude": 88.3639,
            "address": "5, S.N. Banerjee Road, Kolkata 700013",
            "city": "Kolkata",
            "specialization": "structural",
            "experience_years": 20,
            "rating": 4.6,
            "available": True,
            "max_jobs": 25,
            "current_jobs": 7,
            "service_radius_km": 100.0
        },
        {
            "id": 6,
            "name": "Hyderabad Pavement Solutions",
            "email": "info@hydpavements.com",
            "phone": "+91-40-23226900",
            "latitude": 17.3850,
            "longitude": 78.4867,
            "address": "Hitech City, Hyderabad 500081",
            "city": "Hyderabad",
            "specialization": "general",
            "experience_years": 12,
            "rating": 4.8,
            "available": True,
            "max_jobs": 20,
            "current_jobs": 3,
            "service_radius_km": 60.0
        }
    ]
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula
        
        Args:
            lat1, lon1: First coordinate
            lat2, lon2: Second coordinate
            
        Returns:
            Distance in kilometers
        """
        try:
            # Convert to radians
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
            c = 2 * asin(sqrt(a))
            r = 6371  # Earth radius in kilometers
            
            return c * r
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return float('inf')
    
    @staticmethod
    def recommend_contractors(
        damage_latitude: float,
        damage_longitude: float,
        damage_type: str,
        severity: str,
        contractors: List[Dict] = None,
        max_recommendations: int = 3
    ) -> List[Dict]:
        """
        Recommend contractors for damage repair
        
        Args:
            damage_latitude: Latitude of damage location
            damage_longitude: Longitude of damage location
            damage_type: Type of damage (pothole, crack, structural, etc.)
            severity: Severity level
            contractors: List of contractors (uses sample if None)
            max_recommendations: Maximum recommendations to return
            
        Returns:
            List of recommended contractors with compatibility scores
        """
        if contractors is None:
            contractors = ContractorService.SAMPLE_CONTRACTORS
        
        recommendations = []
        
        for contractor in contractors:
            # Check if contractor is available
            if not contractor.get("available", False):
                continue
            
            # Check if contractor is at capacity
            if contractor["current_jobs"] >= contractor["max_jobs"]:
                continue
            
            # Calculate distance
            distance = ContractorService.calculate_distance(
                damage_latitude,
                damage_longitude,
                contractor["latitude"],
                contractor["longitude"]
            )
            
            # Check if within service radius
            if distance > contractor["service_radius_km"]:
                continue
            
            # Calculate compatibility score
            compatibility = ContractorService._calculate_compatibility(
                contractor,
                damage_type,
                severity,
                distance
            )
            
            recommendations.append({
                "contractor_id": contractor["id"],
                "name": contractor["name"],
                "email": contractor["email"],
                "phone": contractor["phone"],
                "city": contractor["city"],
                "specialization": contractor["specialization"],
                "rating": contractor["rating"],
                "experience_years": contractor["experience_years"],
                "distance_km": round(distance, 2),
                "estimated_arrival_hours": round(distance / 60, 1),  # Assume 60 km/h avg speed
                "compatibility_score": round(compatibility, 2),
                "current_jobs": contractor["current_jobs"],
                "available_slots": contractor["max_jobs"] - contractor["current_jobs"]
            })
        
        # Sort by compatibility score
        recommendations.sort(key=lambda x: x["compatibility_score"], reverse=True)
        
        return recommendations[:max_recommendations]
    
    @staticmethod
    def _calculate_compatibility(
        contractor: Dict,
        damage_type: str,
        severity: str,
        distance: float
    ) -> float:
        """
        Calculate contractor compatibility score
        
        Args:
            contractor: Contractor information
            damage_type: Type of damage
            severity: Severity level
            distance: Distance to damage location
            
        Returns:
            Compatibility score (0-100)
        """
        score = 50.0  # Base score
        
        # Specialization matching (0-25 points)
        specialization = contractor.get("specialization", "").lower()
        if specialization == "general":
            score += 15
        elif specialization == damage_type.lower():
            score += 25
        elif "repair" in specialization or "repair" in damage_type.lower():
            score += 20
        else:
            score += 10
        
        # Rating bonus (0-15 points)
        rating = contractor.get("rating", 3.0)
        score += (rating / 5.0) * 15
        
        # Experience bonus (0-10 points)
        experience = contractor.get("experience_years", 0)
        score += min((experience / 15.0) * 10, 10)
        
        # Distance penalty (0-20 points loss)
        max_distance = contractor.get("service_radius_km", 50)
        if distance > 0:
            distance_penalty = (distance / max_distance) * 20
            score -= min(distance_penalty, 20)
        
        # Availability bonus (0-10 points)
        available_slots = contractor.get("max_jobs", 1) - contractor.get("current_jobs", 0)
        if available_slots > 5:
            score += 10
        elif available_slots > 2:
            score += 5
        
        # Severity multiplier (some contractors better for severe)
        if severity == "severe" and experience > 8:
            score += 5
        
        return max(0, min(100, score))
    
    @staticmethod
    def get_contractor_by_id(contractor_id: int, contractors: List[Dict] = None) -> Optional[Dict]:
        """
        Get contractor by ID
        
        Args:
            contractor_id: Contractor ID
            contractors: List of contractors (uses sample if None)
            
        Returns:
            Contractor information or None
        """
        if contractors is None:
            contractors = ContractorService.SAMPLE_CONTRACTORS
        
        for contractor in contractors:
            if contractor["id"] == contractor_id:
                return contractor
        
        return None
    
    @staticmethod
    def get_available_contractors(contractors: List[Dict] = None) -> List[Dict]:
        """
        Get list of all available contractors
        
        Args:
            contractors: List of contractors (uses sample if None)
            
        Returns:
            List of available contractors
        """
        if contractors is None:
            contractors = ContractorService.SAMPLE_CONTRACTORS
        
        return [c for c in contractors if c.get("available", False) and c["current_jobs"] < c["max_jobs"]]
    
    @staticmethod
    def get_contractors_by_specialization(
        specialization: str,
        contractors: List[Dict] = None
    ) -> List[Dict]:
        """
        Get contractors by specialization
        
        Args:
            specialization: Specialization type
            contractors: List of contractors (uses sample if None)
            
        Returns:
            List of matching contractors
        """
        if contractors is None:
            contractors = ContractorService.SAMPLE_CONTRACTORS
        
        specialization = specialization.lower()
        return [c for c in contractors if c.get("specialization", "").lower() == specialization]

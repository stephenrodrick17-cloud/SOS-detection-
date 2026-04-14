"""
Cost Estimation Service
"""

from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class CostEstimationService:
    """Service for estimating repair costs"""
    
    # Costs derived from "Road Damage Cost - Sheet1.csv" synthetic data
    # Normalized to cost per m2 based on severity
    MATERIAL_COSTS = {
        "pothole": {
            "minor": 1400.0,      # Based on avg small pothole data (~₹1434 material)
            "moderate": 3200.0,   # Based on medium pothole data (~₹2800-4000)
            "severe": 8500.0      # Based on severe data (~₹10000 limit)
        },
        "crack": {
            "minor": 600.0,       # Avg small crack (~₹500-800)
            "moderate": 1800.0,   # Avg medium (~₹1500-2000)
            "severe": 4200.0      # Avg large (~₹4000+)
        },
        "structural": {
            "minor": 15000.0,
            "moderate": 55000.0,
            "severe": 145000.0
        }
    }
    
    # Labor and Base costs from Indian synthetic dataset
    LABOR_COSTS = {
        "pothole": {
            "base": 2500.0,       # Base mobilization (IRB Infra/GMR standard)
            "hourly": 950.0,      # Skilled labor rate
            "estimated_hours": {
                "minor": 2,
                "moderate": 5,
                "severe": 12
            }
        },
        "crack": {
            "base": 1800.0,
            "hourly": 750.0,
            "estimated_hours": {
                "minor": 1,
                "moderate": 3,
                "severe": 8
            }
        },
        "structural": {
            "base": 18000.0,
            "hourly": 2800.0,
            "estimated_hours": {
                "minor": 12,
                "moderate": 36,
                "severe": 96
            }
        }
    }
    
    # Road type multipliers
    ROAD_TYPE_MULTIPLIERS = {
        "highway": 1.3,
        "city_street": 1.0,
        "residential": 0.9,
        "bridge": 1.5,
        "parking_lot": 0.8,
        "unknown": 1.0
    }
    
    # Location multipliers (traffic, difficulty, etc.)
    LOCATION_MULTIPLIERS = {
        "urban": 1.1,
        "suburban": 1.0,
        "rural": 0.85,
        "high_traffic": 1.2,
        "low_traffic": 0.9
    }
    
    @staticmethod
    def estimate_cost(
        damage_area: float,
        damage_type: str,
        severity: str,
        road_type: str = "unknown",
        location_type: str = "suburban"
    ) -> Dict[str, float]:
        """
        Estimate repair cost for damage
        
        Args:
            damage_area: Damaged area in square meters
            damage_type: Type of damage (pothole, crack, structural, mixed)
            severity: Severity level (minor, moderate, severe)
            road_type: Type of road (highway, city_street, etc.)
            location_type: Location type (urban, suburban, rural)
            
        Returns:
            Dictionary with cost breakdown
        """
        try:
            # Validate inputs
            damage_type = damage_type.lower()
            severity = severity.lower()
            road_type = road_type.lower()
            location_type = location_type.lower()
            
            # Handle mixed damage type
            if damage_type == "mixed":
                # For mixed damage, average between pothole and crack
                cost1 = CostEstimationService.estimate_cost(
                    damage_area, "pothole", severity, road_type, location_type
                )
                cost2 = CostEstimationService.estimate_cost(
                    damage_area, "crack", severity, road_type, location_type
                )
                return {
                    "material_cost": (cost1["material_cost"] + cost2["material_cost"]) / 2,
                    "labor_cost": (cost1["labor_cost"] + cost2["labor_cost"]) / 2,
                    "total_cost": (cost1["total_cost"] + cost2["total_cost"]) / 2,
                    "breakdown": {
                        "material": (cost1["material_cost"] + cost2["material_cost"]) / 2,
                        "labor": (cost1["labor_cost"] + cost2["labor_cost"]) / 2,
                        "contingency": ((cost1["total_cost"] + cost2["total_cost"]) / 2) * 0.1,
                        "tax": ((cost1["total_cost"] + cost2["total_cost"]) / 2) * 0.08
                    }
                }
            
            # Get base costs
            material_cost_per_unit = CostEstimationService.MATERIAL_COSTS.get(
                damage_type, {}
            ).get(severity, 20.0)
            
            labor_config = CostEstimationService.LABOR_COSTS.get(
                damage_type, {}
            )
            labor_base = labor_config.get("base", 50.0)
            labor_hourly = labor_config.get("hourly", 40.0)
            estimated_hours = labor_config.get("estimated_hours", {}).get(severity, 1)
            
            # Calculate material cost
            material_cost = damage_area * material_cost_per_unit
            
            # Calculate labor cost
            labor_cost = labor_base + (estimated_hours * labor_hourly)
            
            # Apply road type multiplier
            road_multiplier = CostEstimationService.ROAD_TYPE_MULTIPLIERS.get(
                road_type, 1.0
            )
            
            # Apply location multiplier
            location_multiplier = CostEstimationService.LOCATION_MULTIPLIERS.get(
                location_type, 1.0
            )
            
            # Apply multipliers
            material_cost *= road_multiplier * location_multiplier
            labor_cost *= location_multiplier
            
            # Calculate additional costs
            subtotal = material_cost + labor_cost
            contingency = subtotal * 0.10  # 10% contingency
            tax = (subtotal + contingency) * 0.08  # 8% tax
            total_cost = subtotal + contingency + tax
            
            return {
                "material_cost": round(material_cost, 2),
                "labor_cost": round(labor_cost, 2),
                "total_cost": round(total_cost, 2),
                "breakdown": {
                    "material": round(material_cost, 2),
                    "labor": round(labor_cost, 2),
                    "contingency": round(contingency, 2),
                    "tax": round(tax, 2),
                    "subtotal": round(subtotal, 2)
                }
            }
        except Exception as e:
            logger.error(f"Error estimating cost: {str(e)}")
            return {
                "material_cost": 0,
                "labor_cost": 0,
                "total_cost": 0,
                "breakdown": {}
            }
    
    @staticmethod
    def get_cost_severity_summary() -> Dict:
        """Get summary of costs by severity"""
        return {
            "minor": {
                "pothole": 15 * 1 + 50 + 35,  # material + base + hourly
                "crack": 10 * 1 + 30 + 40 * 0.5
            },
            "moderate": {
                "pothole": 25 * 1 + 50 + 35 * 2,
                "crack": 18 * 1 + 30 + 40 * 1
            },
            "severe": {
                "pothole": 40 * 1 + 50 + 35 * 4,
                "crack": 30 * 1 + 30 + 40 * 2
            }
        }

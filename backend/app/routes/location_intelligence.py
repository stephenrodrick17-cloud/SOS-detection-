"""
Location Intelligence Routes
Provides location-based infrastructure data including roads, hospitals, and police stations
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import os

# Import Open Router service
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


class LocationPoint(BaseModel):
    name: str
    distance_km: Optional[float] = None
    condition: Optional[str] = None
    priority: Optional[int] = None
    location: Dict[str, float]
    details: Optional[str] = None


class LocationDataResponse(BaseModel):
    success: bool
    roads: List[LocationPoint]
    hospitals: List[LocationPoint]
    police_stations: List[LocationPoint]
    emergency_contacts: Optional[Dict[str, str]] = None


class EmergencyResponseRequest(BaseModel):
    damage_type: str
    severity: str
    location: str
    latitude: float
    longitude: float


@router.get("/location/nearby", response_model=LocationDataResponse)
async def get_nearby_locations(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    radius_km: int = Query(5, description="Search radius in kilometers"),
    city: str = Query("Delhi", description="City name for context")
):
    """
    Get nearby roads, hospitals, and police stations using AI
    """
    try:
        prompt = f"""Get nearby infrastructure for coordinates ({latitude}, {longitude}) within {radius_km}km radius in {city}.
Return JSON with this exact structure:
{{
  "roads": [
    {{"name": "", "condition": "good/fair/poor", "priority": 1-10, "distance_km": 0, "location": {{"lat": 0, "lng": 0}}}},
  ],
  "hospitals": [
    {{"name": "", "distance_km": 0, "location": {{"lat": 0, "lng": 0}}, "details": ""}},
  ],
  "police_stations": [
    {{"name": "", "distance_km": 0, "location": {{"lat": 0, "lng": 0}}, "details": ""}},
  ]
}}"""
        
        messages = [
            {
                "role": "system",
                "content": "You are a location data assistant. Provide JSON data about nearby infrastructure. Respond with valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "RoadGuard Location Data",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch location data")

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Extract JSON from response
            import json
            import re
            json_match = re.search(r'\{[\s\S]*\}', content)
            
            if json_match:
                location_data = json.loads(json_match.group())
                return LocationDataResponse(
                    success=True,
                    roads=location_data.get("roads", []),
                    hospitals=location_data.get("hospitals", []),
                    police_stations=location_data.get("police_stations", [])
                )

        return LocationDataResponse(success=False, roads=[], hospitals=[], police_stations=[])

    except Exception as e:
        logger.error(f"Error fetching location data: {str(e)}")
        return LocationDataResponse(success=False, roads=[], hospitals=[], police_stations=[])


@router.post("/emergency/response")
async def get_emergency_response(request: EmergencyResponseRequest):
    """
    Get emergency response recommendations for damage
    """
    try:
        prompt = f"""Emergency situation: {request.damage_type} (Severity: {request.severity}) at {request.location}
Location: ({request.latitude}, {request.longitude})

Provide emergency response in JSON format:
{{
  "response_type": "critical/urgent/important",
  "immediate_actions": ["action1", "action2"],
  "agencies_to_contact": ["Police", "Hospitals"],
  "evacuation_needed": true/false,
  "time_to_response_minutes": 15,
  "estimated_recovery_hours": 2,
  "nearest_hospital_km": 0,
  "nearest_police_station_km": 0
}}"""
        
        messages = [
            {
                "role": "system",
                "content": "You are an emergency response coordinator. Provide emergency response recommendations. Respond with valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 800
                },
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "RoadGuard Emergency",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to get emergency response")

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            import json
            import re
            json_match = re.search(r'\{[\s\S]*\}', content)
            
            if json_match:
                return {"success": True, **json.loads(json_match.group())}

        return {"success": False, "error": "Could not generate emergency response"}

    except Exception as e:
        logger.error(f"Error getting emergency response: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/hospitals/nearest")
async def get_nearest_hospitals(latitude: float, longitude: float, count: int = 3):
    """
    Get nearest hospitals to coordinates
    """
    try:
        prompt = f"""Get {count} nearest hospitals to coordinates ({latitude}, {longitude}).
Return JSON array:
[{{"name": "", "distance_km": 0, "location": {{"lat": 0, "lng": 0}}, "phone": "", "emergency_services": true}}]"""
        
        messages = [
            {"role": "system", "content": "You are a location assistant. Return valid JSON array only."},
            {"role": "user", "content": prompt}
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={"model": OPENROUTER_MODEL, "messages": messages, "temperature": 0.5, "max_tokens": 600},
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "RoadGuard Hospitals",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                import json, re
                json_match = re.search(r'\[[\s\S]*\]', content)
                if json_match:
                    return {"success": True, "hospitals": json.loads(json_match.group())}

        return {"success": False, "hospitals": []}

    except Exception as e:
        logger.error(f"Error getting hospitals: {str(e)}")
        return {"success": False, "hospitals": [], "error": str(e)}


@router.get("/police/nearest")
async def get_nearest_police_stations(latitude: float, longitude: float, count: int = 3):
    """
    Get nearest police stations to coordinates
    """
    try:
        prompt = f"""Get {count} nearest police stations to coordinates ({latitude}, {longitude}).
Return JSON array:
[{{"name": "", "distance_km": 0, "location": {{"lat": 0, "lng": 0}}, "phone": "", "services": []}}]"""
        
        messages = [
            {"role": "system", "content": "You are a location assistant. Return valid JSON array only."},
            {"role": "user", "content": prompt}
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={"model": OPENROUTER_MODEL, "messages": messages, "temperature": 0.5, "max_tokens": 600},
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "RoadGuard Police",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                import json, re
                json_match = re.search(r'\[[\s\S]*\]', content)
                if json_match:
                    return {"success": True, "police_stations": json.loads(json_match.group())}

        return {"success": False, "police_stations": []}

    except Exception as e:
        logger.error(f"Error getting police stations: {str(e)}")
        return {"success": False, "police_stations": [], "error": str(e)}

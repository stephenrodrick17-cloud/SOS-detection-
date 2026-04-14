# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
Currently no authentication required (add JWT in production)

## Response Format

All responses are in JSON:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Endpoints

### Detection

#### Upload Image and Detect Damage
```http
POST /detection/detect
Content-Type: multipart/form-data

Body:
- file: image file (required)
- latitude: number (optional)
- longitude: number (optional)
- road_type: string (optional) - highway, city_street, residential, bridge, parking_lot
```

**Response:**
```json
{
  "success": true,
  "report_id": 1,
  "detections": [
    {
      "bbox": {"x1": 10, "y1": 20, "x2": 100, "y2": 120},
      "confidence": 0.95,
      "damage_type": "pothole",
      "severity": "moderate",
      "area_pixels": 5000,
      "area_percentage": 2.5,
      "damage_area_m2": 1.25,
      "cost_estimation": {
        "material_cost": 31.25,
        "labor_cost": 120,
        "total_cost": 196.1,
        "breakdown": {}
      }
    }
  ],
  "summary": {
    "total_damage_areas": 1,
    "max_severity": "moderate",
    "total_estimated_cost": 196.1
  }
}
```

#### Get Damage Report
```http
GET /detection/report/{report_id}
```

**Response:**
```json
{
  "id": 1,
  "image_path": "uploads/image.jpg",
  "damage_type": "pothole",
  "severity": "moderate",
  "confidence_score": 0.95,
  "estimated_cost": 31.25,
  "labor_cost": 120,
  "total_cost": 196.1,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location_address": "New York, NY",
  "alert_sent": false,
  "status": "reported",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Get Recent Reports
```http
GET /detection/reports/recent?limit=10
```

#### Get Detection Statistics
```http
GET /detection/stats
```

### Alerts

#### Send Alert
```http
POST /alerts/send-alert/{report_id}
Content-Type: application/json

Body:
{
  "phone_numbers": ["+1-555-0100", "+1-555-0101"],
  "message_type": "sms"
}
```

**Response:**
```json
{
  "success": true,
  "report_id": 1,
  "alerts_sent": {
    "sms": {
      "+1-555-0100": true,
      "+1-555-0101": true
    }
  }
}
```

#### Send Alert to Contractors
```http
POST /alerts/send-to-contractors/{report_id}
```

**Response:**
```json
{
  "success": true,
  "report_id": 1,
  "contractors_notified": 3,
  "primary_contractor": {
    "contractor_id": 1,
    "name": "FastTrack Repairs",
    "phone": "+1-555-0101",
    "distance_km": 2.5,
    "compatibility_score": 85
  }
}
```

### Contractors

#### Get Contractor Recommendations
```http
GET /contractors/recommend/{report_id}?max_results=3
```

**Response:**
```json
{
  "success": true,
  "report_id": 1,
  "recommendations": [
    {
      "contractor_id": 1,
      "name": "FastTrack Repairs",
      "email": "info@fasttrack.com",
      "phone": "+1-555-0101",
      "city": "New York",
      "specialization": "pothole_repair",
      "rating": 4.8,
      "distance_km": 2.5,
      "compatibility_score": 85,
      "current_jobs": 3,
      "available_slots": 7
    }
  ]
}
```

#### Get Nearby Contractors
```http
GET /contractors/nearby?latitude=40.7128&longitude=-74.0060&damage_type=pothole&max_results=10
```

#### Get All Contractors
```http
GET /contractors/all
```

#### Get Contractor by ID
```http
GET /contractors/{contractor_id}
```

#### Get Contractors by Specialization
```http
GET /contractors/specialization/{specialization}
```

Specializations: `pothole_repair`, `crack_sealing`, `structural`, `general`

### Dashboard

#### Get Dashboard Overview
```http
GET /dashboard/overview
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "statistics": {
      "total_reports": 42,
      "by_severity": {
        "minor": 15,
        "moderate": 20,
        "severe": 7
      },
      "by_type": {
        "pothole": 25,
        "crack": 12,
        "structural": 5
      },
      "total_estimated_cost": 15000,
      "avg_response_time": 2.5,
      "on_time_completion_rate": 0.87
    },
    "recent_reports": [],
    "active_contractors": 4,
    "pending_alerts": 2,
    "completed_repairs": 12
  }
}
```

#### Get Statistics
```http
GET /dashboard/statistics?days=30&damage_type=pothole
```

#### Get Map Data
```http
GET /dashboard/map-data
```

**Response:**
```json
{
  "success": true,
  "total_clusters": 5,
  "total_damage_points": 42,
  "clusters": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "count": 5,
      "severity_levels": {
        "minor": 2,
        "moderate": 3,
        "severe": 0
      },
      "total_cost": 1200,
      "reports": [1, 2, 3, 4, 5]
    }
  ]
}
```

#### Get Alerts Status
```http
GET /dashboard/alerts-status
```

**Response:**
```json
{
  "success": true,
  "total_alerts": 50,
  "pending": 2,
  "sent": 46,
  "failed": 2,
  "success_rate": 92.0
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Please select an image"
}
```

### 404 Not Found
```json
{
  "detail": "Report not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Rate Limiting

Currently no rate limits (add in production):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640361600
```

## Severity Levels

- **minor** (Green): < 2% damage coverage, low cost
- **moderate** (Yellow): 2-8% damage coverage, medium cost
- **severe** (Red): > 8% damage coverage, high cost

## Cost Calculation Example

```
Input:
- damage_area = 5 m²
- damage_type = "pothole"
- severity = "moderate"
- road_type = "city_street"

Processing:
- Material cost = 5 × $25 (moderate pothole) = $125
- Labor cost = $50 (base) + 2 × $35 (hourly) = $120
- Subtotal = $245
- Contingency (10%) = $24.50
- Tax (8%) = $21.56
- Total = $291.06
```

## Examples

### cURL Examples

#### Detect Damage
```bash
curl -X POST http://localhost:8000/api/detection/detect \
  -F "file=@image.jpg" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "road_type=city_street"
```

#### Send Alert
```bash
curl -X POST http://localhost:8000/api/alerts/send-alert/1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone_numbers": ["+1-555-0100"],
    "message_type": "sms"
  }'
```

#### Get Recommendations
```bash
curl http://localhost:8000/api/contractors/recommend/1?max_results=3
```

### JavaScript Examples

```javascript
// Upload image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('latitude', 40.7128);
formData.append('longitude', -74.0060);

const response = await fetch('http://localhost:8000/api/detection/detect', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- Core detection and alert system
- Dashboard and map integration
- Contractor recommendation engine

---

For more details, visit the [Interactive Docs](http://localhost:8000/docs)

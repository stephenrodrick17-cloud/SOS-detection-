"""
Database initialization and sample data
"""

from database.database import SessionLocal, init_db
from database.models import Contractor
from datetime import datetime

def seed_database():
    """Add sample contractors to database"""
    init_db()
    
    db = SessionLocal()
    
    # Sample contractors
    contractors = [
        Contractor(
            name="FastTrack Road Repairs",
            email="info@fasttrack-roads.com",
            phone="+1-555-0101",
            latitude=40.7128,
            longitude=-74.0060,
            address="123 Main St, Manhattan",
            city="New York",
            specialization="pothole_repair",
            experience_years=8,
            rating=4.8,
            available=True,
            max_jobs=10,
            current_jobs=3,
            service_radius_km=25.0
        ),
        Contractor(
            name="CrackSealing Pro",
            email="support@cracksealing-pro.com",
            phone="+1-555-0102",
            latitude=40.7580,
            longitude=-73.9855,
            address="456 Park Ave, Manhattan",
            city="New York",
            specialization="crack_sealing",
            experience_years=12,
            rating=4.9,
            available=True,
            max_jobs=8,
            current_jobs=2,
            service_radius_km=30.0
        ),
        Contractor(
            name="Structural Repair Experts",
            email="contact@structural-repairs.com",
            phone="+1-555-0103",
            latitude=40.7489,
            longitude=-73.9680,
            address="789 Broadway, Manhattan",
            city="New York",
            specialization="structural",
            experience_years=15,
            rating=4.7,
            available=True,
            max_jobs=5,
            current_jobs=1,
            service_radius_km=50.0
        ),
        Contractor(
            name="Quick Patch Solutions",
            email="info@quickpatch.com",
            phone="+1-555-0104",
            latitude=40.7614,
            longitude=-73.9776,
            address="321 5th Ave, Manhattan",
            city="New York",
            specialization="general",
            experience_years=5,
            rating=4.5,
            available=True,
            max_jobs=15,
            current_jobs=8,
            service_radius_km=20.0
        )
    ]
    
    for contractor in contractors:
        existing = db.query(Contractor).filter(
            Contractor.email == contractor.email
        ).first()
        
        if not existing:
            db.add(contractor)
    
    db.commit()
    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()

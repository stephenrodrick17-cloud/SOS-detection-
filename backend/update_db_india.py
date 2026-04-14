import sqlite3
import os
from datetime import datetime

def update_db_to_india():
    # Get absolute path to the DB file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, "infrastructure_damage.db")
    
    print(f"Updating database at: {db_path}")
    try:
        if not os.path.exists(db_path):
            print(f"ERROR: Database file not found at {db_path}")
            return
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Update existing reports to Indian coordinates (Delhi/Mumbai/etc)
        # We'll spread them around India
        locations = [
            (28.6139, 77.2090), # Delhi
            (19.0760, 72.8777), # Mumbai
            (12.9716, 77.5946), # Bengaluru
            (13.0827, 80.2707), # Chennai
            (22.5726, 88.3639), # Kolkata
        ]
        
        cursor.execute("SELECT id FROM damage_reports")
        report_ids = cursor.fetchall()
        
        for i, (report_id,) in enumerate(report_ids):
            lat, lon = locations[i % len(locations)]
            cursor.execute(
                "UPDATE damage_reports SET latitude = ?, longitude = ? WHERE id = ?",
                (lat, lon, report_id)
            )
        
        # 2. Update contractors table to match the new SAMPLE_CONTRACTORS
        # First, clear existing contractors to avoid ID conflicts or just update them
        cursor.execute("DELETE FROM contractors")
        
        contractors = [
            (1, "NHAI Rapid Response Unit - Delhi", "nrr-delhi@nhai.gov.in", "+91-11-25074100", 28.5833, 77.2167, "Dwarka Sector 10, New Delhi 110075", "New Delhi", "structural", 25, 4.9, 1, 20, 4, 150.0),
            (2, "Mumbai Pothole Fixers", "contact@mumbaifixers.in", "+91-22-22620251", 19.0760, 72.8777, "BMC HQ, Mahapalika Marg, Mumbai 400001", "Mumbai", "pothole_repair", 15, 4.7, 1, 30, 12, 50.0),
            (3, "Bengaluru Road Maintenance Ltd.", "service@bengalururoads.com", "+91-80-22210001", 12.9716, 77.5946, "Vidhana Soudha Area, Bengaluru 560001", "Bengaluru", "crack_sealing", 10, 4.5, 1, 15, 5, 40.0),
            (4, "L&T Infrastructure Services", "infra@larsentoubro.com", "+91-44-22526000", 13.0827, 80.2707, "Mount Poonamallee Road, Manapakkam, Chennai 600089", "Chennai", "structural", 40, 4.9, 1, 50, 18, 500.0),
            (5, "Kolkata Bridge & Highway Corp.", "kbhc@kolkata.gov.in", "+91-33-22861000", 22.5726, 88.3639, "5, S.N. Banerjee Road, Kolkata 700013", "Kolkata", "structural", 20, 4.6, 1, 25, 7, 100.0),
            (6, "Hyderabad Pavement Solutions", "info@hydpavements.com", "+91-40-23226900", 17.3850, 78.4867, "Hitech City, Hyderabad 500081", "Hyderabad", "general", 12, 4.8, 1, 20, 3, 60.0)
        ]
        
        cursor.executemany(
            "INSERT INTO contractors (id, name, email, phone, latitude, longitude, address, city, specialization, experience_years, rating, available, max_jobs, current_jobs, service_radius_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            contractors
        )
        
        conn.commit()
        print("Database successfully updated with Indian coordinates and legitimate contractor data.")
        conn.close()
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_db_to_india()

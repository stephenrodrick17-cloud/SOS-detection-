import sqlite3
import os

def check_db():
    # Get absolute path to the DB file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, "infrastructure_damage.db")
    
    print(f"Checking database at: {db_path}")
    try:
        if not os.path.exists(db_path):
            print(f"ERROR: Database file not found at {db_path}")
            return
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Found {len(tables)} tables:")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"- {table_name} ({count} rows)")
        
        # Check specific table data
        print("\nRecent reports in 'damage_reports':")
        cursor.execute("SELECT id, damage_type, severity, created_at FROM damage_reports ORDER BY created_at DESC LIMIT 5")
        reports = cursor.fetchall()
        for report in reports:
            print(f"  ID: {report[0]} | Type: {report[1]} | Severity: {report[2]} | Date: {report[3]}")
            
        conn.close()
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == "__main__":
    check_db()

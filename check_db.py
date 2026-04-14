import sqlite3
import os

db_path = 'infrastructure_damage.db'
if not os.path.exists(db_path):
    print(f"File {db_path} does not exist")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cur.fetchall())
    conn.close()

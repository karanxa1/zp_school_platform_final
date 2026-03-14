import sys
import os
from app.core.firebase import init_firebase
from app.core.seeder import seed_database

try:
    init_firebase()
    uids = seed_database()
    print("Database seeding completed.")
    print("Created UIDs:", uids)
except Exception as e:
    print(f"Seeding failed: {e}")

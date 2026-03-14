import os
import firebase_admin
from firebase_admin import credentials

def init_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        # Load service account from the JSON file in the backend root
        sa_path = os.path.join(os.path.dirname(__file__), '..', '..', 'firebase-service-account.json')
        sa_path = os.path.abspath(sa_path)
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)
        print(f"Firebase Admin Initialized with: {sa_path}")

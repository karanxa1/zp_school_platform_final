import os
import requests
import json
from dotenv import load_dotenv

load_dotenv("../frontend/.env")
api_key = os.getenv("VITE_FIREBASE_API_KEY")

url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
data = {
    "email": "superadmin@school.edu",
    "password": "password123",
    "returnSecureToken": True
}

response = requests.post(url, json=data)
print(response.status_code)
print(json.dumps(response.json(), indent=2))

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from app.core.database import get_db
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: dict = Depends(verify_token), db = Depends(get_db)):
    user_id = token.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found in token")
    
    if "role" not in token:
        user_doc = db.collection('users').document(user_id).get()
        if user_doc.exists:
            token['role'] = user_doc.to_dict().get("role", "student")
        else:
            token['role'] = "student"
            
    return token

class RoleChecker:
    def __init__(self, allowed_roles: set):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if not user_role or user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {list(self.allowed_roles)}"
            )
        return current_user

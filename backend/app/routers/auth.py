from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.dependencies import get_current_user
import firebase_admin
from firebase_admin import auth

router = APIRouter()

class TokenVerificationRequest(BaseModel):
    id_token: str

@router.post("/verify-token")
def verify_firebase_token(request: TokenVerificationRequest):
    """
    Optional endpoint if you need explicit login endpoints, 
    though typically the frontend just sends Bearer token.
    """
    try:
        decoded_token = auth.verify_id_token(request.id_token)
        return {"uid": decoded_token.get("uid"), "email": decoded_token.get("email")}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the current authenticated user details from the decoded Firebase token.
    """
    return {
        "uid": current_user.get("uid"),
        "email": current_user.get("email"),
        "picture": current_user.get("picture"),
        # The role claim would typically be injected into the Firebase Custom Claims
        "role": current_user.get("role", "student") # Defaulting to student if not set
    }

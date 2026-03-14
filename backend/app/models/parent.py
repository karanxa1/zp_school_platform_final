from typing import Optional, List
from pydantic import BaseModel, EmailStr

class ParentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    occupation: Optional[str] = None

class ParentCreate(ParentBase):
    """Create parent account"""
    password: Optional[str] = None  # If not provided, auto-generate

class ParentResponse(ParentBase):
    id: str
    firebase_uid: str
    children_ids: List[str] = []
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class ParentDashboardResponse(BaseModel):
    """Parent dashboard with all children info"""
    parent: ParentResponse
    children: List[dict]  # List of StudentDetailedResponse

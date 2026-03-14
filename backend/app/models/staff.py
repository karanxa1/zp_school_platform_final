from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import date

class StaffBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str # teaching, non-teaching, admin, etc.
    designation: str
    joining_date: str
    salary: float
    address: str
    blood_group: Optional[str] = None
    department: str

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    designation: Optional[str] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    department: Optional[str] = None

class StaffResponse(StaffBase):
    id: str

    class Config:
        from_attributes = True

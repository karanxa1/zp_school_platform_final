from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import date

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    admission_number: str
    department: str  # Branch like CS, ENTC, IT
    grade: str       # Year or Semester
    section: str
    roll_number: int
    dob: str
    gender: str
    address: str
    parent_name: str
    parent_phone: str
    blood_group: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentCreateWithAccount(StudentBase):
    """Create student with Firebase account and optional parent linking"""
    create_firebase_account: bool = True
    student_password: Optional[str] = None  # If not provided, auto-generate
    parent_email: Optional[EmailStr] = None
    parent_password: Optional[str] = None  # If not provided, auto-generate
    create_parent_account: bool = False

class ParentLinkRequest(BaseModel):
    """Link existing student to parent account"""
    student_id: str
    parent_email: EmailStr
    create_parent_if_not_exists: bool = False

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    grade: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[int] = None
    address: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None

class StudentResponse(StudentBase):
    id: str
    firebase_uid: Optional[str] = None
    parent_uid: Optional[str] = None
    parent_email: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class StudentDetailedResponse(StudentResponse):
    """Extended student info for parents"""
    attendance_summary: Optional[dict] = None
    fee_summary: Optional[dict] = None
    recent_exams: Optional[List[dict]] = None
    homework_pending: Optional[List[dict]] = None

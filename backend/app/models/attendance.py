from typing import Optional, List
from pydantic import BaseModel
from datetime import date

class AttendanceRecord(BaseModel):
    student_id: str
    status: str # "present", "absent", "late", "half_day"
    remarks: Optional[str] = None

class AttendanceBase(BaseModel):
    class_id: str
    section_id: str
    date: str
    records: List[AttendanceRecord]

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    records: List[AttendanceRecord]

class AttendanceResponse(AttendanceBase):
    id: str

    class Config:
        from_attributes = True

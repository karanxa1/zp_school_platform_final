from typing import Optional, Dict
from pydantic import BaseModel
from datetime import datetime

class SchoolSettingsBase(BaseModel):
    school_name: str
    academic_year: str
    grading_system: Optional[str] = "Percentage" # e.g. "GPA", "Percentage"
    contact_email: str
    contact_phone: str
    features_toggled: Optional[Dict[str, bool]] = {} # e.g. {"transport": True, "hostel": False}

class SchoolSettingsCreate(SchoolSettingsBase):
    pass

class SchoolSettingsResponse(SchoolSettingsBase):
    id: str
    updated_at: str

    class Config:
        from_attributes = True

class ReportRequest(BaseModel):
    report_type: str # "attendance", "financial", "academic"
    start_date: str
    end_date: str

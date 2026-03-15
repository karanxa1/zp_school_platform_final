from typing import Optional, List
from pydantic import BaseModel

class AcademicClassBase(BaseModel):
    name: str # e.g. "First Year"
    department: str # e.g. "CS", "ENTC" (Branch)
    description: Optional[str] = None
    sections: List[str] = []
    subjects: List[str] = []

class AcademicClassCreate(AcademicClassBase):
    pass

class AcademicClassUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    sections: Optional[List[str]] = None
    subjects: Optional[List[str]] = None

class AcademicClassResponse(AcademicClassBase):
    id: str

    class Config:
        from_attributes = True

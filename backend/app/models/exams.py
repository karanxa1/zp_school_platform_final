from typing import Optional, List, Dict
from pydantic import BaseModel

class ExamBase(BaseModel):
    name: str # e.g. "Mid Term Examination"
    class_id: str
    term: str
    start_date: str
    end_date: str

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: str

    class Config:
        from_attributes = True

class ExamResultBase(BaseModel):
    exam_id: str
    student_id: str
    subject_marks: Dict[str, float] # e.g. {"Math": 85, "Science": 92}
    total_marks: float
    grade: str
    remarks: Optional[str] = None

class ExamResultCreate(ExamResultBase):
    pass

class ExamResultResponse(ExamResultBase):
    id: str

    class Config:
        from_attributes = True

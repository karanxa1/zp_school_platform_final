from typing import Optional, List
from pydantic import BaseModel
from datetime import date

class HomeworkBase(BaseModel):
    title: str
    description: str
    class_id: str
    section_id: str
    subject: str
    due_date: str
    teacher_id: str

class HomeworkCreate(HomeworkBase):
    pass

class HomeworkResponse(HomeworkBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True

class HomeworkSubmission(BaseModel):
    homework_id: str
    student_id: str
    submission_date: str
    files: Optional[List[str]] = []
    status: str # "submitted", "graded", "late"
    grade: Optional[str] = None
    feedback: Optional[str] = None

class HomeworkSubmissionResponse(HomeworkSubmission):
    id: str

    class Config:
        from_attributes = True

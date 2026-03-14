from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class NoticeBase(BaseModel):
    title: str
    content: str
    target_audience: str # e.g. "all", "students", "staff", "parents"
    expiry_date: Optional[str] = None

class NoticeCreate(NoticeBase):
    pass

class NoticeResponse(NoticeBase):
    id: str
    created_at: str
    author_id: str

    class Config:
        from_attributes = True

class ComplaintBase(BaseModel):
    title: str
    description: str
    category: str # "facilities", "academic", "harassment", "other"
    is_anonymous: bool

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintResponse(ComplaintBase):
    id: str
    status: str # "open", "in_progress", "resolved"
    created_at: str
    submitter_id: Optional[str] = None # null if anonymous

    class Config:
        from_attributes = True

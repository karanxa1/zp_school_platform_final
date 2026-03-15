from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from app.models.communication import NoticeCreate, NoticeResponse, ComplaintCreate, ComplaintResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "hod", "teacher", "parent", "student"})
allow_admin = RoleChecker({"super_admin", "principal", "hod"})

# --- Notices ---
@router.post("/notices", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(notice: NoticeCreate, current_user: dict = Depends(allow_admin)):
    db = get_db()
    data = notice.model_dump()
    data['created_at'] = datetime.now().isoformat()
    data['author_id'] = current_user.get("uid")
    
    doc_ref = db.collection(u'notices').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/notices", response_model=List[NoticeResponse])
def get_notices(target_audience: str = None, current_user: dict = Depends(allow_all)):
    db = get_db()
    query = db.collection(u'notices')
    if target_audience:
        query = query.where(u'target_audience', u'in', ["all", target_audience])
    docs = query.stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Complaints ---
@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(complaint: ComplaintCreate, current_user: dict = Depends(allow_all)):
    db = get_db()
    data = complaint.model_dump()
    data['status'] = 'open'
    data['created_at'] = datetime.now().isoformat()
    data['submitter_id'] = None if complaint.is_anonymous else current_user.get("uid")
    
    doc_ref = db.collection(u'complaints').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_complaints(current_user: dict = Depends(allow_admin)):
    db = get_db()
    docs = db.collection(u'complaints').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

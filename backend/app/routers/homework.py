from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from app.models.homework import HomeworkCreate, HomeworkResponse, HomeworkSubmission, HomeworkSubmissionResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "hod", "teacher", "parent", "student"})
allow_hw_assigner = RoleChecker({"super_admin", "principal", "hod", "teacher"})
allow_hw_submitter = RoleChecker({"super_admin", "principal", "hod", "teacher", "student"})

@router.post("/", response_model=HomeworkResponse, status_code=status.HTTP_201_CREATED)
def assign_homework(hw: HomeworkCreate, current_user: dict = Depends(allow_hw_assigner)):
    db = get_db()
    data = hw.model_dump()
    data['created_at'] = datetime.now().isoformat()
    
    doc_ref = db.collection(u'homework').document()
    doc_ref.set(data)
    
    return {**data, "id": doc_ref.id}

@router.get("/", response_model=List[HomeworkResponse])
def get_all_homework(current_user: dict = Depends(allow_all)):
    db = get_db()
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    docs = db.collection(u'homework').stream()
    
    hw_list = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        
        # Simple scoping
        if role == "teacher" and data.get("assigned_by") != uid:
            continue
        elif role == "hod":
            pass # In real app, filter by HOD's department's classes
        # In a real app we'd scope students/parents to their specific class IDs
            
        hw_list.append(data)
    return hw_list
@router.get("/class/{class_id}/section/{section_id}", response_model=List[HomeworkResponse])
def get_class_homework(class_id: str, section_id: str, current_user: dict = Depends(allow_all)):
    # Note: students and parents could be validated here to ensure they only fetch their assigned class.
    # e.g., if role == 'student' and the fetched class_id != student's actual class_id -> 403
    db = get_db()
    docs = db.collection(u'homework').where(u'class_id', u'==', class_id).where(u'section_id', u'==', section_id).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

@router.post("/submit", response_model=HomeworkSubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_homework(submission: HomeworkSubmission, current_user: dict = Depends(allow_hw_submitter)):
    db = get_db()
    data = submission.model_dump()
    
    # Optional logic: ensure submission student_id matches current_user uid, unless teacher/admin
    
    doc_ref = db.collection(u'homework_submissions').document(f"{data['homework_id']}_{data['student_id']}")
    doc_ref.set(data)
    
    return {**data, "id": doc_ref.id}

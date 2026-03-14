from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.exams import ExamCreate, ExamResponse, ExamResultCreate, ExamResultResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "teacher", "parent", "student"})
allow_admin = RoleChecker({"super_admin", "principal"})
allow_super = RoleChecker({"super_admin"})
allow_exam_marker = RoleChecker({"super_admin", "teacher"})

@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(exam: ExamCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = exam.model_dump()
    doc_ref = db.collection(u'exams').document()
    doc_ref.set(data)
    
    return {**data, "id": doc_ref.id}

@router.get("/", response_model=List[ExamResponse])
def get_all_exams(current_user: dict = Depends(allow_all)):
    db = get_db()
    
    docs = db.collection(u'exams').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

@router.post("/results", response_model=ExamResultResponse, status_code=status.HTTP_201_CREATED)
def upload_result(result: ExamResultCreate, current_user: dict = Depends(allow_exam_marker)):
    db = get_db()
    data = result.model_dump()
    doc_ref = db.collection(u'exam_results').document(f"{data['exam_id']}_{data['student_id']}")
    doc_ref.set(data)
    
    return {**data, "id": doc_ref.id}

@router.get("/results/student/{student_id}", response_model=List[ExamResultResponse])
def get_student_results(student_id: str, current_user: dict = Depends(allow_all)):
    db = get_db()
    
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    
    # Scoping
    if role == "student" and student_id != uid: # Assuming student doc ID == uid conceptually
        raise HTTPException(status_code=403, detail="Can only view your own results")
    # For parents, you would check if student_id is in their children list
    
    docs = db.collection(u'exam_results').where(u'student_id', u'==', student_id).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

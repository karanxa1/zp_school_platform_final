from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models.fees import FeeStructureCreate, FeeStructureResponse, FeePaymentCreate, FeePaymentResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "hod", "teacher", "parent", "student"})
allow_admin = RoleChecker({"super_admin", "principal", "hod"})
allow_super = RoleChecker({"super_admin"})

class SimplePaymentCreate(BaseModel):
    student_id: str
    amount_paid: float
    payment_method: str = "cash"
    fee_type: str = "tuition"
    academic_year: str = "2023-2024"
    status: str = "paid"

@router.get("/payments")
def list_all_payments(current_user: dict = Depends(allow_admin)):
    db = get_db()
    docs = db.collection(u'fee_payments').limit(200).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

@router.post("/payments", status_code=201)
def record_simple_payment(payload: SimplePaymentCreate, current_user: dict = Depends(allow_admin)):
    db = get_db()
    data = payload.model_dump()
    data["payment_date"] = datetime.now().isoformat()
    doc_ref = db.collection(u'fee_payments').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.post("/structure", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
def create_fee_structure(fee: FeeStructureCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = fee.model_dump()
    doc_ref = db.collection(u'fee_structures').document()
    doc_ref.set(data)
    
    return {**data, "id": doc_ref.id}

@router.get("/structure")
def get_fee_structures(current_user: dict = Depends(allow_all)):
    db = get_db()
    docs = db.collection(u'fee_structures').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

@router.post("/pay", response_model=FeePaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(payment: FeePaymentCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = payment.model_dump()
    doc_ref = db.collection(u'fee_payments').document()
    doc_ref.set(data)
    
    return {**data, "id": doc_ref.id}

@router.get("/student/{student_id}", response_model=List[FeePaymentResponse])
def get_student_payments(student_id: str, current_user: dict = Depends(allow_all)):
    role = current_user.get("role", "student")
    uid = current_user.get("uid")

    if role == "student" and student_id != uid:
        raise HTTPException(status_code=403, detail="Can only view your own fee records")
        
    db = get_db()
    docs = db.collection(u'fee_payments').where(u'student_id', u'==', student_id).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

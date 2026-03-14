from typing import Optional, List
from pydantic import BaseModel
from datetime import date

class FeeStructureBase(BaseModel):
    name: str # e.g. "Term 1 Tuition"
    amount: float
    grade: str
    due_date: str
    description: Optional[str] = None

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureResponse(FeeStructureBase):
    id: str

    class Config:
        from_attributes = True

class FeePaymentBase(BaseModel):
    student_id: str
    fee_structure_id: str
    amount_paid: float
    payment_method: str # cash, cheque, bank_transfer
    payment_date: str
    reference_number: Optional[str] = None
    remarks: Optional[str] = None

class FeePaymentCreate(FeePaymentBase):
    pass

class FeePaymentResponse(FeePaymentBase):
    id: str

    class Config:
        from_attributes = True

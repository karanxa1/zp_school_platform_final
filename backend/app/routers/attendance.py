from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "teacher", "parent", "student"})
allow_staff = RoleChecker({"super_admin", "principal", "teacher"})


class DailyAttendanceCreate(BaseModel):
    date: str
    class_name: str
    section: str
    present_count: int
    absent_count: int


@router.get("/daily")
def list_daily_attendance(current_user: dict = Depends(allow_all)):
    db = get_db()
    docs = db.collection("daily_attendance").order_by("date").limit(100).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]


@router.post("/daily", status_code=201)
def mark_daily_attendance(payload: DailyAttendanceCreate, current_user: dict = Depends(allow_staff)):
    db = get_db()
    data = payload.model_dump()
    doc_ref = db.collection("daily_attendance").document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}


@router.post("/mark", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(attendance: AttendanceCreate, current_user: dict = Depends(allow_staff)):
    db = get_db()
    data = attendance.model_dump()
    doc_id = f"{data['class_id']}_{data['section_id']}_{data['date']}"
    doc_ref = db.collection("attendance").document(doc_id)
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}


@router.get("/class/{class_id}/section/{section_id}", response_model=List[AttendanceResponse])
def get_class_attendance(class_id: str, section_id: str, date: Optional[str] = None, current_user: dict = Depends(allow_all)):
    db = get_db()
    ref = db.collection("attendance").where("class_id", "==", class_id).where("section_id", "==", section_id)
    if date:
        ref = ref.where("date", "==", date)
    docs = ref.stream()
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    results = []
    for doc in docs:
        att = {**doc.to_dict(), "id": doc.id}
        if role == "student":
            att["records"] = [r for r in att.get("records", []) if r.get("student_id") == uid]
        results.append(att)
    return results


@router.get("/student/{student_id}")
def get_student_attendance(student_id: str, current_user: dict = Depends(allow_all)):
    """Return all attendance records for a specific student across all sessions."""
    db = get_db()
    docs = db.collection("attendance").stream()
    history = []
    for doc in docs:
        att = doc.to_dict()
        for record in att.get("records", []):
            if record.get("student_id") == student_id:
                history.append({
                    "date": att.get("date"),
                    "class_id": att.get("class_id"),
                    "section_id": att.get("section_id"),
                    "status": record.get("status"),
                    "remarks": record.get("remarks", ""),
                    "doc_id": doc.id,
                })
    history.sort(key=lambda x: x.get("date", ""), reverse=True)
    return history


@router.patch("/class/{class_id}/section/{section_id}/{date}")
def update_attendance(class_id: str, section_id: str, date: str, payload: AttendanceUpdate, current_user: dict = Depends(allow_staff)):
    """Update records for an existing attendance session."""
    db = get_db()
    doc_id = f"{class_id}_{section_id}_{date}"
    doc_ref = db.collection("attendance").document(doc_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    doc_ref.update({"records": [r.model_dump() for r in payload.records]})
    updated = doc_ref.get().to_dict()
    return {**updated, "id": doc_id}

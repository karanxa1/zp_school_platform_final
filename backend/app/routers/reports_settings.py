from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from app.models.reports_settings import SchoolSettingsCreate, SchoolSettingsResponse, ReportRequest
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.seeder import seed_database

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "hod", "teacher", "parent", "student"})
allow_admin = RoleChecker({"super_admin", "principal", "hod"})
allow_super = RoleChecker({"super_admin"})

# --- Settings ---
@router.post("/settings", response_model=SchoolSettingsResponse)
def update_settings(settings: SchoolSettingsCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = settings.model_dump()
    data['updated_at'] = datetime.now().isoformat()
    
    # Using a single document for global settings
    doc_ref = db.collection(u'system_settings').document('global')
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.post("/seed")
def seed_system_data(current_user: dict = Depends(allow_super)):
    # Only super_admin should be able to run this
    try:
        uids = seed_database()
        return {"message": "Database successfully seeded with realistic mock data.", "created_uids": uids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed data: {str(e)}")

@router.get("/settings", response_model=SchoolSettingsResponse)
def get_settings(current_user: dict = Depends(allow_all)):
    db = get_db()
    doc = db.collection(u'system_settings').document('global').get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Settings not configured")
    return {**doc.to_dict(), "id": doc.id}

# --- Reports ---
@router.post("/reports/generate")
def generate_report(req: ReportRequest, current_user: dict = Depends(allow_admin)):
    # Mock data generation based on selected dates and type
    return {
        "status": "success",
        "url": f"https://storage.example.com/reports/{req.report_type}_{req.start_date}.pdf",
        "metadata": {
            "type": req.report_type,
            "span": f"{req.start_date} to {req.end_date}",
            "generated_at": datetime.now().isoformat()
        }
    }

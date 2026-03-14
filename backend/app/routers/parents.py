from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.parent import ParentCreate, ParentResponse, ParentDashboardResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_parent = RoleChecker({"parent"})
allow_staff = RoleChecker({"super_admin", "principal", "teacher"})
allow_all = RoleChecker({"super_admin", "principal", "teacher", "parent"})

@router.get("/dashboard", response_model=ParentDashboardResponse)
def get_parent_dashboard(current_user: dict = Depends(allow_parent)):
    """
    Get parent dashboard with all children's information.
    Only accessible by the parent themselves.
    """
    db = get_db()
    uid = current_user.get("uid")
    
    # Get parent document
    parent_doc = db.collection("parents").document(uid).get()
    if not parent_doc.exists:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    parent_data = parent_doc.to_dict()
    parent_data["id"] = uid
    
    # Get all children details
    children_ids = parent_data.get("children_ids", [])
    children = []
    
    for child_id in children_ids:
        student_doc = db.collection("students").document(child_id).get()
        if student_doc.exists:
            student_data = student_doc.to_dict()
            student_data["id"] = child_id
            
            # Add attendance summary
            attendance_docs = db.collection("attendance").stream()
            total_days = 0
            present_days = 0
            
            for att_doc in attendance_docs:
                att_data = att_doc.to_dict()
                for record in att_data.get("records", []):
                    if record.get("student_id") == child_id:
                        total_days += 1
                        if record.get("status") == "present":
                            present_days += 1
            
            student_data["attendance_percentage"] = round((present_days / total_days * 100), 2) if total_days > 0 else 0
            
            # Add fee status
            fee_docs = db.collection("fee_payments").where("student_id", "==", child_id).stream()
            total_paid = 0
            for fee_doc in fee_docs:
                total_paid += fee_doc.to_dict().get("amount_paid", 0)
            
            student_data["total_fees_paid"] = total_paid
            
            children.append(student_data)
    
    return {
        "parent": parent_data,
        "children": children
    }

@router.get("/children", response_model=List[dict])
def get_my_children(current_user: dict = Depends(allow_parent)):
    """
    Get list of all children linked to this parent account.
    """
    db = get_db()
    uid = current_user.get("uid")
    
    parent_doc = db.collection("parents").document(uid).get()
    if not parent_doc.exists:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    parent_data = parent_doc.to_dict()
    children_ids = parent_data.get("children_ids", [])
    
    children = []
    for child_id in children_ids:
        student_doc = db.collection("students").document(child_id).get()
        if student_doc.exists:
            student_data = student_doc.to_dict()
            student_data["id"] = child_id
            children.append(student_data)
    
    return children

@router.get("/{parent_id}", response_model=ParentResponse)
def get_parent(parent_id: str, current_user: dict = Depends(allow_all)):
    """
    Get parent details. Staff can view any parent, parents can only view themselves.
    """
    db = get_db()
    role = current_user.get("role")
    uid = current_user.get("uid")
    
    if role == "parent" and parent_id != uid:
        raise HTTPException(status_code=403, detail="Can only view your own profile")
    
    parent_doc = db.collection("parents").document(parent_id).get()
    if not parent_doc.exists:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    parent_data = parent_doc.to_dict()
    parent_data["id"] = parent_id
    
    return parent_data

@router.get("/", response_model=List[ParentResponse])
def get_all_parents(current_user: dict = Depends(allow_staff)):
    """
    Get all parents. Only accessible by staff.
    """
    db = get_db()
    docs = db.collection("parents").stream()
    
    parents = []
    for doc in docs:
        parent_data = doc.to_dict()
        parent_data["id"] = doc.id
        parents.append(parent_data)
    
    return parents

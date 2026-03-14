from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.staff import StaffCreate, StaffUpdate, StaffResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "teacher", "parent", "student"})
allow_staff = RoleChecker({"super_admin", "principal", "teacher"})
allow_admin = RoleChecker({"super_admin", "principal"})
allow_super = RoleChecker({"super_admin"})

@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(staff: StaffCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    staff_data = staff.model_dump()
    doc_ref = db.collection(u'staff').document()
    doc_ref.set(staff_data)
    return {**staff_data, "id": doc_ref.id}

@router.get("/", response_model=List[dict])
def get_all_staff(current_user: dict = Depends(allow_all)):
    db = get_db()
    role = current_user.get("role", "student")
    
    staff_ref = db.collection(u'staff')
    docs = staff_ref.stream()
    
    staff_list = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        
        # Scope the response based on the role
        if role in ["student", "parent"]:
            # Only return basic info, theoretically filtered to their class teachers only
            staff_list.append({
                "id": data["id"],
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "department": data.get("department"),
                "phone": data.get("phone"),
                "email": data.get("email"),
                "designation": data.get("designation")
            })
        elif role == "teacher":
            # Teachers see basic info of others
            staff_list.append({
                 "id": data["id"],
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "department": data.get("department"),
                "phone": data.get("phone"),
                "email": data.get("email"),
                "designation": data.get("designation")
            })
        else:
            # admins and principals see full profiles
            staff_list.append(data)
            
    return staff_list

@router.get("/{staff_id}", response_model=dict)
def get_staff(staff_id: str, current_user: dict = Depends(allow_all)):
    db = get_db()
    doc_ref = db.collection(u'staff').document(staff_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    data = doc.to_dict()
    data["id"] = doc.id
    
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    
    if role in ["student", "parent", "teacher"]:
        # Allow a teacher to see their own full profile
        if role == "teacher" and data.get("user_id") == uid:
            return data
            
        return {
            "id": data["id"],
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "department": data.get("department"),
            "phone": data.get("phone"),
            "email": data.get("email"),
            "designation": data.get("designation")
        }
    
    return data

@router.patch("/{staff_id}", response_model=StaffResponse)
def update_staff(staff_id: str, updates: StaffUpdate, current_user: dict = Depends(allow_admin)):
    # In a full app: principal can only update leave requests, admin can update anything
    db = get_db()
    doc_ref = db.collection(u'staff').document(staff_id)
    
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    doc_ref.update(update_data)
    
    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    return data

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: str, current_user: dict = Depends(allow_super)):
    db = get_db()
    doc_ref = db.collection(u'staff').document(staff_id)
    
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    doc_ref.delete()
    return None

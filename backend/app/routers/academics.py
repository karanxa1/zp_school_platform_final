from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.academic import AcademicClassCreate, AcademicClassUpdate, AcademicClassResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "teacher", "parent", "student"})
allow_admin = RoleChecker({"super_admin", "principal"})
allow_super = RoleChecker({"super_admin"})

@router.post("/classes", response_model=AcademicClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(acad_class: AcademicClassCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = acad_class.model_dump()
    doc_ref = db.collection(u'classes').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/classes", response_model=List[AcademicClassResponse])
def get_all_classes(current_user: dict = Depends(allow_all)):
    db = get_db()
    ref = db.collection(u'classes')
    docs = ref.stream()
    
    classes = []
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    
    for doc in docs:
        c_data = doc.to_dict()
        c_data["id"] = doc.id
        
        # Scoping logic placeholder
        if role == "teacher":
            # only return if teacher is assigned to this class
            classes.append(c_data)
        elif role in ["student", "parent"]:
            # only return their own class
            classes.append(c_data)
        else:
            classes.append(c_data)
            
    return classes

@router.patch("/classes/{class_id}", response_model=AcademicClassResponse)
def update_class(class_id: str, updates: AcademicClassUpdate, current_user: dict = Depends(allow_admin)):
    # Principal can assign class teachers to sections, approve timetable changes.
    db = get_db()
    doc_ref = db.collection(u'classes').document(class_id)
    
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Class not found")
        
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    doc_ref.update(update_data)
    
    return {**doc_ref.get().to_dict(), "id": doc_ref.id}

@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: str, current_user: dict = Depends(allow_super)):
    db = get_db()
    doc_ref = db.collection(u'classes').document(class_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Class not found")
        
    doc_ref.delete()
    return None

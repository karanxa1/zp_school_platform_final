from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import secrets
import string
from app.models.student import (
    StudentCreate, StudentUpdate, StudentResponse, 
    StudentCreateWithAccount, ParentLinkRequest, StudentDetailedResponse
)
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from firebase_admin import auth

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "hod", "teacher", "parent", "student"})
allow_staff = RoleChecker({"super_admin", "principal", "hod", "teacher"})
allow_admin = RoleChecker({"super_admin", "principal", "hod"})
allow_super = RoleChecker({"super_admin"})

def generate_password(length=12):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreate, current_user: dict = Depends(allow_staff)):
    db = get_db()
    student_data = student.model_dump()
    
    # Auto-assign department if creator is HOD or Teacher
    role = current_user.get("role")
    if role in ["hod", "teacher"] and not student_data.get("department"):
         staff_docs = db.collection('staff').where('email', '==', current_user.get("email")).limit(1).get()
         if staff_docs:
             dept = staff_docs[0].to_dict().get("department")
             if dept:
                 student_data["department"] = dept

    doc_ref = db.collection(u'students').document()
    doc_ref.set(student_data)
    return {**student_data, "id": doc_ref.id}

@router.post("/with-account", status_code=status.HTTP_201_CREATED)
def create_student_with_account(student: StudentCreateWithAccount, current_user: dict = Depends(allow_staff)):
    """
    Create student with Firebase account and optionally link to parent.
    Passwords can be provided by admin/teacher/principal or auto-generated.
    Returns student info, credentials, and parent info if created.
    """
    db = get_db()
    
    try:
        # Use provided password or generate one
        student_password = student.student_password if student.student_password else generate_password()
        
        # Create Firebase account for student
        student_firebase_user = auth.create_user(
            email=student.email,
            password=student_password,
            display_name=f"{student.first_name} {student.last_name}"
        )
        
        # Set custom claims for student role
        auth.set_custom_user_claims(student_firebase_user.uid, {"role": "student"})
        
        # Prepare student data
        student_data = student.model_dump(exclude={"create_firebase_account", "parent_email", "create_parent_account"})
        student_data["firebase_uid"] = student_firebase_user.uid
        student_data["created_at"] = datetime.now().isoformat()
        student_data["created_by"] = current_user.get("uid")
        
        parent_info = None
        parent_password = None
        
        # Handle parent account creation/linking
        if student.parent_email:
            try:
                # Check if parent already exists
                parent_firebase_user = auth.get_user_by_email(student.parent_email)
                parent_uid = parent_firebase_user.uid
                
                # Update parent document to add this child
                parent_doc = db.collection("parents").document(parent_uid).get()
                if parent_doc.exists:
                    parent_data = parent_doc.to_dict()
                    children_ids = parent_data.get("children_ids", [])
                    if student_firebase_user.uid not in children_ids:
                        children_ids.append(student_firebase_user.uid)
                        db.collection("parents").document(parent_uid).update({"children_ids": children_ids})
                else:
                    # Create parent document
                    db.collection("parents").document(parent_uid).set({
                        "email": student.parent_email,
                        "first_name": student.parent_name.split()[0] if student.parent_name else "Parent",
                        "last_name": " ".join(student.parent_name.split()[1:]) if len(student.parent_name.split()) > 1 else "",
                        "phone": student.parent_phone,
                        "children_ids": [student_firebase_user.uid],
                        "firebase_uid": parent_uid,
                        "created_at": datetime.now().isoformat()
                    })
                
                student_data["parent_uid"] = parent_uid
                student_data["parent_email"] = student.parent_email
                parent_info = {"email": student.parent_email, "uid": parent_uid, "already_existed": True}
                
            except auth.UserNotFoundError:
                # Parent doesn't exist, create if requested
                if student.create_parent_account:
                    # Use provided password or generate one
                    parent_password = student.parent_password if student.parent_password else generate_password()
                    parent_firebase_user = auth.create_user(
                        email=student.parent_email,
                        password=parent_password,
                        display_name=student.parent_name
                    )
                    
                    # Set custom claims for parent role
                    auth.set_custom_user_claims(parent_firebase_user.uid, {"role": "parent"})
                    
                    # Create parent document
                    db.collection("parents").document(parent_firebase_user.uid).set({
                        "email": student.parent_email,
                        "first_name": student.parent_name.split()[0] if student.parent_name else "Parent",
                        "last_name": " ".join(student.parent_name.split()[1:]) if len(student.parent_name.split()) > 1 else "",
                        "phone": student.parent_phone,
                        "children_ids": [student_firebase_user.uid],
                        "firebase_uid": parent_firebase_user.uid,
                        "created_at": datetime.now().isoformat()
                    })
                    
                    student_data["parent_uid"] = parent_firebase_user.uid
                    student_data["parent_email"] = student.parent_email
                    parent_info = {
                        "email": student.parent_email,
                        "uid": parent_firebase_user.uid,
                        "password": parent_password,
                        "password_was_generated": not bool(student.parent_password),
                        "newly_created": True
                    }
        
        # Save student to Firestore
        doc_ref = db.collection("students").document(student_firebase_user.uid)
        doc_ref.set(student_data)
        
        return {
            "success": True,
            "student": {
                **student_data,
                "id": student_firebase_user.uid,
                "email": student.email,
                "password": student_password,
                "password_was_generated": not bool(student.student_password)
            },
            "parent": parent_info,
            "message": "Student account created successfully. Please save the credentials securely."
        }
        
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail=f"Email {student.email} already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create student account: {str(e)}")

@router.get("/", response_model=List[StudentResponse])
def get_all_students(current_user: dict = Depends(allow_all)):
    db = get_db()
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    
    students_ref = db.collection(u'students')
    
    if role == "parent":
        docs = students_ref.where("parent_id", "==", uid).stream()
    elif role == "student":
        docs = students_ref.where("user_id", "==", uid).stream()
    elif role == "teacher":
        # In a real app, you'd fetch the teacher's assigned classes first, 
        # then filter students by those class_ids. For simple mockup, return all or limited.
        docs = students_ref.stream()
    elif role == "hod":
        staff_docs = db.collection('staff').where('email', '==', current_user.get("email")).limit(1).get()
        if staff_docs:
            hod_dept = staff_docs[0].to_dict().get("department")
            if hod_dept:
                docs = students_ref.where("department", "==", hod_dept).stream()
            else:
                docs = []
        else:
            docs = []
    else:
        # super_admin, principal
        docs = students_ref.stream()
    
    students = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        students.append(data)
        
    return students

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, current_user: dict = Depends(allow_all)):
    db = get_db()
    doc_ref = db.collection(u'students').document(student_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")
        
    data = doc.to_dict()
    data["id"] = doc.id
    
    # Enforce access scope
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    
    if role == "student" and data.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Unauthorized: Can only view your own profile.")
    if role == "parent" and data.get("parent_id") != uid:
        raise HTTPException(status_code=403, detail="Unauthorized: Can only view your child's profile.")
        
    return data

@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, updates: StudentUpdate, current_user: dict = Depends(allow_admin)):
    db = get_db()
    doc_ref = db.collection(u'students').document(student_id)
    
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Student not found")
        
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    doc_ref.update(update_data)
    
    updated_doc = doc_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    return data

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str, current_user: dict = Depends(allow_super)):
    db = get_db()
    doc_ref = db.collection(u'students').document(student_id)
    
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Student not found")
        
    doc_ref.delete()
    return None


@router.post("/link-parent", status_code=status.HTTP_200_OK)
def link_student_to_parent(link_request: ParentLinkRequest, current_user: dict = Depends(allow_staff)):
    """
    Link an existing student to a parent account.
    Creates parent account if requested and doesn't exist.
    """
    db = get_db()
    
    try:
        # Get student document
        student_doc = db.collection("students").document(link_request.student_id).get()
        if not student_doc.exists:
            raise HTTPException(status_code=404, detail="Student not found")
        
        student_data = student_doc.to_dict()
        
        parent_info = None
        parent_password = None
        
        try:
            # Check if parent exists
            parent_firebase_user = auth.get_user_by_email(link_request.parent_email)
            parent_uid = parent_firebase_user.uid
            
            # Update parent document
            parent_doc_ref = db.collection("parents").document(parent_uid)
            parent_doc = parent_doc_ref.get()
            
            if parent_doc.exists:
                parent_data = parent_doc.to_dict()
                children_ids = parent_data.get("children_ids", [])
                if link_request.student_id not in children_ids:
                    children_ids.append(link_request.student_id)
                    parent_doc_ref.update({"children_ids": children_ids})
            else:
                # Create parent document for existing Firebase user
                parent_doc_ref.set({
                    "email": link_request.parent_email,
                    "first_name": student_data.get("parent_name", "").split()[0] if student_data.get("parent_name") else "Parent",
                    "last_name": " ".join(student_data.get("parent_name", "").split()[1:]) if student_data.get("parent_name") else "",
                    "phone": student_data.get("parent_phone", ""),
                    "children_ids": [link_request.student_id],
                    "firebase_uid": parent_uid,
                    "created_at": datetime.now().isoformat()
                })
            
            # Update student with parent info
            db.collection("students").document(link_request.student_id).update({
                "parent_uid": parent_uid,
                "parent_email": link_request.parent_email
            })
            
            parent_info = {"email": link_request.parent_email, "uid": parent_uid, "already_existed": True}
            
        except auth.UserNotFoundError:
            if not link_request.create_parent_if_not_exists:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Parent account with email {link_request.parent_email} not found. Set create_parent_if_not_exists=true to create."
                )
            
            # Create new parent account with auto-generated password
            parent_password = generate_password()
            parent_firebase_user = auth.create_user(
                email=link_request.parent_email,
                password=parent_password,
                display_name=student_data.get("parent_name", "Parent")
            )
            
            # Set custom claims
            auth.set_custom_user_claims(parent_firebase_user.uid, {"role": "parent"})
            
            # Create parent document
            db.collection("parents").document(parent_firebase_user.uid).set({
                "email": link_request.parent_email,
                "first_name": student_data.get("parent_name", "").split()[0] if student_data.get("parent_name") else "Parent",
                "last_name": " ".join(student_data.get("parent_name", "").split()[1:]) if student_data.get("parent_name") else "",
                "phone": student_data.get("parent_phone", ""),
                "children_ids": [link_request.student_id],
                "firebase_uid": parent_firebase_user.uid,
                "created_at": datetime.now().isoformat()
            })
            
            # Update student
            db.collection("students").document(link_request.student_id).update({
                "parent_uid": parent_firebase_user.uid,
                "parent_email": link_request.parent_email
            })
            
            parent_info = {
                "email": link_request.parent_email,
                "uid": parent_firebase_user.uid,
                "password": parent_password,
                "newly_created": True
            }
        
        return {
            "success": True,
            "message": "Student linked to parent successfully",
            "student_id": link_request.student_id,
            "parent": parent_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to link student to parent: {str(e)}")

@router.get("/{student_id}/detailed", response_model=StudentDetailedResponse)
def get_student_detailed(student_id: str, current_user: dict = Depends(allow_all)):
    """
    Get detailed student information including attendance, fees, exams, homework.
    Accessible by parents, teachers, admins, and the student themselves.
    """
    db = get_db()
    
    # Get student document
    student_doc = db.collection("students").document(student_id).get()
    if not student_doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student_data = student_doc.to_dict()
    student_data["id"] = student_id
    
    # Enforce access control
    role = current_user.get("role", "student")
    uid = current_user.get("uid")
    
    if role == "student" and student_data.get("firebase_uid") != uid:
        raise HTTPException(status_code=403, detail="Can only view your own profile")
    if role == "parent" and student_data.get("parent_uid") != uid:
        raise HTTPException(status_code=403, detail="Can only view your child's profile")
    
    # Fetch attendance summary
    attendance_docs = db.collection("attendance").stream()
    total_days = 0
    present_days = 0
    
    for att_doc in attendance_docs:
        att_data = att_doc.to_dict()
        for record in att_data.get("records", []):
            if record.get("student_id") == student_id:
                total_days += 1
                if record.get("status") == "present":
                    present_days += 1
    
    attendance_percentage = round((present_days / total_days * 100), 2) if total_days > 0 else 0
    
    # Fetch fee summary
    fee_docs = db.collection("fee_payments").where("student_id", "==", student_id).stream()
    total_paid = 0
    payment_count = 0
    
    for fee_doc in fee_docs:
        fee_data = fee_doc.to_dict()
        total_paid += fee_data.get("amount_paid", 0)
        payment_count += 1
    
    # Fetch recent exam results
    exam_results = []
    result_docs = db.collection("exam_results").where("student_id", "==", student_id).limit(5).stream()
    
    for result_doc in result_docs:
        result_data = result_doc.to_dict()
        # Get exam details
        exam_doc = db.collection("exams").document(result_data.get("exam_id", "")).get()
        if exam_doc.exists:
            exam_data = exam_doc.to_dict()
            exam_results.append({
                "exam_name": exam_data.get("name"),
                "grade": result_data.get("grade"),
                "total_marks": result_data.get("total_marks"),
                "subject_marks": result_data.get("subject_marks", {}),
                "remarks": result_data.get("remarks", "")
            })
    
    # Fetch pending homework
    homework_pending = []
    hw_docs = db.collection("homework").where("class_id", "==", student_data.get("grade")).limit(10).stream()
    
    for hw_doc in hw_docs:
        hw_data = hw_doc.to_dict()
        # Check if submitted
        submission_doc = db.collection("homework_submissions").document(f"{hw_doc.id}_{student_id}").get()
        if not submission_doc.exists:
            homework_pending.append({
                "id": hw_doc.id,
                "title": hw_data.get("title"),
                "subject": hw_data.get("subject"),
                "due_date": hw_data.get("due_date"),
                "description": hw_data.get("description", "")
            })
    
    return {
        **student_data,
        "attendance_summary": {
            "total_days": total_days,
            "present_days": present_days,
            "absent_days": total_days - present_days,
            "percentage": attendance_percentage
        },
        "fee_summary": {
            "total_paid": total_paid,
            "payment_count": payment_count
        },
        "recent_exams": exam_results,
        "homework_pending": homework_pending
    }

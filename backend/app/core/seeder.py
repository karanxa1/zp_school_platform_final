import firebase_admin
from firebase_admin import auth, firestore
from app.core.logger import logger
import random
from datetime import datetime, timedelta

def create_or_update_user(email, password, display_name, role):
    """
    Creates a user in Firebase Auth if not exists, and sets the custom claim for rule.
    Returns the user record.
    """
    try:
        user = auth.get_user_by_email(email)
        logger.info(f"User {email} already exists.")
        # Update password just in case
        auth.update_user(user.uid, password=password, display_name=display_name)
    except auth.UserNotFoundError:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
        )
        logger.info(f"Created new user: {email}")
        
    # Set the custom claim for RBAC
    auth.set_custom_user_claims(user.uid, {'role': role})
    logger.info(f"Set role '{role}' for user {email}")
    return user

def seed_database():
    """
    Seeds the database with users of all roles and sample functional data.
    """
    db = firestore.client()
    
    # --- 1. Seed Auth Users ---
    roles = [
        {"email": "superadmin@school.edu", "name": "System Admin", "role": "super_admin"},
        {"email": "principal@school.edu", "name": "Principal Skinner", "role": "principal"},
        {"email": "teacher@school.edu", "name": "Mr. Roberts", "role": "teacher"},
        {"email": "parent@school.edu", "name": "Jane Parent", "role": "parent"},
        {"email": "student@school.edu", "name": "Timmy Student", "role": "student"},
    ]
    
    users_ref = db.collection('users')
    uids = {}
    
    for r in roles:
        user_record = create_or_update_user(r["email"], "password123", r["name"], r["role"])
        uids[r["role"]] = user_record.uid
        
        # Save exact mirror in firestore 'users' collection
        users_ref.document(user_record.uid).set({
            "uid": user_record.uid,
            "email": r["email"],
            "name": r["name"],
            "role": r["role"],
            "created_at": datetime.now().isoformat()
        })

    # --- 2. Seed Staff (Principal & Teacher) ---
    staff_ref = db.collection('staff')
    staff_ref.document(uids["principal"]).set({
        "id": uids["principal"],
        "user_id": uids["principal"],
        "first_name": "Principal",
        "last_name": "Skinner",
        "email": "principal@school.edu",
        "phone": "+1234567891",
        "role": "principal",
        "department": "Administration",
        "designation": "Principal",
        "joining_date": "2020-01-15",
        "salary": 100000.0,
        "address": "123 Principal St",
        "status": "Active"
    })
    
    staff_ref.document(uids["teacher"]).set({
        "id": uids["teacher"],
        "user_id": uids["teacher"],
        "first_name": "John",
        "last_name": "Roberts",
        "email": "teacher@school.edu",
        "phone": "+1234567892",
        "role": "teacher",
        "department": "Science",
        "designation": "Senior Teacher",
        "joining_date": "2021-06-01",
        "salary": 50000.0,
        "address": "456 Teacher Ave",
        "status": "Active"
    })

    # --- 3. Seed Students ---
    students_ref = db.collection('students')
    students_ref.document(uids["student"]).set({
        "id": uids["student"],
        "user_id": uids["student"],
        "first_name": "Timmy",
        "last_name": "Student",
        "email": "student@school.edu",
        "admission_number": "ADM-2023-001",
        "roll_number": "10",
        "grade": "10",
        "section": "A",
        "gender": "Male",
        "dob": "2008-05-15",
        "address": "123 School Rd",
        "parent_id": uids["parent"],
        "parent_name": "Jane Parent",
        "parent_phone": "+1234567890",
        "status": "Active"
    })
    
    # --- 4. Seed Attendance (Today) ---
    today = datetime.now().strftime("%Y-%m-%d")
    att_ref = db.collection('attendance')
    att_ref.document(f"{uids['student']}_{today}").set({
        "student_id": uids["student"],
        "grade": "10",
        "section": "A",
        "date": today,
        "status": "Present",
        "marked_by": uids["teacher"],
        "remarks": "On time"
    })

    # --- 5. Seed Academics (Classes & Subjects) ---
    classes_ref = db.collection('classes')
    class_id = "class_10_A"
    classes_ref.document(class_id).set({
        "id": class_id,
        "name": "Class 10 A",
        "grade": "10",
        "section": "A",
        "sections": ["A", "B", "C"],
        "subjects": ["Science", "Math", "English"],
        "class_teacher_id": uids["teacher"],
        "room_number": "101",
        "capacity": 30
    })
    
    subjects_ref = db.collection('subjects')
    subjects_ref.document("sub_sci_10").set({
        "id": "sub_sci_10",
        "name": "Science",
        "code": "SCI-10",
        "grade": "10",
        "description": "General Science for Grade 10"
    })

    # --- 6. Seed Homework ---
    hw_ref = db.collection('homework')
    hw_ref.document("hw_1").set({
        "id": "hw_1",
        "title": "Photosynthesis Lab Report",
        "description": "Complete the lab report on the photosynthesis experiment we did today.",
        "class_id": "class_10_A",
        "section_id": "A",
        "subject": "Science",
        "teacher_id": uids["teacher"],
        "created_at": today,
        "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
        "status": "Active"
    })

    # --- 8. Seed Exams ---
    exam_ref = db.collection('exams')
    exam_ref.document("exam_midterm_10").set({
        "id": "exam_midterm_10",
        "name": "Midterm Examination",
        "term": "Term 1",
        "description": "First term midterm exams for Grade 10",
        "class_id": "class_10_A",
        "section_id": "A",
        "start_date": (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=25)).strftime("%Y-%m-%d"),
        "status": "Scheduled"
    })

    # --- 9. Seed Exam Results ---
    result_ref = db.collection('exam_results')
    result_ref.document(f"exam_midterm_10_{uids['student']}").set({
        "exam_id": "exam_midterm_10",
        "student_id": uids["student"],
        "marks_obtained": 85.5,
        "total_marks": 100.0,
        "grade": "A",
        "remarks": "Excellent performance",
        "recorded_by": uids["teacher"]
    })

    # --- 10. Seed Library Books ---
    lib_ref = db.collection('library_books')
    lib_ref.document("book_sci_1").set({
        "id": "book_sci_1",
        "title": "Advanced Physics",
        "author": "Dr. Smith",
        "isbn": "978-3-16-148410-0",
        "category": "Science",
        "total_copies": 5,
        "available_copies": 4
    })

    # --- 11. Seed Transport Routes ---
    trans_ref = db.collection('transport_routes')
    trans_ref.document("route_north_1").set({
        "id": "route_north_1",
        "route_name": "North City Loop",
        "vehicle_number": "MH-12-AB-1234",
        "driver_name": "Raju",
        "driver_phone": "+1987654321",
        "stops": ["North Square", "Main Avenue", "School Campus"]
    })

    # --- 12. Seed Hostel Rooms ---
    hostel_ref = db.collection('hostel_rooms')
    hostel_ref.document("room_A101").set({
        "id": "room_A101",
        "room_number": "A101",
        "building": "Block A",
        "capacity": 2,
        "occupancy": 1,
        "status": "Available"
    })

    # --- 13. Seed Inventory ---
    inv_ref = db.collection('inventory_items')
    inv_ref.document("inv_chalk_1").set({
        "id": "inv_chalk_1",
        "item_name": "White Chalk Box",
        "category": "Stationery",
        "quantity": 50,
        "unit": "box",
        "reorder_level": 10
    })

    # --- 14. Seed Notices ---
    notice_ref = db.collection('notices')
    notice_ref.document("notice_holiday_1").set({
        "id": "notice_holiday_1",
        "title": "Upcoming Public Holiday",
        "content": "The school will remain closed this Friday due to the national holiday.",
        "target_audience": "all",
        "author_id": uids["principal"],
        "created_at": datetime.now().isoformat()
    })

    # --- 15. Seed Complaints ---
    comp_ref = db.collection('complaints')
    comp_ref.document("comp_wifi_1").set({
        "id": "comp_wifi_1",
        "title": "WiFi Connectivity Issue in Lab",
        "description": "The internet connection in the computer lab is highly unstable.",
        "category": "Infrastructure",
        "is_anonymous": False,
        "submitter_id": uids["teacher"],
        "status": "open",
        "created_at": datetime.now().isoformat()
    })

    # --- 16. Seed System Settings ---
    set_ref = db.collection('system_settings')
    set_ref.document("global").set({
        "school_name": "ZP Digital School",
        "school_address": "123 Education Lane",
        "contact_email": "admin@zpschool.edu",
        "contact_phone": "+18001234567",
        "academic_year": "2023-2024",
        "currency": "INR",
        "grading_system": "Percentage",
        "features_toggled": {
            "transport": True,
            "hostel": True,
            "library": True
        },
        "updated_at": datetime.now().isoformat()
    })

    logger.info("Database seeding complete!")
    return uids

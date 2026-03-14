import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.firebase import init_firebase
from firebase_admin import firestore
from datetime import datetime, timedelta

init_firebase()
db = firestore.client()

def seed_data():
    print("Seeding students...")
    students = [
        {"first_name": "Aarav", "last_name": "Patil", "roll_number": "R01", "grade": "10th", "section": "A", "email": "aarav.p@zpschool.edu.in", "enrollment_date": "2023-06-15", "status": "active", "parent_id": None},
        {"first_name": "Diya", "last_name": "Sharma", "roll_number": "R02", "grade": "10th", "section": "A", "email": "diya.s@zpschool.edu.in", "enrollment_date": "2023-06-16", "status": "active", "parent_id": None},
        {"first_name": "Arjun", "last_name": "Deshmukh", "roll_number": "R03", "grade": "10th", "section": "B", "email": "arjun.d@zpschool.edu.in", "enrollment_date": "2023-06-15", "status": "active", "parent_id": None},
        {"first_name": "Rohan", "last_name": "Kale", "roll_number": "R04", "grade": "9th", "section": "A", "email": "rohan.k@zpschool.edu.in", "enrollment_date": "2024-06-10", "status": "active", "parent_id": None},
        {"first_name": "Sneha", "last_name": "Joshi", "roll_number": "R05", "grade": "9th", "section": "A", "email": "sneha.j@zpschool.edu.in", "enrollment_date": "2024-06-12", "status": "active", "parent_id": None}
    ]
    for s in students:
        db.collection("students").add(s)

    print("Seeding academic classes...")
    classes = [
        {"name": "Class 10", "sections": ["A", "B", "C"], "subjects": ["Mathematics", "Science", "English", "History", "Marathi"], "class_teacher_id": None},
        {"name": "Class 9", "sections": ["A", "B"], "subjects": ["Mathematics", "Science", "English", "Geography", "Marathi"], "class_teacher_id": None},
        {"name": "Class 8", "sections": ["A", "B", "C"], "subjects": ["Mathematics", "General Science", "English", "Social Studies"], "class_teacher_id": None}
    ]
    for c in classes:
        db.collection("classes").add(c)

    print("Seeding staff...")
    staff = [
        {"first_name": "Ramesh", "last_name": "Bhosale", "employee_id": "EMP101", "role": "teacher", "department": "Science", "email": "ramesh.b@zpschool.edu.in", "phone_number": "9876543210", "status": "active"},
        {"first_name": "Anita", "last_name": "Gore", "employee_id": "EMP102", "role": "teacher", "department": "Mathematics", "email": "anita.g@zpschool.edu.in", "phone_number": "9876543211", "status": "active"},
        {"first_name": "Suresh", "last_name": "Jadhav", "employee_id": "EMP103", "role": "staff", "department": "Administration", "email": "suresh.j@zpschool.edu.in", "phone_number": "9876543212", "status": "active"},
        {"first_name": "Vikram", "last_name": "Pawar", "employee_id": "EMP104", "role": "principal", "department": "Management", "email": "principal@zpschool.edu.in", "phone_number": "9876543213", "status": "active"}
    ]
    for st in staff:
        db.collection("staff").add(st)
        
    print("Seeding attendance...")
    attendance = [
        {"date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "class_name": "Class 10", "section": "A", "present_count": 45, "absent_count": 5, "recorded_by": "EMP101", "created_at": datetime.now().isoformat()},
        {"date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "class_name": "Class 9", "section": "A", "present_count": 40, "absent_count": 2, "recorded_by": "EMP102", "created_at": datetime.now().isoformat()},
        {"date": datetime.now().strftime("%Y-%m-%d"), "class_name": "Class 10", "section": "A", "present_count": 48, "absent_count": 2, "recorded_by": "EMP101", "created_at": datetime.now().isoformat()}
    ]
    for a in attendance:
        db.collection("attendance_daily").add(a)

    print("Seeding communications (notices)...")
    notices = [
        {"title": "Diwali Vacation Schedule", "content": "The school will remain closed from 20th Oct to 5th Nov for Diwali holidays.", "target_audience": "all", "author_id": "EMP104", "created_at": datetime.now().isoformat()},
        {"title": "Science Exhibition 2024", "content": "All students are encouraged to participate in the upcoming Science Exhibition. Please register your names with your class teachers.", "target_audience": "student", "author_id": "EMP101", "created_at": datetime.now().isoformat()},
        {"title": "Staff Meeting", "content": "Mandatory staff meeting on Friday at 4 PM in the principal's office.", "target_audience": "teacher", "author_id": "EMP104", "created_at": datetime.now().isoformat()}
    ]
    for n in notices:
        db.collection("notices").add(n)
        
    print("Seeding complaints...")
    complaints = [
        {"subject": "Broken Fan in Lab 2", "description": "The middle fan in Computer Lab 2 is making a loud noise and needs repair.", "category": "facilities", "status": "open", "submitter_id": "EMP101", "is_anonymous": False, "created_at": datetime.now().isoformat(), "resolution_notes": None, "resolved_at": None},
        {"subject": "Water Cooler Maintenance", "description": "The water cooler on the 2nd floor has stopped cooling.", "category": "facilities", "status": "in_progress", "submitter_id": "EMP102", "is_anonymous": False, "created_at": datetime.now().isoformat(), "resolution_notes": None, "resolved_at": None},
        {"subject": "Library Book Shortage", "description": "We need more copies of the 10th-grade Science reference books.", "category": "academic", "status": "open", "submitter_id": "EMP101", "is_anonymous": False, "created_at": datetime.now().isoformat(), "resolution_notes": None, "resolved_at": None}
    ]
    for c in complaints:
        db.collection("complaints").add(c)
        
    print("Seeding exams...")
    exams = [
        {"title": "Mid-Term Examination 2024", "type": "term", "academic_year": "2023-2024", "classes": ["Class 8", "Class 9", "Class 10"], "start_date": "2024-10-10", "end_date": "2024-10-25", "status": "scheduled", "created_by": "EMP104", "created_at": datetime.now().isoformat()},
        {"title": "Unit Test 1 - Mathematics", "type": "unit", "academic_year": "2023-2024", "classes": ["Class 10"], "start_date": "2024-08-15", "end_date": "2024-08-15", "status": "completed", "created_by": "EMP102", "created_at": datetime.now().isoformat()},
        {"title": "Preliminary Board Exams", "type": "prelim", "academic_year": "2023-2024", "classes": ["Class 10"], "start_date": "2024-01-10", "end_date": "2024-01-20", "status": "draft", "created_by": "EMP104", "created_at": datetime.now().isoformat()}
    ]
    for e in exams:
        db.collection("exams").add(e)
        
    print("Seeding homework...")
    homework = [
        {"title": "Solve Algebra Worksheet 3", "description": "Complete all sums from chapter 5.", "class_name": "Class 10", "section": "A", "subject": "Mathematics", "due_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"), "teacher_id": "EMP102", "status": "active", "created_at": datetime.now().isoformat()},
        {"title": "Read Chapter 4, Science", "description": "Read the chapter on Chemical Reactions and answer the exercise questions.", "class_name": "Class 10", "section": "A", "subject": "Science", "due_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"), "teacher_id": "EMP101", "status": "active", "created_at": datetime.now().isoformat()},
        {"title": "Write an essay on Independence Day", "description": "Minimum 500 words on the importance of Independence Day.", "class_name": "Class 9", "section": "A", "subject": "English", "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"), "teacher_id": "EMP103", "status": "active", "created_at": datetime.now().isoformat()}
    ]
    for h in homework:
        db.collection("homework").add(h)

    print("Data seeded successfully!")

if __name__ == "__main__":
    seed_data()

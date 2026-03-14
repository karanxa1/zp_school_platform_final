# ZP School Platform

This is the ZP School Platform project, consisting of a React frontend and a FastAPI backend.

## Backend Endpoints

The backend exposes the following API endpoints under `http://localhost:8000/api/v1/`:

### Other
- **`GET /`** - Root

### Academics
- **`GET /api/v1/academics/classes`** - Get All Classes
- **`POST /api/v1/academics/classes`** - Create Class
- **`PATCH /api/v1/academics/classes/{class_id}`** - Update Class
- **`DELETE /api/v1/academics/classes/{class_id}`** - Delete Class

### Attendance
- **`GET /api/v1/attendance/daily`** - List Daily Attendance
- **`POST /api/v1/attendance/daily`** - Mark Daily Attendance
- **`POST /api/v1/attendance/mark`** - Mark Attendance
- **`GET /api/v1/attendance/class/{class_id}/section/{section_id}`** - Get Class Attendance

### Auth
- **`POST /api/v1/auth/verify-token`** - Verify Firebase Token
- **`GET /api/v1/auth/me`** - Get Me

### Communication
- **`POST /api/v1/communication/notices`** - Create Notice
- **`GET /api/v1/communication/notices`** - Get Notices
- **`GET /api/v1/communication/complaints`** - Get Complaints
- **`POST /api/v1/communication/complaints`** - Submit Complaint

### Exams
- **`GET /api/v1/exams/`** - Get All Exams
- **`POST /api/v1/exams/`** - Create Exam
- **`POST /api/v1/exams/results`** - Upload Result
- **`GET /api/v1/exams/results/student/{student_id}`** - Get Student Results

### Fees
- **`GET /api/v1/fees/payments`** - List All Payments
- **`POST /api/v1/fees/payments`** - Record Simple Payment
- **`GET /api/v1/fees/structure`** - Get Fee Structures
- **`POST /api/v1/fees/structure`** - Create Fee Structure
- **`POST /api/v1/fees/pay`** - Record Payment
- **`GET /api/v1/fees/student/{student_id}`** - Get Student Payments

### Homework
- **`POST /api/v1/homework/`** - Assign Homework
- **`GET /api/v1/homework/class/{class_id}/section/{section_id}`** - Get Class Homework
- **`POST /api/v1/homework/submit`** - Submit Homework

### Logistics
- **`GET /api/v1/logistics/library/books`** - Get Books
- **`POST /api/v1/logistics/library/books`** - Add Book
- **`GET /api/v1/logistics/transport/routes`** - Get Routes
- **`POST /api/v1/logistics/transport/routes`** - Add Route
- **`GET /api/v1/logistics/hostel/rooms`** - Get Rooms
- **`POST /api/v1/logistics/hostel/rooms`** - Add Room
- **`GET /api/v1/logistics/inventory/items`** - Get Items
- **`POST /api/v1/logistics/inventory/items`** - Add Item

### Reports_settings
- **`GET /api/v1/system/settings`** - Get Settings
- **`POST /api/v1/system/settings`** - Update Settings
- **`POST /api/v1/system/seed`** - Seed System Data
- **`POST /api/v1/system/reports/generate`** - Generate Report

### Staff
- **`GET /api/v1/staff/`** - Get All Staff
- **`POST /api/v1/staff/`** - Create Staff
- **`GET /api/v1/staff/{staff_id}`** - Get Staff
- **`PATCH /api/v1/staff/{staff_id}`** - Update Staff
- **`DELETE /api/v1/staff/{staff_id}`** - Delete Staff

### Students
- **`GET /api/v1/students/`** - Get All Students
- **`POST /api/v1/students/`** - Create Student
- **`GET /api/v1/students/{student_id}`** - Get Student
- **`PATCH /api/v1/students/{student_id}`** - Update Student
- **`DELETE /api/v1/students/{student_id}`** - Delete Student


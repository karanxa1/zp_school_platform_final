# ZP School Platform: Comprehensive Hierarchy & Permissions

This document defines the absolute source of truth for all roles, permissions, and data access policies within the ZP School Platform.

---

## 1. Core Role Definitions

| Role | Designation | Primary Responsibility |
| :--- | :--- | :--- |
| **Super Admin** | Platform Owner | Global system configuration, seeding, and management of Principals. |
| **Principal** | School Head | Operational oversight, HOD management, and high-level academic approvals. |
| **HOD** | Dept. Head | Management of specific departments (e.g., Science, Arts) and their teachers. |
| **Teacher** | Class Educator | Student management, homework, attendance, and result entry. |
| **Student** | Learner | Accessing educational materials, viewing results, and submitting homework. |
| **Parent** | Guardian | Monitoring child performance, attendance, and fee status. |

---

## 2. Account Management Hierarchy (Creation & Management)

A user can only create/manage accounts for roles **lower** than their own in the hierarchy.

| Creator Role | Allowed to Create/Manage | Scope Enforcement |
| :--- | :--- | :--- |
| **Super Admin** | Principal, HOD, Teacher, Staff | Global |
| **Principal** | HOD, Teacher, Teaching/Non-Teaching Staff | Global |
| **HOD** | Teacher, Staff | Restricted to creator's **Department** |
| **Teacher** | Student | Restricted to creator's **Department** |

### Logic Enforcement:
- **Backend**: `staff.py` validates `role_hierarchy` mapping. HODs are automatically assigned their own department to any user they create.
- **Frontend**: `StaffList.tsx` filters selectable roles in the "Add Staff" dialog and hides the "Edit" button for protected roles.

---

## 3. Module-Specific Permission Matrix

### A. Staff & Personnel
- **Create Staff**: Super Admin, Principal, HOD (Dept scoped).
- **Edit Staff**: Creator or higher role.
- **View All Staff**: Principals and Admins.
- **Implementation**: `backend/app/routers/staff.py`

### B. Students & Accounts
- **Basic Registration**: Super Admin, Principal, HOD, Teacher.
- **Account Creation (Login)**: Super Admin, Principal, HOD, Teacher.
- **Link Student to Parent**: Principal, HOD.
- **View All Students**: All Staff.
- **Implementation**: `backend/app/routers/students.py`

### C. Academics (Classes, Sections, Subjects)
- **Create Class/Section**: Super Admin, Principal, HOD, Teacher.
- **Assign Teacher to Class**: Principal, HOD.
- **Manage Subjects**: Super Admin, Principal, HOD, Teacher.
- **Implementation**: `backend/app/routers/academics.py`

### D. Attendance
- **Mark Attendance**: Teachers, HODs, Principals.
- **View Attendance (Daily)**: All Staff.
- **View Attendance (Individual)**: Student/Parent (Own records only).
- **Implementation**: `backend/app/routers/attendance.py`

### E. Finance & Fees
- **Set Fee Structure**: Super Admin Only.
- **Record Payment**: Super Admin, Principal, HOD.
- **View All Payments**: Super Admin, Principal, HOD.
- **View Individual Fees**: Student/Parent (Own records only).
- **Implementation**: `backend/app/routers/fees.py`

### F. Exams & Results
- **Create Exams**: Principal, HOD.
- **Upload Results**: Teacher (Class scoped), HOD, Principal.
- **View Results**: Student/Parent (Own records), All Staff.
- **Implementation**: `backend/app/routers/exams.py`

### G. Homework
- **Assign Homework**: Teacher, HOD.
- **Submit Homework**: Student.
- **Grade Submission**: Teacher.
- **Implementation**: `backend/app/routers/homework.py`

### I. Logistics (Library, Hostel, Transport)
- **Library Admin**: Super Admin (Add books), Staff (Manage inventory).
- **Transport Admin**: Super Admin (Add routes).
- **Hostel Admin**: Super Admin (Add rooms), Staff (View rooms).
- **Inventory Management**: Principal, HOD, Super Admin.
- **Implementation**: `backend/app/routers/logistics.py`

### J. Communication & Notices
- **Global Notices**: Super Admin, Principal.
- **Department Notices**: HOD.
- **Submit Complaints**: All Roles (Anonymous option available).
- **View Complaints**: Super Admin, Principal, HOD.
- **Implementation**: `backend/app/routers/communication.py`

### K. System Settings
- **Modify School Info**: Super Admin Only.
- **System Seeding**: Super Admin Only.
- **Generate Reports**: Super Admin, Principal, HOD.
- **Implementation**: `backend/app/routers/reports_settings.py`

---

## 4. Data Scoping & Isolation Policies

- **Global Scope**: Super Admin and Principal see all data across all departments.
- **Department Scope**: HODs and Teachers are restricted to data relevant to their assigned department (enforced in `academics.py`, `students.py`).
- **Class Scope**: Teachers are primary managers of their assigned classes/sections.
- **Individual Scope**: Students and Parents can **never** see data belonging to other students/families.

---

## 5. Security & Authentication
- All endpoints are protected via **Firebase Auth Tokens**.
- `RoleChecker` dependency in the backend kills unauthorized requests at the FastAPI layer.
- Frontend routes are guarded; however, the backend serves as the primary enforcement point.
- **Admin Flag**: The `is_admin` custom claim is reserved for roles: `super_admin`, `principal`, `hod`.

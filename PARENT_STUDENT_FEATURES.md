# Parent-Student Account Management System

## Overview

This document describes the comprehensive parent-student linking system that allows administrators, principals, and teachers to create student accounts with Firebase authentication and link them to parent accounts for portal access.

## Features Implemented

### 1. Student Account Creation with Authentication

**Endpoint**: `POST /api/v1/students/with-account`

**Access**: Super Admin, Principal, Teacher

**Features**:
- Create student with Firebase authentication account
- Set custom password or auto-generate secure password
- Automatically link to parent account (existing or new)
- Create parent account with portal access if needed
- Returns credentials for both student and parent

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@student.school.com",
  "student_password": "optional_custom_password",
  "admission_number": "2024001",
  "grade": "10",
  "section": "A",
  "roll_number": 15,
  "dob": "2010-05-15",
  "gender": "Male",
  "address": "123 Main St",
  "parent_name": "Jane Doe",
  "parent_phone": "+1234567890",
  "parent_email": "jane.doe@parent.com",
  "parent_password": "optional_parent_password",
  "create_parent_account": true,
  "blood_group": "O+"
}
```

**Response**:
```json
{
  "success": true,
  "student": {
    "id": "firebase_uid_123",
    "email": "john.doe@student.school.com",
    "password": "generated_or_custom_password",
    "password_was_generated": false,
    "first_name": "John",
    "last_name": "Doe"
  },
  "parent": {
    "email": "jane.doe@parent.com",
    "uid": "parent_firebase_uid",
    "password": "parent_password",
    "password_was_generated": true,
    "newly_created": true
  },
  "message": "Student account created successfully. Please save the credentials securely."
}
```

### 2. Link Existing Student to Parent

**Endpoint**: `POST /api/v1/students/link-parent`

**Access**: Super Admin, Principal, Teacher

**Features**:
- Link existing student to parent account
- Create parent account if doesn't exist
- Support multiple children per parent

**Request Body**:
```json
{
  "student_id": "student_firebase_uid",
  "parent_email": "parent@email.com",
  "create_parent_if_not_exists": true
}
```

### 3. Student Detailed Information

**Endpoint**: `GET /api/v1/students/{student_id}/detailed`

**Access**: Parent (own children), Teacher, Admin, Student (self)

**Returns**:
- Complete student profile
- Attendance summary (total days, present, absent, percentage)
- Fee summary (total paid, payment count)
- Recent exam results (last 5 exams with grades)
- Pending homework assignments

**Response Example**:
```json
{
  "id": "student_id",
  "first_name": "John",
  "last_name": "Doe",
  "grade": "10",
  "section": "A",
  "attendance_summary": {
    "total_days": 180,
    "present_days": 165,
    "absent_days": 15,
    "percentage": 91.67
  },
  "fee_summary": {
    "total_paid": 50000,
    "payment_count": 3
  },
  "recent_exams": [
    {
      "exam_name": "Mid-Term 2024",
      "grade": "A",
      "total_marks": 450,
      "subject_marks": {
        "Math": 95,
        "Science": 90
      }
    }
  ],
  "homework_pending": [
    {
      "id": "hw_123",
      "title": "Math Assignment",
      "subject": "Mathematics",
      "due_date": "2024-03-20"
    }
  ]
}
```

### 4. Parent Dashboard

**Endpoint**: `GET /api/v1/parents/dashboard`

**Access**: Parent (own account only)

**Features**:
- View all linked children
- See attendance percentage for each child
- View total fees paid per child
- Quick access to detailed information

**Frontend Page**: `/parent-dashboard`

### 5. Parent Children List

**Endpoint**: `GET /api/v1/parents/children`

**Access**: Parent (own account only)

**Returns**: List of all children linked to parent account

### 6. User Profile Pages

**Frontend Page**: `/profile`

**Access**: All authenticated users

**Features by Role**:

#### Super Admin Profile
- Full system access overview
- 13 accessible features displayed
- User management capabilities
- System settings access
- All reports generation

#### Principal Profile
- Administrative oversight features
- 10 accessible features
- Student/staff management
- Academic oversight
- Reports generation

#### Teacher Profile
- Classroom management features
- 8 accessible features
- Student viewing
- Attendance marking
- Homework and exam management

#### Parent Profile
- Children's information access
- 8 accessible features
- Attendance tracking
- Fee information
- Exam results viewing
- Homework status

#### Student Profile
- Personal academic information
- 8 accessible features
- Own attendance records
- Fee status
- Exam results
- Homework assignments

### 7. Create Student Account Page

**Frontend Page**: `/students/create-account`

**Access**: Super Admin, Principal, Teacher

**Features**:
- Comprehensive form for student information
- Optional custom password fields for student and parent
- Auto-generate secure passwords if not provided
- Checkbox to create parent account if doesn't exist
- Success screen showing credentials
- Warning to save credentials securely

**Form Fields**:
- Student Information: Name, Email, Password, Admission Number, Roll Number, Grade, Section, DOB, Gender, Blood Group, Address
- Parent Information: Name, Phone, Email, Password, Create Account Option

## Password Management

### Password Creation Options

1. **Custom Password**: Admin/Teacher/Principal can set specific passwords
2. **Auto-Generated**: System generates secure 12-character passwords with letters, numbers, and special characters

### Password Requirements
- Minimum 6 characters (Firebase requirement)
- Auto-generated passwords: 12 characters with mixed case, numbers, and special characters (!@#$%)

### Security Features
- Passwords displayed only once during creation
- Warning message to save credentials securely
- Indication whether password was auto-generated or custom

## User Roles and Permissions

### Super Admin
- Create student accounts with authentication
- Create parent accounts
- Link students to parents
- View all student detailed information
- Access all system features

### Principal
- Create student accounts with authentication
- Create parent accounts
- Link students to parents
- View all student detailed information
- Manage academic operations

### Teacher
- Create student accounts with authentication
- Link students to parents (if parent exists)
- View student information
- Mark attendance
- Assign homework and enter grades

### Parent
- View own profile
- Access parent dashboard
- View all linked children
- See detailed information for each child
- Track attendance, fees, exams, homework

### Student
- View own profile
- Access personal academic information
- View attendance records
- Check fee status
- See exam results
- View and submit homework

## Navigation Updates

### Sidebar Navigation
- My Profile (all users)
- Parent Dashboard (parents only)
- Students (teachers and above)
- Create Student Account (teachers and above)
- All other existing modules

### Navbar
- User avatar with role display
- Click to navigate to profile
- Notification bell
- Mobile menu toggle

## Database Structure

### Students Collection
```javascript
{
  id: "firebase_uid",
  first_name: "string",
  last_name: "string",
  email: "string",
  firebase_uid: "string",
  parent_uid: "string",
  parent_email: "string",
  admission_number: "string",
  grade: "string",
  section: "string",
  roll_number: number,
  dob: "string",
  gender: "string",
  address: "string",
  parent_name: "string",
  parent_phone: "string",
  blood_group: "string",
  created_at: "ISO timestamp",
  created_by: "creator_uid"
}
```

### Parents Collection
```javascript
{
  id: "firebase_uid",
  firebase_uid: "string",
  email: "string",
  first_name: "string",
  last_name: "string",
  phone: "string",
  address: "string",
  children_ids: ["student_uid_1", "student_uid_2"],
  created_at: "ISO timestamp"
}
```

## Frontend Components

### New Pages
1. `/profile` - User profile with role-based features
2. `/parent-dashboard` - Parent dashboard with children overview
3. `/students/create-account` - Create student with authentication

### Updated Pages
1. `/students` - Added "Create Account with Login" button
2. Sidebar - Added profile and parent dashboard links
3. Navbar - Added clickable user profile section

## Usage Examples

### Example 1: Create Student with New Parent Account

```typescript
const response = await api.fetchApi('/students/with-account', {
  method: 'POST',
  body: JSON.stringify({
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice.smith@school.com',
    student_password: 'MySecurePass123!',
    admission_number: '2024002',
    grade: '9',
    section: 'B',
    roll_number: 20,
    dob: '2011-08-20',
    gender: 'Female',
    address: '456 Oak Ave',
    parent_name: 'Bob Smith',
    parent_phone: '+1987654321',
    parent_email: 'bob.smith@parent.com',
    parent_password: 'ParentPass456!',
    create_parent_account: true
  })
});

// Save credentials from response
console.log('Student Login:', response.student.email, response.student.password);
console.log('Parent Login:', response.parent.email, response.parent.password);
```

### Example 2: Link Existing Student to Parent

```typescript
const response = await api.fetchApi('/students/link-parent', {
  method: 'POST',
  body: JSON.stringify({
    student_id: 'existing_student_uid',
    parent_email: 'parent@email.com',
    create_parent_if_not_exists: true
  })
});
```

### Example 3: Parent Views Child Details

```typescript
// Parent logs in and views dashboard
const dashboard = await api.fetchApi('/parents/dashboard');

// View detailed info for specific child
const childDetails = await api.fetchApi(`/students/${childId}/detailed`);
```

## Security Considerations

1. **Password Handling**: Passwords are only shown once during creation
2. **Access Control**: Role-based access enforced on all endpoints
3. **Data Scoping**: Parents can only view their own children
4. **Firebase Authentication**: All accounts use Firebase Auth for security
5. **Custom Claims**: Roles stored as Firebase custom claims

## Future Enhancements

1. Email notifications with credentials
2. Password reset functionality
3. Parent self-registration with approval workflow
4. Bulk student import with parent linking
5. Parent-teacher messaging
6. Mobile app for parents
7. Push notifications for attendance/homework
8. Document upload (ID cards, certificates)

## Testing

### Test Accounts to Create

1. **Super Admin**: Create via Firebase Console
2. **Principal**: Create via staff management
3. **Teacher**: Create via staff management
4. **Student**: Use `/students/with-account` endpoint
5. **Parent**: Auto-created when creating student

### Test Scenarios

1. Create student without parent email
2. Create student with existing parent email
3. Create student with new parent email
4. Link existing student to new parent
5. Parent views multiple children
6. Student views own profile
7. Teacher creates student account
8. Custom vs auto-generated passwords

## API Summary

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/students/with-account` | POST | Staff | Create student with auth |
| `/students/link-parent` | POST | Staff | Link student to parent |
| `/students/{id}/detailed` | GET | Parent/Staff/Student | Get detailed info |
| `/parents/dashboard` | GET | Parent | Parent dashboard |
| `/parents/children` | GET | Parent | List children |
| `/parents/{id}` | GET | Parent/Staff | Get parent info |
| `/parents/` | GET | Staff | List all parents |

## Conclusion

This comprehensive system enables schools to:
- Efficiently create student accounts with authentication
- Link students to parent accounts for portal access
- Provide parents with detailed visibility into their children's academic progress
- Maintain role-based security and access control
- Generate and manage credentials securely

All features are production-ready and follow best practices for security, scalability, and user experience.

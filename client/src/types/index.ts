// All TypeScript interfaces for the ZP School ERP

export type Role = 'superadmin' | 'principal' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: Role;
  photoUrl?: string;
  phone?: string;
  schoolId?: string;
  createdAt: string;
}

export interface Student {
  studentId: string;
  uid?: string;
  admissionNumber: string;
  rollNumber?: string;
  name: string;
  classId: string;
  sectionId: string;
  parentUid?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  phone?: string;
  parentPhone?: string;
  photoUrl?: string;
  documents?: string[];
  isActive: boolean;
  admissionDate: string;
  academicYear?: string;
  createdAt: string;
}

export interface Staff {
  staffId: string;
  uid?: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  subjectsTaught?: string[];
  classTeacherOf?: string;
  joiningDate?: string;
  qualifications?: string[];
  phone?: string;
  email?: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Class {
  classId: string;
  name: string;
  schoolId?: string;
  academicYear?: string;
}

export interface Section {
  sectionId: string;
  classId: string;
  name: string;
  classTeacherId?: string;
  studentIds?: string[];
  capacity?: number;
}

export interface Subject {
  subjectId: string;
  name: string;
  code?: string;
  classId: string;
  teacherId?: string;
  isElective?: boolean;
}

export interface TimetableSlot {
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface Timetable {
  timetableId: string;
  classId: string;
  sectionId: string;
  weeklySchedule: {
    monday?: TimetableSlot[];
    tuesday?: TimetableSlot[];
    wednesday?: TimetableSlot[];
    thursday?: TimetableSlot[];
    friday?: TimetableSlot[];
    saturday?: TimetableSlot[];
  };
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day';

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  parentNotified: boolean;
}

export interface FeeStructure {
  feeStructureId: string;
  classId: string;
  academicYear: string;
  components: { name: string; amount: number; frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time' }[];
  lateFinePerDay?: number;
  dueDay?: number;
}

export interface FeeRecord {
  feeId: string;
  studentId: string;
  feeStructureId: string;
  componentName: string;
  amount: number;
  dueDate?: string;
  paidAmount: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'waived';
  receiptNumber: string;
  collectedBy: string;
  paidAt: string;
  paymentMode: 'cash' | 'cheque' | 'dd' | 'upi';
  remarks?: string;
  lateFine?: number;
}

export interface Exam {
  examId: string;
  name: string;
  classId: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  examType: 'unit-test' | 'mid-term' | 'final' | 'practical';
}

export interface ExamSchedule {
  scheduleId: string;
  examId: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  maxMarks: number;
  passingMarks: number;
}

export interface Mark {
  markId: string;
  examId: string;
  subjectId: string;
  studentId: string;
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
  enteredBy: string;
  enteredAt: string;
}

export interface ReportCard {
  reportCardId: string;
  studentId: string;
  examId: string;
  classId: string;
  academicYear: string;
  subjectWiseMarks: Mark[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  rank: number;
  generatedAt: string;
  pdfUrl?: string;
}

export interface Homework {
  homeworkId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  attachments?: string[];
  createdAt: string;
}

export interface Assignment {
  assignmentId: string;
  homeworkId: string;
  studentId: string;
  submittedAt?: string;
  fileUrls?: string[];
  textContent?: string;
  grade?: string;
  feedback?: string;
  gradedBy?: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface LibraryBook {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string;
  coverImageUrl?: string;
}

export interface LibraryTransaction {
  transactionId: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount?: number;
  status: 'issued' | 'returned' | 'overdue';
}

export interface TransportRoute {
  routeId: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  stops: { stopName: string; pickupTime: string; dropTime: string }[];
}

export interface HostelRoom {
  roomId: string;
  roomNumber: string;
  blockName: string;
  floor: string;
  capacity: number;
  occupiedBy: string[];
  type: 'single' | 'double' | 'dormitory';
}

export interface InventoryItem {
  itemId: string;
  name: string;
  category: 'stationery' | 'lab' | 'sports' | 'furniture' | 'IT';
  totalQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  supplier?: string;
  minStockAlert: number;
  isLowStock?: boolean;
}

export interface Notice {
  noticeId: string;
  title: string;
  content: string;
  postedBy: string;
  targetAudience: 'all' | 'teachers' | 'students' | 'parents' | string;
  isPinned?: boolean;
  attachments?: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface SchoolEvent {
  eventId: string;
  title: string;
  description?: string;
  date: string;
  venue?: string;
  organizer: string;
  targetAudience?: string;
  registrationRequired?: boolean;
  registeredStudents?: string[];
}

export interface Message {
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  sentAt: string;
  threadId?: string;
}

export interface Complaint {
  complaintId: string;
  submittedBy: string;
  submitterRole: Role;
  subject: string;
  description: string;
  attachments?: string[];
  status: 'open' | 'in-progress' | 'resolved';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface LeaveRequest {
  leaveId: string;
  applicantUid: string;
  type: 'sick' | 'casual' | 'earned';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  appliedAt: string;
  remarks?: string;
}

export interface SchoolProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  affiliationBoard?: string;
  establishedYear?: number;
  logoUrl?: string;
}

export interface AcademicYear {
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface GradeBoundary {
  grade: string;
  min: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

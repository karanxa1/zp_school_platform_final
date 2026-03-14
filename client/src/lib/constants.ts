import type { Role } from '../types';

export const ROLES: Role[] = ['superadmin', 'principal', 'teacher', 'student', 'parent'];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Super Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export const ROLE_COLORS: Record<Role, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  principal: 'bg-blue-100 text-blue-800',
  teacher: 'bg-green-100 text-green-800',
  student: 'bg-yellow-100 text-yellow-800',
  parent: 'bg-orange-100 text-orange-800',
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  superadmin: [
    { label: 'Dashboard',     href: '/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Students',      href: '/students',     icon: 'Users' },
    { label: 'Staff',         href: '/staff',        icon: 'UserCheck' },
    { label: 'Academics',     href: '/academics',    icon: 'BookOpen' },
    { label: 'Attendance',    href: '/attendance',   icon: 'CalendarCheck' },
    { label: 'Leaves',        href: '/leaves',       icon: 'CalendarCheck' },
    { label: 'Fees',          href: '/fees',         icon: 'IndianRupee' },
    { label: 'Exams',         href: '/exams',        icon: 'FileText' },
    { label: 'Homework',      href: '/homework',     icon: 'BookMarked' },
    { label: 'Library',       href: '/library',      icon: 'Library' },
    { label: 'Transport',     href: '/transport',    icon: 'Bus' },
    { label: 'Hostel',        href: '/hostel',       icon: 'Building' },
    { label: 'Inventory',     href: '/inventory',    icon: 'Package' },
    { label: 'Communication', href: '/communication',icon: 'MessageSquare' },
    { label: 'Complaints',    href: '/complaints',   icon: 'AlertCircle' },
    { label: 'Reports',       href: '/reports',      icon: 'BarChart' },
    { label: 'Timetable',     href: '/timetable',    icon: 'LayoutDashboard' },
    { label: 'Settings',      href: '/settings',     icon: 'Settings' },
  ],
  principal: [
    { label: 'Dashboard',     href: '/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Students',      href: '/students',     icon: 'Users' },
    { label: 'Staff',         href: '/staff',        icon: 'UserCheck' },
    { label: 'Academics',     href: '/academics',    icon: 'BookOpen' },
    { label: 'Attendance',    href: '/attendance',   icon: 'CalendarCheck' },
    { label: 'Leaves',        href: '/leaves',       icon: 'CalendarCheck' },
    { label: 'Fees',          href: '/fees',         icon: 'IndianRupee' },
    { label: 'Exams',         href: '/exams',        icon: 'FileText' },
    { label: 'Homework',      href: '/homework',     icon: 'BookMarked' },
    { label: 'Library',       href: '/library',      icon: 'Library' },
    { label: 'Communication', href: '/communication',icon: 'MessageSquare' },
    { label: 'Complaints',    href: '/complaints',   icon: 'AlertCircle' },
    { label: 'Reports',       href: '/reports',      icon: 'BarChart' },
    { label: 'Timetable',     href: '/timetable',    icon: 'LayoutDashboard' },
    { label: 'Settings',      href: '/settings',     icon: 'Settings' },
  ],
  teacher: [
    { label: 'Dashboard',     href: '/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Attendance',    href: '/attendance',   icon: 'CalendarCheck' },
    { label: 'Leaves',        href: '/leaves',       icon: 'CalendarCheck' },
    { label: 'Exams',         href: '/exams',        icon: 'FileText' },
    { label: 'Homework',      href: '/homework',     icon: 'BookMarked' },
    { label: 'Timetable',     href: '/timetable',    icon: 'LayoutDashboard' },
    { label: 'Communication', href: '/communication',icon: 'MessageSquare' },
  ],
  student: [
    { label: 'Dashboard',     href: '/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Attendance',    href: '/attendance/student/me', icon: 'CalendarCheck' },
    { label: 'Exams',         href: '/exams',        icon: 'FileText' },
    { label: 'Homework',      href: '/homework',     icon: 'BookMarked' },
    { label: 'Library',       href: '/library',      icon: 'Library' },
    { label: 'Communication', href: '/communication',icon: 'MessageSquare' },
    { label: 'Complaints',    href: '/complaints',   icon: 'AlertCircle' },
  ],
  parent: [
    { label: 'Dashboard',     href: '/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Fees',          href: '/fees',         icon: 'IndianRupee' },
    { label: 'Exams',         href: '/exams',        icon: 'FileText' },
    { label: 'Homework',      href: '/homework',     icon: 'BookMarked' },
    { label: 'Communication', href: '/communication',icon: 'MessageSquare' },
    { label: 'Complaints',    href: '/complaints',   icon: 'AlertCircle' },
  ],
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  'half-day': 'bg-orange-100 text-orange-800',
};

export const FEE_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid: 'bg-red-100 text-red-800',
  waived: 'bg-gray-100 text-gray-800',
};

export const COMPLAINT_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const LEAVE_BALANCE = { casual: 12, sick: 10, earned: 15 };

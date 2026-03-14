import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SchoolProvider } from '@/context/SchoolContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorBoundary, RootErrorBoundary } from '@/components/shared/ErrorBoundary';

// Auth
const Login = lazy(() => import('@/pages/auth/Login'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Dashboards
const SuperadminDashboard = lazy(() => import('@/pages/dashboard/SuperadminDashboard'));
const PrincipalDashboard  = lazy(() => import('@/pages/dashboard/PrincipalDashboard'));
const TeacherDashboard    = lazy(() => import('@/pages/dashboard/TeacherDashboard'));
const StudentDashboard    = lazy(() => import('@/pages/dashboard/StudentDashboard'));
const ParentDashboard     = lazy(() => import('@/pages/dashboard/ParentDashboard'));

// Students
const StudentList    = lazy(() => import('@/pages/students/StudentList'));
const StudentDetail  = lazy(() => import('@/pages/students/StudentDetail'));
const StudentIdCard  = lazy(() => import('@/pages/students/StudentIdCard'));

// Staff
const StaffList = lazy(() => import('@/pages/staff/StaffList'));

// Academics
const ClassManager   = lazy(() => import('@/pages/academics/ClassManager'));
const TimetablePage  = lazy(() => import('@/pages/academics/TimetablePage'));

// Attendance
const MarkAttendance             = lazy(() => import('@/pages/attendance/MarkAttendance'));
const AttendanceReport           = lazy(() => import('@/pages/attendance/AttendanceReport'));
const StudentAttendanceCalendar  = lazy(() => import('@/pages/attendance/StudentAttendanceCalendar'));

// Fees
const FeeManager      = lazy(() => import('@/pages/fees/FeeManager'));
const FeeReceiptPrint = lazy(() => import('@/pages/fees/FeeReceiptPrint'));

// Exams
const ExamManager    = lazy(() => import('@/pages/exams/ExamManager'));
const ReportCard     = lazy(() => import('@/pages/exams/ReportCard'));
const ExamMarksEntry = lazy(() => import('@/pages/exams/ExamMarksEntry'));

// Homework
const HomeworkList = lazy(() => import('@/pages/homework/HomeworkList'));

// Library
const LibraryManager = lazy(() => import('@/pages/library/LibraryManager'));

// Transport
const TransportManager = lazy(() => import('@/pages/transport/TransportManager'));

// Hostel
const HostelManager = lazy(() => import('@/pages/hostel/HostelManager'));

// Inventory
const InventoryManager = lazy(() => import('@/pages/inventory/InventoryManager'));

// Communication
const NoticeBoard = lazy(() => import('@/pages/communication/NoticeBoard'));

// Complaints
const ComplaintsList = lazy(() => import('@/pages/complaints/ComplaintsList'));

// Settings
const SchoolSettings = lazy(() => import('@/pages/settings/SchoolSettings'));

// Phase 4
const ReportsPage  = lazy(() => import('@/pages/reports/ReportsPage'));
const LeaveManager = lazy(() => import('@/pages/leaves/LeaveManager'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

function DashboardRouter() {
  const { role } = useAuth();
  if (role === 'superadmin') return <SuperadminDashboard />;
  if (role === 'principal')  return <PrincipalDashboard />;
  if (role === 'teacher')    return <TeacherDashboard />;
  if (role === 'student')    return <StudentDashboard />;
  if (role === 'parent')     return <ParentDashboard />;
  return <LoadingSpinner fullPage />;
}

const ADMIN = ['superadmin', 'principal'] as const;
const STAFF = ['superadmin', 'principal', 'teacher'] as const;

export default function App() {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SchoolProvider>
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <Routes>
                  {/* Public */}
                  <Route path="/login"            element={<Login />} />
                  <Route path="/forgot-password"  element={<ForgotPassword />} />
                  <Route path="/unauthorized"     element={<Unauthorized />} />

                  {/* Protected — route-aware ErrorBoundary resets on navigation */}
                  <Route element={<ProtectedRoute><ErrorBoundary><AppLayout /></ErrorBoundary></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardRouter />} />

                    {/* Students */}
                    <Route path="/students"          element={<ProtectedRoute allowedRoles={[...STAFF]}><StudentList /></ProtectedRoute>} />
                    <Route path="/students/:id"       element={<ProtectedRoute allowedRoles={[...STAFF]}><StudentDetail /></ProtectedRoute>} />
                    <Route path="/students/:id/id-card" element={<ProtectedRoute allowedRoles={[...STAFF]}><StudentIdCard /></ProtectedRoute>} />

                    {/* Staff */}
                    <Route path="/staff" element={<ProtectedRoute allowedRoles={[...ADMIN]}><StaffList /></ProtectedRoute>} />

                    {/* Academics */}
                    <Route path="/academics"   element={<ProtectedRoute allowedRoles={[...ADMIN]}><ClassManager /></ProtectedRoute>} />
                    <Route path="/timetable"   element={<TimetablePage />} />

                    {/* Attendance */}
                    <Route path="/attendance"                       element={<MarkAttendance />} />
                    <Route path="/attendance/report"                element={<AttendanceReport />} />
                    <Route path="/attendance/student/:studentId"    element={<StudentAttendanceCalendar />} />

                    {/* Fees */}
                    <Route path="/fees"                element={<ProtectedRoute allowedRoles={['superadmin', 'principal', 'parent']}><FeeManager /></ProtectedRoute>} />
                    <Route path="/fees/receipt/:feeId" element={<FeeReceiptPrint />} />

                    {/* Exams */}
                    <Route path="/exams"                                          element={<ExamManager />} />
                    <Route path="/exams/:examId/marks"                            element={<ProtectedRoute allowedRoles={[...STAFF]}><ExamMarksEntry /></ProtectedRoute>} />
                    <Route path="/exams/:examId/report-card/:studentId"           element={<ReportCard />} />

                    {/* Homework */}
                    <Route path="/homework" element={<HomeworkList />} />

                    {/* Library */}
                    <Route path="/library" element={<LibraryManager />} />

                    {/* Transport */}
                    <Route path="/transport" element={<ProtectedRoute allowedRoles={[...ADMIN]}><TransportManager /></ProtectedRoute>} />

                    {/* Hostel */}
                    <Route path="/hostel" element={<ProtectedRoute allowedRoles={[...ADMIN]}><HostelManager /></ProtectedRoute>} />

                    {/* Inventory */}
                    <Route path="/inventory" element={<ProtectedRoute allowedRoles={[...ADMIN]}><InventoryManager /></ProtectedRoute>} />

                    {/* Communication */}
                    <Route path="/communication" element={<NoticeBoard />} />

                    {/* Complaints */}
                    <Route path="/complaints" element={<ComplaintsList />} />

                    {/* Settings */}
                    <Route path="/settings" element={<ProtectedRoute allowedRoles={['superadmin', 'principal']}><SchoolSettings /></ProtectedRoute>} />

                    {/* Phase 4 */}
                    <Route path="/reports" element={<ProtectedRoute allowedRoles={[...ADMIN]}><ReportsPage /></ProtectedRoute>} />
                    <Route path="/leaves"  element={<LeaveManager />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
            </SchoolProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}

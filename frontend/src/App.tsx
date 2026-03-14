import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/StudentsList';
import StaffList from './pages/StaffList';
import AcademicsList from './pages/AcademicsList';
import AttendanceList from './pages/AttendanceList';
import FeesList from './pages/FeesList';
import ExamsList from './pages/ExamsList';
import HomeworkList from './pages/HomeworkList';
import LogisticsList from './pages/LogisticsList';
import CommunicationList from './pages/CommunicationList';
import ReportsList from './pages/ReportsList';
import SettingsList from './pages/SettingsList';
import ParentDashboard from './pages/ParentDashboard';
import CreateStudentAccount from './pages/CreateStudentAccount';
import LinkStudentToParent from './pages/LinkStudentToParent';
import Profile from './pages/Profile';
import AppLayout from './components/layout/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!currentUser) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

// Shows LandingPage when not logged in, or redirects to dashboard
function PublicOrApp() {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOrApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
          <Route path="/students/create-account" element={<ProtectedRoute><CreateStudentAccount /></ProtectedRoute>} />
          <Route path="/students/link-parent" element={<ProtectedRoute><LinkStudentToParent /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />
          <Route path="/academics" element={<ProtectedRoute><AcademicsList /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceList /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute><FeesList /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute><ExamsList /></ProtectedRoute>} />
          <Route path="/homework" element={<ProtectedRoute><HomeworkList /></ProtectedRoute>} />
          <Route path="/logistics" element={<ProtectedRoute><LogisticsList /></ProtectedRoute>} />
          <Route path="/communication" element={<ProtectedRoute><CommunicationList /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsList /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsList /></ProtectedRoute>} />
          <Route path="/parent-dashboard" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

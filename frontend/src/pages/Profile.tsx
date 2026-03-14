import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Button } from '@/components/ui/button';
import { auth } from '../lib/firebase';

const roleFeatures = {
  super_admin: {
    title: 'Super Administrator',
    description: 'Full system access with all administrative privileges',
    features: [
      { name: 'User Management', description: 'Create, edit, delete all user accounts', icon: '👥' },
      { name: 'System Settings', description: 'Configure global system parameters', icon: '⚙️' },
      { name: 'Data Seeding', description: 'Initialize and reset system data', icon: '🌱' },
      { name: 'All Reports', description: 'Generate and view all system reports', icon: '📊' },
      { name: 'Student Management', description: 'Full CRUD operations on students', icon: '🎓' },
      { name: 'Staff Management', description: 'Full CRUD operations on staff', icon: '👔' },
      { name: 'Academic Management', description: 'Manage classes, sections, subjects', icon: '📚' },
      { name: 'Attendance Tracking', description: 'Mark and view all attendance', icon: '📋' },
      { name: 'Fee Management', description: 'Manage fee structures and payments', icon: '💰' },
      { name: 'Exam Management', description: 'Create exams and enter results', icon: '📝' },
      { name: 'Homework Management', description: 'Assign and evaluate homework', icon: '📖' },
      { name: 'Logistics', description: 'Manage library, transport, hostel, inventory', icon: '🚌' },
      { name: 'Communication', description: 'Send notices and manage complaints', icon: '📢' },
    ]
  },
  principal: {
    title: 'Principal',
    description: 'Administrative access with oversight of all school operations',
    features: [
      { name: 'Student Management', description: 'Create, edit, view student records', icon: '🎓' },
      { name: 'Staff Management', description: 'Create, edit, view staff records', icon: '👔' },
      { name: 'Academic Oversight', description: 'Manage classes and curriculum', icon: '📚' },
      { name: 'Attendance Reports', description: 'View and analyze attendance data', icon: '📋' },
      { name: 'Fee Management', description: 'Oversee fee collection and structures', icon: '💰' },
      { name: 'Exam Management', description: 'Create exams and view results', icon: '📝' },
      { name: 'Homework Review', description: 'Assign and monitor homework', icon: '📖' },
      { name: 'Logistics Management', description: 'Manage school resources', icon: '🚌' },
      { name: 'Communication', description: 'Send notices and handle complaints', icon: '📢' },
      { name: 'Reports Generation', description: 'Generate academic and financial reports', icon: '📊' },
    ]
  },
  teacher: {
    title: 'Teacher',
    description: 'Academic and classroom management access',
    features: [
      { name: 'Student Viewing', description: 'View student information', icon: '🎓' },
      { name: 'Create Student Accounts', description: 'Register new students', icon: '➕' },
      { name: 'Attendance Marking', description: 'Mark daily attendance for classes', icon: '📋' },
      { name: 'Homework Assignment', description: 'Assign and evaluate homework', icon: '📖' },
      { name: 'Exam Results', description: 'Enter marks and grades', icon: '📝' },
      { name: 'View Notices', description: 'Read school announcements', icon: '📢' },
      { name: 'Class Management', description: 'View assigned classes', icon: '📚' },
      { name: 'Logistics Access', description: 'View library and resources', icon: '🚌' },
    ]
  },
  parent: {
    title: 'Parent',
    description: 'Access to children\'s academic information and progress',
    features: [
      { name: 'Children Dashboard', description: 'View all linked children', icon: '👨‍👩‍👧‍👦' },
      { name: 'Attendance Tracking', description: 'Monitor child attendance records', icon: '📋' },
      { name: 'Fee Information', description: 'View payment history and dues', icon: '💰' },
      { name: 'Exam Results', description: 'Access grades and performance', icon: '📝' },
      { name: 'Homework Status', description: 'Track pending assignments', icon: '📖' },
      { name: 'School Notices', description: 'Receive important announcements', icon: '📢' },
      { name: 'Submit Complaints', description: 'File concerns and feedback', icon: '📝' },
      { name: 'Contact Information', description: 'View teacher and school contacts', icon: '📞' },
    ]
  },
  student: {
    title: 'Student',
    description: 'Access to personal academic information and resources',
    features: [
      { name: 'My Profile', description: 'View personal information', icon: '👤' },
      { name: 'My Attendance', description: 'Check attendance records', icon: '📋' },
      { name: 'My Fees', description: 'View payment status', icon: '💰' },
      { name: 'My Exam Results', description: 'Access grades and marks', icon: '📝' },
      { name: 'My Homework', description: 'View and submit assignments', icon: '📖' },
      { name: 'School Notices', description: 'Read announcements', icon: '📢' },
      { name: 'Library Access', description: 'View available books', icon: '📚' },
      { name: 'Transport Info', description: 'View route details', icon: '🚌' },
    ]
  }
};

export default function Profile() {
  const { currentUser, role } = useAuth();
  const api = useApi();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [role]);

  const loadProfile = async () => {
    try {
      if (role === 'student') {
        const data = await api.fetchApi(`/students/${currentUser?.uid}`);
        setProfileData(data);
      } else if (role === 'parent') {
        const data = await api.fetchApi(`/parents/${currentUser?.uid}`);
        setProfileData(data);
      } else if (role === 'teacher' || role === 'principal' || role === 'admin') {
        const data = await api.fetchApi(`/staff/${currentUser?.uid}`);
        setProfileData(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = roleFeatures[role as keyof typeof roleFeatures] || roleFeatures.student;

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass-panel border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
              {role === 'super_admin' && '👑'}
              {role === 'principal' && '🎓'}
              {role === 'teacher' && '👨‍🏫'}
              {role === 'parent' && '👨‍👩‍👧'}
              {role === 'student' && '🎒'}
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </h2>
              <p className="text-lg text-primary font-semibold">{roleInfo.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{roleInfo.description}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="glass-panel border rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2">Personal Information</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{currentUser?.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-mono text-sm">{currentUser?.uid}</p>
          </div>

          {profileData && (
            <>
              {profileData.first_name && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profileData.first_name} {profileData.last_name}</p>
                </div>
              )}

              {profileData.phone && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profileData.phone}</p>
                </div>
              )}

              {profileData.grade && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">Grade {profileData.grade} - Section {profileData.section}</p>
                </div>
              )}

              {profileData.roll_number && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{profileData.roll_number}</p>
                </div>
              )}

              {profileData.admission_number && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium">{profileData.admission_number}</p>
                </div>
              )}

              {profileData.department && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{profileData.department}</p>
                </div>
              )}

              {profileData.designation && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-medium">{profileData.designation}</p>
                </div>
              )}

              {profileData.children_ids && profileData.children_ids.length > 0 && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Linked Children</p>
                  <p className="font-medium">{profileData.children_ids.length} child(ren)</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Accessible Features */}
      <div className="glass-panel border rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2">Your Access & Permissions</h3>
        <p className="text-sm text-muted-foreground">
          As a {roleInfo.title}, you have access to the following features:
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {roleInfo.features.map((feature, index) => (
            <div 
              key={index}
              className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{feature.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{feature.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-panel border rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2">Quick Actions</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {role === 'parent' && (
            <Button className="w-full" onClick={() => window.location.href = '/parent-dashboard'}>
              📊 View Children Dashboard
            </Button>
          )}
          
          {['super_admin', 'principal', 'teacher'].includes(role || '') && (
            <>
              <Button className="w-full" onClick={() => window.location.href = '/students'}>
                🎓 Manage Students
              </Button>
              <Button className="w-full" onClick={() => window.location.href = '/attendance'}>
                📋 Mark Attendance
              </Button>
            </>
          )}

          {role === 'student' && (
            <>
              <Button className="w-full" onClick={() => window.location.href = '/homework'}>
                📖 My Homework
              </Button>
              <Button className="w-full" onClick={() => window.location.href = '/exams'}>
                📝 My Results
              </Button>
            </>
          )}

          <Button className="w-full" variant="outline" onClick={() => window.location.href = '/communication'}>
            📢 Notices
          </Button>

          {['super_admin', 'principal'].includes(role || '') && (
            <Button className="w-full" variant="outline" onClick={() => window.location.href = '/reports'}>
              📊 Generate Reports
            </Button>
          )}
        </div>
      </div>

      {/* Account Security */}
      <div className="glass-panel border rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2">Account Security</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Email Verification</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.emailVerified ? 'Verified ✓' : 'Not verified'}
              </p>
            </div>
            {!currentUser?.emailVerified && (
              <Button size="sm" variant="outline">Verify Email</Button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Password</p>
              <p className="text-xs text-muted-foreground">Last changed: Unknown</p>
            </div>
            <Button size="sm" variant="outline">Change Password</Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Account Created</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.metadata?.creationTime 
                  ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Last Sign In</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.metadata?.lastSignInTime 
                  ? new Date(currentUser.metadata.lastSignInTime).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

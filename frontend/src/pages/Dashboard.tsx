import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { useApi } from '../hooks/useApi';

export default function Dashboard() {
  const { currentUser, role } = useAuth();
  const api = useApi();

  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    notices: 0
  });

  useEffect(() => {
    if (['super_admin', 'principal', 'hod'].includes(role || '')) {
      fetchAdminStats();
    }
  }, [role]);

  const fetchAdminStats = async () => {
    try {
      const [studentsRes, staffRes, noticesRes] = await Promise.all([
        api.fetchApi('/students/?limit=1000'),
        api.fetchApi('/staff/?limit=1000'),
        api.fetchApi('/communication/notices')
      ]);
      
      setStats({
        students: studentsRes.length || 0,
        staff: staffRes.length || 0,
        notices: noticesRes.length || 0
      });
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border glass-panel">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentUser?.displayName || currentUser?.email}</h1>
            <p className="text-muted-foreground mt-1">Role: <span className="capitalize font-medium text-primary">{role || 'Student'}</span></p>
          </div>
          <Button variant="outline" onClick={() => auth.signOut()}>Sign Out</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['super_admin', 'principal', 'hod'].includes(role || '') ? (
            <>
              <div className="glass-card p-6 aspect-video flex flex-col justify-between">
                <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mb-4">S</div>
                <div>
                  <h3 className="text-3xl font-bold">{stats.students}</h3>
                  <p className="text-muted-foreground text-sm font-medium">Total Students</p>
                </div>
              </div>
              <div className="glass-card p-6 aspect-video flex flex-col justify-between">
                <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-4">T</div>
                <div>
                  <h3 className="text-3xl font-bold">{stats.staff}</h3>
                  <p className="text-muted-foreground text-sm font-medium">Total Staff</p>
                </div>
              </div>
              <div className="glass-card p-6 aspect-video flex flex-col justify-between">
                <div className="h-10 w-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 mb-4">N</div>
                <div>
                  <h3 className="text-3xl font-bold">{stats.notices}</h3>
                  <p className="text-muted-foreground text-sm font-medium">Active Notices</p>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card col-span-1 md:col-span-3 p-6 flex items-center justify-center min-h-[200px]">
              <p className="text-muted-foreground text-lg">Your personalized dashboard will appear here soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

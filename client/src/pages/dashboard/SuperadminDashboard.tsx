import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import api from '@/lib/axios';
import { Users, UserCheck, CalendarCheck, IndianRupee, FileText, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  totalStudents: number;
  totalStaff: number;
  attendanceToday: number;
  feeCollectedMonth: number;
  pendingDues: number;
  lowStockItems: number;
}

const StatCard = ({ title, value, icon: Icon, sub }: { title: string; value: string | number; icon: React.FC<{className?: string}>; sub?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export default function SuperadminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsRes, staffRes, feesRes, lowStockRes] = await Promise.all([
          api.get('/api/v1/students?isActive=true&limit=1'),
          api.get('/api/v1/staff?limit=1'),
          api.get('/api/v1/fees/pending'),
          api.get('/api/v1/inventory/low-stock'),
        ]);
        setStats({
          totalStudents: studentsRes.data.data.total || 0,
          totalStaff: staffRes.data.data.total || 0,
          attendanceToday: 0, // Will be computed once attendance is marked
          feeCollectedMonth: 0,
          pendingDues: feesRes.data.data.length || 0,
          lowStockItems: lowStockRes.data.data.length || 0,
        });
      } catch { /* non-critical */ } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.name || 'Admin'}`} description="School overview and key metrics" />
      {loading ? <LoadingSpinner /> : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <StatCard title="Total Students" value={stats?.totalStudents ?? '—'} icon={Users} />
          <StatCard title="Total Staff" value={stats?.totalStaff ?? '—'} icon={UserCheck} />
          <StatCard title="Attendance Today" value={`${stats?.attendanceToday ?? 0}%`} icon={CalendarCheck} />
          <StatCard title="Pending Dues" value={stats?.pendingDues ?? 0} icon={IndianRupee} sub="students with outstanding fees" />
          <StatCard title="Low Stock Items" value={stats?.lowStockItems ?? 0} icon={Package} sub="below minimum threshold" />
        </div>
      )}
    </div>
  );
}

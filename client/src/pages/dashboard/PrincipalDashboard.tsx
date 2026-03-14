import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Users, UserCheck, CalendarCheck, AlertCircle, FileText, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, sub, href }: { title: string; value: string | number; icon: React.FC<{className?: string}>; sub?: string; href?: string }) => {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
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
  return href ? <Link to={href}>{content}</Link> : content;
};

export default function PrincipalDashboard() {
  const { profile } = useAuth();
  const { data: students, isLoading: sLoading } = useApiQuery<{ total: number }>(['students-count'], '/api/v1/students', { limit: 1 });
  const { data: staff, isLoading: stLoading } = useApiQuery<{ total: number }>(['staff-count'], '/api/v1/staff', { limit: 1 });
  const { data: pending } = useApiQuery<unknown[]>(['pending-fees'], '/api/v1/fees/pending');
  const { data: complaints } = useApiQuery<unknown[]>(['complaints-open'], '/api/v1/complaints', { status: 'open' });
  const { data: notices } = useApiQuery<unknown[]>(['notices-recent'], '/api/v1/communication/notices');
  const { data: exams } = useApiQuery<unknown[]>(['exams-list'], '/api/v1/exams');

  const loading = sLoading || stLoading;

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.name || 'Principal'}`} description="School-wide overview" />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <StatCard title="Total Students" value={(students as any)?.total ?? '—'} icon={Users} href="/students" />
            <StatCard title="Total Staff" value={(staff as any)?.total ?? '—'} icon={UserCheck} href="/staff" />
            <StatCard title="Pending Dues" value={Array.isArray(pending) ? pending.length : '—'} icon={CalendarCheck} href="/fees" sub="students with outstanding fees" />
            <StatCard title="Open Complaints" value={Array.isArray(complaints) ? complaints.length : '—'} icon={AlertCircle} href="/complaints" />
            <StatCard title="Recent Notices" value={Array.isArray(notices) ? notices.length : '—'} icon={Bell} href="/communication" />
            <StatCard title="Active Exams" value={Array.isArray(exams) ? exams.length : '—'} icon={FileText} href="/exams" />
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { CalendarCheck, BookMarked, FileText, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const StatCard = ({ title, value, sub, icon: Icon, href, badge }: { title: string; value: string | number; icon: React.FC<{className?: string}>; sub?: string; href?: string; badge?: string }) => {
  const c = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center gap-2">
          {value}
          {badge && <Badge variant="destructive" className="text-xs">{badge}</Badge>}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{c}</Link> : c;
};

interface AttRecord { status: string; date: string; }
interface FeeRecord { status: string; balance: number; }
interface HW { homeworkId: string; title: string; dueDate: string; }
interface Exam { examId: string; name: string; startDate: string; }

export default function StudentDashboard() {
  const { profile } = useAuth();
  const uid = profile?.uid;

  const { data: attendance, isLoading: aLoading } = useApiQuery<AttRecord[]>(['att-mine'], '/api/v1/attendance/student/me', undefined, { enabled: !!uid });
  const { data: fees } = useApiQuery<FeeRecord[]>(['fees-mine'], `/api/v1/fees/records/${uid}`, undefined, { enabled: !!uid });
  const { data: homework } = useApiQuery<HW[]>(['hw-mine'], '/api/v1/homework');
  const { data: exams } = useApiQuery<Exam[]>(['exams-mine'], '/api/v1/exams');

  const today = format(new Date(), 'yyyy-MM-dd');
  const totalDays = Array.isArray(attendance) ? attendance.length : 0;
  const presentDays = Array.isArray(attendance) ? attendance.filter(a => a.status === 'present').length : 0;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const pendingFees = Array.isArray(fees) ? fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.balance || 0), 0) : 0;
  const upcomingHW = Array.isArray(homework) ? homework.filter(h => h.dueDate >= today) : [];
  const upcomingExams = Array.isArray(exams) ? exams.filter(e => e.startDate >= today) : [];

  return (
    <div>
      <PageHeader title={`Hello, ${profile?.name || 'Student'}`} description="Your academic overview" />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard title="Attendance" value={aLoading ? '…' : `${attPct}%`} icon={CalendarCheck} sub={`${presentDays}/${totalDays} days`} href={`/attendance/student/${uid}`} badge={attPct < 75 ? 'Low' : undefined} />
          <StatCard title="Pending Fees" value={pendingFees > 0 ? `₹${pendingFees}` : '✓ Paid'} icon={IndianRupee} href="/fees" />
          <StatCard title="Homework Due" value={upcomingHW.length} icon={BookMarked} href="/homework" />
          <StatCard title="Upcoming Exams" value={upcomingExams.length} icon={FileText} href="/exams" />
        </div>

        {upcomingHW.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Pending Homework</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcomingHW.slice(0, 4).map(h => (
                <div key={h.homeworkId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{h.title}</span>
                  <Badge variant={h.dueDate === today ? 'destructive' : 'outline'}>{h.dueDate}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

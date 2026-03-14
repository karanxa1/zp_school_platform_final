import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, IndianRupee, BookMarked, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, sub, href, badge }: { title: string; value: string | number; icon: React.FC<{className?: string}>; sub?: string; href?: string; badge?: string }) => {
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

interface FeeRecord { status: string; balance: number; componentName: string; dueDate?: string; }
interface HW { homeworkId: string; title: string; dueDate: string; }
interface Exam { examId: string; name: string; startDate: string; }
interface AttRecord { status: string; }

export default function ParentDashboard() {
  const { profile } = useAuth();
  // Parent sees child's data — using profile.uid to find linked student
  const { data: fees } = useApiQuery<FeeRecord[]>(['fees-child'], `/api/v1/fees/pending`);
  const { data: homework } = useApiQuery<HW[]>(['hw-parent'], '/api/v1/homework');
  const { data: exams } = useApiQuery<Exam[]>(['exams-parent'], '/api/v1/exams');
  const { data: attendance } = useApiQuery<AttRecord[]>(['att-parent'], '/api/v1/attendance/student/me');

  const today = format(new Date(), 'yyyy-MM-dd');
  const totalDays = Array.isArray(attendance) ? attendance.length : 0;
  const presentDays = Array.isArray(attendance) ? attendance.filter(a => a.status === 'present').length : 0;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const pendingFeeAmt = Array.isArray(fees) ? fees.reduce((s, f) => s + (f.balance || 0), 0) : 0;
  const upcomingHW = Array.isArray(homework) ? homework.filter(h => h.dueDate >= today) : [];
  const upcomingExams = Array.isArray(exams) ? exams.filter(e => e.startDate >= today) : [];

  return (
    <div>
      <PageHeader title={`Hello, ${profile?.name || 'Parent'}`} description="Your child's school overview" />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard title="Child Attendance" value={`${attPct}%`} icon={CalendarCheck} sub={`${presentDays}/${totalDays} days`} badge={attPct < 75 ? 'Low' : undefined} />
          <StatCard title="Pending Fees" value={pendingFeeAmt > 0 ? `₹${pendingFeeAmt}` : '✓ Clear'} icon={IndianRupee} href="/fees" />
          <StatCard title="Homework Due" value={upcomingHW.length} icon={BookMarked} href="/homework" />
          <StatCard title="Upcoming Exams" value={upcomingExams.length} icon={FileText} href="/exams" />
        </div>

        {upcomingExams.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming Exams</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcomingExams.slice(0, 5).map(e => (
                <div key={e.examId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{e.name}</span>
                  <Badge variant="outline">{e.startDate}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

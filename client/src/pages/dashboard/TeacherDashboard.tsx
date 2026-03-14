import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { CalendarCheck, BookMarked, FileText, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, href }: { title: string; value: string | number; icon: React.FC<{className?: string}>; href?: string }) => {
  const c = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
  return href ? <Link to={href}>{c}</Link> : c;
};

interface HW { homeworkId: string; title: string; dueDate: string; classId: string; }
interface Exam { examId: string; name: string; startDate: string; }

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { data: homework, isLoading: hwLoading } = useApiQuery<HW[]>(['homework-teacher'], '/api/v1/homework');
  const { data: exams, isLoading: exLoading } = useApiQuery<Exam[]>(['exams-upcoming'], '/api/v1/exams');
  const { data: notices } = useApiQuery<unknown[]>(['notices'], '/api/v1/communication/notices');

  const today = format(new Date(), 'yyyy-MM-dd');
  const upcomingHW = Array.isArray(homework) ? homework.filter(h => h.dueDate >= today) : [];
  const upcomingExams = Array.isArray(exams) ? exams.filter(e => e.startDate >= today) : [];

  return (
    <div>
      <PageHeader title={`Hello, ${profile?.name || 'Teacher'}`} description="Your teaching overview" />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard title="Pending Homework" value={hwLoading ? '…' : upcomingHW.length} icon={BookMarked} href="/homework" />
          <StatCard title="Upcoming Exams" value={exLoading ? '…' : upcomingExams.length} icon={FileText} href="/exams" />
          <StatCard title="Notices" value={Array.isArray(notices) ? notices.length : '—'} icon={Bell} href="/communication" />
          <StatCard title="Today's Date" value={format(new Date(), 'dd MMM')} icon={CalendarCheck} href="/attendance" />
        </div>

        {upcomingHW.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming Homework Due</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingHW.slice(0, 5).map(h => (
                  <div key={h.homeworkId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span className="font-medium">{h.title}</span>
                    <Badge variant="outline">{h.dueDate}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {upcomingExams.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming Exams</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingExams.slice(0, 5).map(e => (
                  <div key={e.examId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span className="font-medium">{e.name}</span>
                    <Badge variant="outline">{e.startDate}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

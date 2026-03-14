import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

interface AttRecord { date: string; status: 'present' | 'absent' | 'late' | 'half-day'; }

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'half-day': 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function StudentAttendanceCalendar() {
  const { studentId } = useParams<{ studentId: string }>();
  const [month, setMonth] = useState(new Date());
  const { data: records, isLoading } = useApiQuery<AttRecord[]>(['att-calendar', studentId!], `/api/v1/attendance/student/${studentId}`);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const dayMap = new Map((records || []).map(r => [r.date, r.status]));

  const total = records?.length || 0;
  const present = records?.filter(r => r.status === 'present').length || 0;
  const absent = records?.filter(r => r.status === 'absent').length || 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/students/${studentId}`}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Profile</Button></Link>
      </div>
      <PageHeader title="Attendance Calendar" description="Monthly view of attendance records" />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[['Present', present, 'text-green-600'], ['Absent', absent, 'text-red-600'], ['Total Days', total, ''], ['Percentage', `${pct}%`, pct < 75 ? 'text-red-600 font-bold' : 'text-green-600']].map(([l, v, c]) => (
          <Card key={String(l)}><CardContent className="p-3 text-center"><p className={`text-xl font-bold ${c}`}>{v}</p><p className="text-xs text-muted-foreground">{l}</p></CardContent></Card>
        ))}
      </div>

      {/* Month Nav */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => setMonth(m => subMonths(m, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="font-semibold text-base">{format(month, 'MMMM yyyy')}</h3>
            <Button variant="ghost" size="sm" onClick={() => setMonth(m => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {isLoading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-7 gap-1">
              {/* Padding for first day */}
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const status = dayMap.get(dateStr);
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div key={dateStr} className={`rounded-md border p-1 text-center text-xs min-h-[2.5rem] flex flex-col items-center justify-center ${status ? STATUS_COLORS[status] : 'border-transparent'} ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                    <span className="font-medium">{format(day, 'd')}</span>
                    {status && <span className="text-[9px] capitalize leading-tight">{status}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
            {Object.entries(STATUS_COLORS).map(([s, c]) => (
              <div key={s} className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${c}`}><span className="capitalize">{s}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

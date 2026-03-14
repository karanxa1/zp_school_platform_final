import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ClassItem { id: string; classId: string; name: string; }
interface Section { id: string; sectionId: string; name: string; classId: string; }
interface Student { id: string; name: string; admissionNo: string; }

type Status = 'present' | 'absent' | 'leave';

const STATUS_CONFIG: Record<Status, { label: string; icon: React.FC<{className?: string}>; style: string }> = {
  present: { label: 'P', icon: CheckCircle, style: 'bg-green-500/20 text-green-600 border-green-500' },
  absent: { label: 'A', icon: XCircle, style: 'bg-red-500/20 text-red-600 border-red-500' },
  leave: { label: 'L', icon: Clock, style: 'bg-yellow-500/20 text-yellow-600 border-yellow-500' },
};

export default function MarkAttendance() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: classes } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const { data: sections } = useApiQuery<Section[]>(['sections', classId], '/api/v1/academics/sections', classId ? { classId } : undefined, { enabled: !!classId });
  const { data: students, isLoading } = useApiQuery<Student[]>(
    ['students', classId, sectionId],
    '/api/v1/students',
    classId ? { classId, ...(sectionId && { section: sectionId }), limit: 100 } : undefined,
    { enabled: !!classId }
  );

  const markMutation = useApiMutation<unknown, { classId: string; sectionId: string; date: string; records: { studentId: string; status: string }[] }>(
    (d) => api.post('/api/v1/attendance/mark', d).then(r => r.data),
    { successMessage: 'Attendance saved successfully', onSuccess: () => setSubmitted(true) }
  );

  const toggle = (studentId: string) => {
    setAttendance(prev => {
      const cur = prev[studentId] || 'present';
      const next: Record<Status, Status> = { present: 'absent', absent: 'leave', leave: 'present' };
      return { ...prev, [studentId]: next[cur] };
    });
  };

  const handleSubmit = () => {
    if (!students?.length) return;
    const records = students.map(s => ({ studentId: s.id, status: attendance[s.id] || 'present' }));
    markMutation.mutate({ classId, sectionId, date, records });
  };

  const stats = students ? {
    present: students.filter(s => (attendance[s.id] || 'present') === 'present').length,
    absent: students.filter(s => attendance[s.id] === 'absent').length,
    leave: students.filter(s => attendance[s.id] === 'leave').length,
  } : null;

  return (
    <div>
      <PageHeader title="Mark Attendance" description="Record student attendance for a class" />

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={classId} onValueChange={v => { setClassId(v); setSectionId(''); setAttendance({}); setSubmitted(false); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Section (opt.)" /></SelectTrigger>
          <SelectContent>{(sections || []).map(s => <SelectItem key={s.id} value={s.sectionId}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
      </div>

      {!classId ? (
        <EmptyState icon={<CalendarCheck className="h-10 w-10" />} title="Select a class" description="Choose a class above to start marking attendance." />
      ) : isLoading ? <LoadingSpinner /> : !students?.length ? (
        <EmptyState title="No students" description="No students found for this class." />
      ) : submitted ? (
        <Card><CardContent className="flex flex-col items-center py-12 gap-3">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-xl font-semibold">Attendance Submitted!</h3>
          <p className="text-muted-foreground">Present: {stats?.present} | Absent: {stats?.absent} | Leave: {stats?.leave}</p>
          <Button onClick={() => { setAttendance({}); setSubmitted(false); }}>Mark Another</Button>
        </CardContent></Card>
      ) : (
        <>
          {stats && (
            <div className="flex gap-4 mb-4">
              {Object.entries(stats).map(([k, v]) => (
                <Badge key={k} variant="outline" className={STATUS_CONFIG[k as Status].style + ' text-sm px-3 py-1'}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}: {v}
                </Badge>
              ))}
            </div>
          )}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-2">
                {students.map(s => {
                  const status = attendance[s.id] || 'present';
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.admissionNo}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-28 ${cfg.style}`}
                        onClick={() => toggle(s.id)}
                      >
                        <cfg.icon className="h-4 w-4 mr-1" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleSubmit} disabled={markMutation.isPending}>
                  {markMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                  Submit Attendance ({students.length} students)
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

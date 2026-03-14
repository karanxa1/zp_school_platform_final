import React, { useState } from 'react';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Download } from 'lucide-react';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

interface ClassItem { id: string; classId: string; name: string; }
interface AttendanceRecord { studentId: string; studentName?: string; date: string; status: string; }

export default function AttendanceReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [classId, setClassId] = useState('');
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(today);

  const { data: classes } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const { data: records, isLoading } = useApiQuery<AttendanceRecord[]>(
    ['attendance', 'report', classId, from, to],
    '/api/v1/attendance/report',
    { ...(classId && { classId }), fromDate: from, toDate: to },
    { enabled: !!from && !!to }
  );

  // Aggregate by student
  const aggregated = records ? (() => {
    const map: Record<string, { studentId: string; name: string; total: number; present: number; absent: number; leave: number }> = {};
    records.forEach(r => {
      if (!map[r.studentId]) map[r.studentId] = { studentId: r.studentId, name: r.studentName || r.studentId, total: 0, present: 0, absent: 0, leave: 0 };
      map[r.studentId].total++;
      if (r.status === 'present') map[r.studentId].present++;
      else if (r.status === 'absent') map[r.studentId].absent++;
      else if (r.status === 'leave') map[r.studentId].leave++;
    });
    return Object.values(map);
  })() : [];

  const exportExcel = () => {
    if (!aggregated.length) return;
    const rows = aggregated.map(r => ({ Name: r.name, Total: r.total, Present: r.present, Absent: r.absent, Leave: r.leave, '%': r.total ? Math.round((r.present / r.total) * 100) + '%' : '0%' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `attendance_${from}_${to}.xlsx`);
  };

  return (
    <div>
      <PageHeader title="Attendance Report" description="View and export attendance summaries">
        <Button variant="outline" size="sm" onClick={exportExcel} disabled={!aggregated.length}><Download className="h-4 w-4 mr-2" />Export</Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent><SelectItem value="">All Classes</SelectItem>{(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">From</span>
          <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <span className="text-sm text-muted-foreground">To</span>
          <input type="date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading ? <LoadingSpinner /> : !aggregated.length ? (
            <EmptyState title="No records" description="No attendance data for the selected period." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Student</TableHead><TableHead>Total Days</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>Leave</TableHead><TableHead>Attendance %</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {aggregated.map(r => {
                  const pct = r.total ? Math.round((r.present / r.total) * 100) : 0;
                  return (
                    <TableRow key={r.studentId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.total}</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-700">{r.present}</Badge></TableCell>
                      <TableCell><Badge className="bg-red-500/20 text-red-700">{r.absent}</Badge></TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-700">{r.leave}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

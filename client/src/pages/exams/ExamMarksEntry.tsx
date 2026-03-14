import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowLeft, Save, FileText } from 'lucide-react';

interface Exam { examId: string; name: string; subjects: { subjectId: string; name: string; maxMarks: number }[] }
interface Student { id: string; studentId: string; name: string; admissionNo: string; }
interface Mark { studentId: string; subjectId: string; marksObtained: number; }

function gradeFor(obtained: number, max: number): string {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export default function ExamMarksEntry() {
  const { examId } = useParams<{ examId: string }>();
  const [classId, setClassId] = useState('');
  // marks[studentId][subjectId] = string
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>({});

  const { data: exam } = useApiQuery<Exam>(['exam-detail', examId!], `/api/v1/exams/${examId}`);
  const { data: classes } = useApiQuery<{ id: string; classId: string; name: string }[]>(['classes'], '/api/v1/academics/classes');
  const { data: students, isLoading: studLoading } = useApiQuery<Student[]>(
    ['students-class', classId], '/api/v1/students', { className: classId }, { enabled: !!classId }
  );
  const { data: existingMarks } = useApiQuery<Mark[]>(
    ['existing-marks', examId!, classId], `/api/v1/exams/${examId}/marks`, { classId }, { enabled: !!classId }
  );

  // Pre-fill from existing marks when loaded
  React.useEffect(() => {
    if (!existingMarks?.length) return;
    const pre: Record<string, Record<string, string>> = {};
    existingMarks.forEach(m => {
      if (!pre[m.studentId]) pre[m.studentId] = {};
      pre[m.studentId][m.subjectId] = String(m.marksObtained);
    });
    setMarks(pre);
  }, [existingMarks]);

  const save = useApiMutation<unknown, { entries: Mark[] }>(
    (d) => api.post(`/api/v1/exams/${examId}/marks/bulk`, d).then(r => r.data),
    { successMessage: 'Marks saved successfully', invalidateKeys: [['existing-marks', examId!, classId]] }
  );

  const setMark = (studentId: string, subjectId: string, val: string) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subjectId]: val } }));
  };

  const handleSave = () => {
    const entries: Mark[] = [];
    (students || []).forEach(s => {
      (exam?.subjects || []).forEach(sub => {
        const val = marks[s.studentId]?.[sub.subjectId];
        if (val !== undefined && val !== '') {
          entries.push({ studentId: s.studentId, subjectId: sub.subjectId, marksObtained: Number(val) });
        }
      });
    });
    save.mutate({ entries });
  };

  const subjects = exam?.subjects || [];

  return (
    <div>
      <PageHeader title={`Marks Entry — ${exam?.name || ''}`} description="Enter marks for each student per subject">
        <Link to="/exams"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <Button size="sm" onClick={handleSave} disabled={save.isPending || !students?.length}>
          <Save className="h-4 w-4 mr-2" />Save All Marks
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-3">
        <Label className="shrink-0">Select Class</Label>
        <Select value={classId} onValueChange={v => { setClassId(v); setMarks({}); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Choose a class…" />
          </SelectTrigger>
          <SelectContent>
            {(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {students?.length && <span className="text-sm text-muted-foreground">{students.length} students</span>}
      </div>

      {!classId ? (
        <EmptyState icon={<FileText className="h-10 w-10" />} title="Select a class to start entering marks" />
      ) : studLoading ? <LoadingSpinner /> : !students?.length ? (
        <EmptyState icon={<FileText className="h-10 w-10" />} title="No students in this class" />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] sticky left-0 bg-muted z-10">Student</TableHead>
                  {subjects.map(sub => (
                    <TableHead key={sub.subjectId} className="text-center min-w-[110px]">
                      <div>{sub.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">/{sub.maxMarks}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => {
                  let total = 0, maxTotal = 0;
                  subjects.forEach(sub => {
                    const v = parseFloat(marks[s.studentId]?.[sub.subjectId] || '0');
                    total += isNaN(v) ? 0 : v;
                    maxTotal += sub.maxMarks;
                  });
                  const grade = maxTotal > 0 ? gradeFor(total, maxTotal) : '—';
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.admissionNo}</div>
                      </TableCell>
                      {subjects.map(sub => (
                        <TableCell key={sub.subjectId} className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={sub.maxMarks}
                            className="w-20 h-8 text-center text-sm mx-auto"
                            value={marks[s.studentId]?.[sub.subjectId] ?? ''}
                            onChange={e => setMark(s.studentId, sub.subjectId, e.target.value)}
                            placeholder="—"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">
                        {total}/{maxTotal}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={['F'].includes(grade) ? 'destructive' : grade === 'D' ? 'secondary' : 'default'}>
                          {grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/exams/${examId}/report-card/${s.studentId}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">Report Card</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

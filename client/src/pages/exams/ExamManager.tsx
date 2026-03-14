import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ClassItem { id: string; classId: string; name: string; }
interface Subject { id: string; subjectId: string; name: string; classId: string; }
interface Exam { id: string; examId: string; name: string; className: string; startDate: string; endDate: string; status: string; academicYear: string; }
interface Mark { studentId: string; studentName?: string; marks: number; grade?: string; }

// ─── EXAMS TAB ─────────────────────────────────────────────────────
const examSchema = z.object({
  name: z.string().min(2), className: z.string().min(1), academicYear: z.string().min(1),
  startDate: z.string().min(1), endDate: z.string().min(1),
});
function ExamsTab() {
  const [open, setOpen] = useState(false);
  const { data: classes } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const { data: exams, isLoading } = useApiQuery<Exam[]>(['exams'], '/api/v1/exams');
  const { register, handleSubmit, control, reset } = useForm({ resolver: zodResolver(examSchema) });
  const year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const add = useApiMutation<unknown, { name: string; className: string; academicYear: string; startDate: string; endDate: string }>(
    (d) => api.post('/api/v1/exams', d).then(r => r.data),
    { successMessage: 'Exam created', invalidateKeys: [['exams']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/exams/${id}`).then(r => r.data),
    { successMessage: 'Exam deleted', invalidateKeys: [['exams']] }
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Exam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d as Parameters<typeof add.mutate>[0]))} className="space-y-3">
              <div><Label>Exam Name</Label><Input {...register('name')} placeholder="e.g. Unit Test 1" /></div>
              <div><Label>Academic Year</Label><Input defaultValue={year} {...register('academicYear')} /></div>
              <div><Label>Class</Label>
                <Controller name="className" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" {...register('startDate')} /></div>
                <div><Label>End Date</Label><Input type="date" {...register('endDate')} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingSpinner /> : !exams?.length ? <EmptyState title="No exams" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Class</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{exams.map(e => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.name}</TableCell><TableCell>{e.className}</TableCell>
              <TableCell>{e.startDate}</TableCell><TableCell>{e.endDate}</TableCell>
              <TableCell><Badge variant={e.status === 'completed' ? 'default' : 'secondary'}>{e.status}</Badge></TableCell>
              <TableCell className="text-right">
                <ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} title="Delete exam?" onConfirm={() => del.mutate(e.id)} confirmLabel="Delete" isDestructive />
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── MARKS ENTRY TAB ───────────────────────────────────────────────
function MarksTab() {
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const { data: exams } = useApiQuery<Exam[]>(['exams'], '/api/v1/exams');
  const selectedExam = exams?.find(e => e.examId === examId);
  const { data: subjects } = useApiQuery<Subject[]>(['subjects'], '/api/v1/academics/subjects', selectedExam ? { classId: selectedExam.className } : undefined, { enabled: !!selectedExam });
  const { data: students, isLoading } = useApiQuery<{ id: string; name: string; admissionNo: string }[]>(['students', selectedExam?.className], '/api/v1/students', selectedExam ? { className: selectedExam.className, limit: 100 } : undefined, { enabled: !!selectedExam });
  const { data: existingMarks } = useApiQuery<Mark[]>(['marks', examId, subjectId], '/api/v1/exams/marks', examId && subjectId ? { examId, subjectId } : undefined, { enabled: !!examId && !!subjectId });

  React.useEffect(() => {
    if (existingMarks) {
      const m: Record<string, string> = {};
      existingMarks.forEach(mk => { m[mk.studentId] = String(mk.marks); });
      setMarks(m);
    }
  }, [existingMarks]);

  const saveMutation = useApiMutation<unknown, { examId: string; subjectId: string; records: { studentId: string; marks: number; maxMarks: number }[] }>(
    (d) => api.post('/api/v1/exams/marks', d).then(r => r.data),
    { successMessage: 'Marks saved successfully', invalidateKeys: [['marks', examId, subjectId]] }
  );

  const handleSave = () => {
    if (!students?.length || !examId || !subjectId) return;
    const records = students.map(s => ({ studentId: s.id, marks: Number(marks[s.id] || 0), maxMarks: 100 }));
    saveMutation.mutate({ examId, subjectId, records });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Select Exam" /></SelectTrigger>
          <SelectContent>{(exams || []).map(e => <SelectItem key={e.id} value={e.examId}>{e.name} ({e.className})</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subjectId} onValueChange={setSubjectId} disabled={!examId}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Select Subject" /></SelectTrigger>
          <SelectContent>{(subjects || []).map(s => <SelectItem key={s.id} value={s.subjectId}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {examId && subjectId && (
        isLoading ? <LoadingSpinner /> : !students?.length ? <EmptyState title="No students" /> : (
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Admission No</TableHead><TableHead>Marks (out of 100)</TableHead></TableRow></TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell>
                      <Input type="number" min="0" max="100" className="w-24" value={marks[s.id] || ''} onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="—" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}Save Marks
              </Button>
            </div>
          </CardContent></Card>
        )
      )}
      {(!examId || !subjectId) && <EmptyState title="Select exam and subject" description="Choose an exam and subject above to enter marks." />}
    </div>
  );
}

export default function ExamManager() {
  return (
    <div>
      <PageHeader title="Exams" description="Manage exams and enter marks" />
      <Tabs defaultValue="exams">
        <TabsList className="mb-4"><TabsTrigger value="exams">Exams</TabsTrigger><TabsTrigger value="marks">Enter Marks</TabsTrigger></TabsList>
        <TabsContent value="exams"><ExamsTab /></TabsContent>
        <TabsContent value="marks"><MarksTab /></TabsContent>
      </Tabs>
    </div>
  );
}

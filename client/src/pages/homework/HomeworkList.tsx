import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, BookMarked, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

interface Submission { submissionId: string; studentName?: string; studentId: string; notes: string; submittedAt: string; }
interface ClassItem { id: string; classId: string; name: string; }
interface Subject { id: string; subjectId: string; name: string; classId: string; }

function SubmissionsDialog({ hwId, hwTitle }: { hwId: string; hwTitle: string }) {
  const { data: subs, isLoading } = useApiQuery<Submission[]>(['hw-subs', hwId], `/api/v1/homework/${hwId}/submissions`);
  return (
    <Dialog>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />Submissions</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Submissions — {hwTitle}</DialogTitle></DialogHeader>
        {isLoading ? <LoadingSpinner /> : !subs?.length ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No submissions yet</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {subs.map(s => (
              <div key={s.submissionId} className="border rounded-md p-3">
                <p className="font-medium text-sm">{s.studentName || s.studentId}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.submittedAt ? format(new Date(s.submittedAt), 'dd MMM, HH:mm') : '—'}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmitDialog({ hwId, hwTitle }: { hwId: string; hwTitle: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const submit = useApiMutation<unknown, { homeworkId: string; notes: string }>(
    (d) => api.post(`/api/v1/homework/${d.homeworkId}/submit`, { notes: d.notes }).then(r => r.data),
    { successMessage: 'Homework submitted!', onSuccess: () => { setOpen(false); setNotes(''); } }
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Send className="h-3 w-3 mr-1" />Submit</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit — {hwTitle}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Your Answer / Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Enter your answer or notes…" /></div>
          <Button className="w-full" disabled={!notes.trim() || submit.isPending} onClick={() => submit.mutate({ homeworkId: hwId, notes })}>Submit Homework</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
interface Homework { id: string; title: string; description: string; className: string; subjectId: string; dueDate: string; createdAt: string; submissions?: number; }

const hwSchema = z.object({
  title: z.string().min(2), description: z.string().min(5),
  className: z.string().min(1), subjectId: z.string().min(1),
  dueDate: z.string().min(1), maxMarks: z.string().optional(),
});

export default function HomeworkList() {
  const { role } = useAuth();
  const isTeacher = role === 'teacher' || role === 'principal' || role === 'superadmin';
  const [open, setOpen] = useState(false);
  const [classFilter, setClassFilter] = useState('');

  const { data: classes } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const [selClass, setSelClass] = useState('');
  const { data: subjects } = useApiQuery<Subject[]>(['subjects', selClass], '/api/v1/academics/subjects', selClass ? { classId: selClass } : undefined, { enabled: !!selClass });
  const { data: homework, isLoading } = useApiQuery<Homework[]>(
    ['homework', classFilter], '/api/v1/homework',
    classFilter ? { className: classFilter } : undefined
  );

  const { register, handleSubmit, control, reset } = useForm({ resolver: zodResolver(hwSchema) });

  const add = useApiMutation<unknown, { title: string; description: string; className: string; subjectId: string; dueDate: string; maxMarks?: number }>(
    (d) => api.post('/api/v1/homework', d).then(r => r.data),
    { successMessage: 'Homework assigned', invalidateKeys: [['homework']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/homework/${id}`).then(r => r.data),
    { successMessage: 'Homework deleted', invalidateKeys: [['homework']] }
  );

  const onSubmit = (data: { title: string; description: string; className: string; subjectId: string; dueDate: string; maxMarks?: string }) => {
    add.mutate({ ...data, maxMarks: data.maxMarks ? Number(data.maxMarks) : undefined });
  };

  return (
    <div>
      <PageHeader title="Homework" description={isTeacher ? 'Assign and track homework' : 'View assigned homework'}>
        {isTeacher && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Assign Homework</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div><Label>Title</Label><Input {...register('title')} /></div>
                <div><Label>Description / Instructions</Label><textarea className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[80px]" {...register('description')} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Class</Label>
                    <Controller name="className" control={control} render={({ field }) => (
                      <Select onValueChange={(v) => { field.onChange(v); const cls = classes?.find(c => c.name === v); setSelClass(cls?.classId || ''); }}>
                        <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                        <SelectContent>{(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div><Label>Subject</Label>
                    <Controller name="subjectId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                        <SelectContent>{(subjects || []).map(s => <SelectItem key={s.id} value={s.subjectId}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Due Date</Label><Input type="date" {...register('dueDate')} /></div>
                  <div><Label>Max Marks</Label><Input type="number" {...register('maxMarks')} placeholder="Optional" /></div>
                </div>
                <Button type="submit" className="w-full" disabled={add.isPending}>Assign</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="mb-4">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent><SelectItem value="">All Classes</SelectItem>{(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSpinner /> : !homework?.length ? (
        <EmptyState icon={<BookMarked className="h-10 w-10" />} title="No homework assigned" />
      ) : (
        <div className="space-y-3">
          {homework.map(hw => (
            <Card key={hw.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{hw.title}</h3>
                    <Badge variant="outline">{hw.className}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due: <span className="font-medium">{hw.dueDate}</span></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isTeacher ? (
                    <>
                      <SubmissionsDialog hwId={hw.id} hwTitle={hw.title} />
                      <ConfirmDialog
                        trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        title="Delete homework?" onConfirm={() => del.mutate(hw.id)} confirmLabel="Delete" isDestructive
                      />
                    </>
                  ) : (
                    <SubmitDialog hwId={hw.id} hwTitle={hw.title} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

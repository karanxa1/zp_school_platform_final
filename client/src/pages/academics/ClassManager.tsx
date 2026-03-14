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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface ClassItem { id: string; classId: string; name: string; order: number; }
interface Section { id: string; sectionId: string; name: string; classId: string; classTeacherUid?: string; }
interface Subject { id: string; subjectId: string; name: string; code: string; classId: string; }

// ─── CLASS FORM ────────────────────────────────────────────────────
const classSchema = z.object({ name: z.string().min(1, 'Class name required'), order: z.string() });
function ClassTab() {
  const [open, setOpen] = useState(false);
  const { data: classes, isLoading } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(classSchema) });
  const add = useApiMutation<unknown, { name: string; order: number }>(
    (d) => api.post('/api/v1/academics/classes', d).then(r => r.data),
    { successMessage: 'Class created', invalidateKeys: [['classes']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/academics/classes/${id}`).then(r => r.data),
    { successMessage: 'Class deleted', invalidateKeys: [['classes']] }
  );
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate({ name: d.name, order: Number(d.order || 0) }))} className="space-y-3">
              <div><Label>Class Name (e.g. 5th, 6th)</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
              <div><Label>Order</Label><Input type="number" {...register('order')} /></div>
              <Button type="submit" disabled={add.isPending} className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingSpinner /> : !classes?.length ? <EmptyState title="No classes" /> : (
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Order</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{classes.sort((a, b) => a.order - b.order).map(c => (
            <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.order}</TableCell>
              <TableCell className="text-right"><ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} title="Delete class?" onConfirm={() => del.mutate(c.id)} confirmLabel="Delete" isDestructive /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── SECTION TAB ───────────────────────────────────────────────────
const sectionSchema = z.object({ name: z.string().min(1), classId: z.string().min(1) });
function SectionTab() {
  const [open, setOpen] = useState(false);
  const { data: classes } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const [selClass, setSelClass] = useState('');
  const { data: sections, isLoading } = useApiQuery<Section[]>(['sections', selClass], '/api/v1/academics/sections', selClass ? { classId: selClass } : undefined);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({ resolver: zodResolver(sectionSchema) });
  const add = useApiMutation<unknown, { name: string; classId: string }>(
    (d) => api.post('/api/v1/academics/sections', d).then(r => r.data),
    { successMessage: 'Section created', invalidateKeys: [['sections']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/academics/sections/${id}`).then(r => r.data),
    { successMessage: 'Section deleted', invalidateKeys: [['sections']] }
  );
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 justify-between">
        <Select value={selClass} onValueChange={setSelClass}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter by class" /></SelectTrigger>
          <SelectContent><SelectItem value="">All Classes</SelectItem>{(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Section</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
              <div><Label>Section Name (A, B, C)</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
              <div><Label>Class</Label>
                <Controller name="classId" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" disabled={add.isPending} className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingSpinner /> : !sections?.length ? <EmptyState title="No sections" description={selClass ? 'No sections for this class.' : 'Select a class or add sections.'} /> : (
        <Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Class ID</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{sections.map(s => (
            <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell className="text-xs text-muted-foreground">{s.classId}</TableCell>
              <TableCell className="text-right"><ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} title="Delete section?" onConfirm={() => del.mutate(s.id)} confirmLabel="Delete" isDestructive /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── SUBJECT TAB ───────────────────────────────────────────────────
const subjectSchema = z.object({ name: z.string().min(1), code: z.string().min(1), classId: z.string().min(1) });
function SubjectTab() {
  const [open, setOpen] = useState(false);
  const { data: classes } = useApiQuery<ClassItem[]>(['classes'], '/api/v1/academics/classes');
  const [selClass, setSelClass] = useState('');
  const { data: subjects, isLoading } = useApiQuery<Subject[]>(['subjects', selClass], '/api/v1/academics/subjects', selClass ? { classId: selClass } : undefined);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({ resolver: zodResolver(subjectSchema) });
  const add = useApiMutation<unknown, { name: string; code: string; classId: string }>(
    (d) => api.post('/api/v1/academics/subjects', d).then(r => r.data),
    { successMessage: 'Subject created', invalidateKeys: [['subjects']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/academics/subjects/${id}`).then(r => r.data),
    { successMessage: 'Subject deleted', invalidateKeys: [['subjects']] }
  );
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 justify-between">
        <Select value={selClass} onValueChange={setSelClass}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter by class" /></SelectTrigger>
          <SelectContent><SelectItem value="">All Classes</SelectItem>{(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
              <div><Label>Subject Name</Label><Input {...register('name')} /></div>
              <div><Label>Subject Code</Label><Input {...register('code')} /></div>
              <div><Label>Class</Label>
                <Controller name="classId" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" disabled={add.isPending} className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingSpinner /> : !subjects?.length ? <EmptyState title="No subjects" /> : (
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{subjects.map(s => (
            <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell className="font-mono text-xs">{s.code}</TableCell>
              <TableCell className="text-right"><ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} title="Delete subject?" onConfirm={() => del.mutate(s.id)} confirmLabel="Delete" isDestructive /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

export default function ClassManager() {
  return (
    <div>
      <PageHeader title="Academics" description="Manage classes, sections, and subjects" />
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="classes">
            <TabsList className="mb-4">
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>
            <TabsContent value="classes"><ClassTab /></TabsContent>
            <TabsContent value="sections"><SectionTab /></TabsContent>
            <TabsContent value="subjects"><SubjectTab /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

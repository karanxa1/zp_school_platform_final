import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, Pencil, Trash2, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  gender: string;
  parentPhone: string;
  isActive: boolean;
}

interface Class { id: string; classId: string; name: string; }
interface Section { id: string; sectionId: string; name: string; classId: string; }

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  dob: z.string().min(1, 'DOB required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  className: z.string().min(1, 'Class required'),
  section: z.string().min(1, 'Section required'),
  parentName: z.string().min(2, 'Parent name required'),
  parentPhone: z.string().regex(/^\d{10}$/, '10-digit phone required'),
  address: z.string().min(5, 'Address required'),
  academicYear: z.string().min(1, 'Academic year required'),
});
type FormValues = z.infer<typeof schema>;

function StudentForm({ student, onClose }: { student?: Student & Record<string, unknown>; onClose: () => void }) {
  const isEdit = !!student;
  const { data: classes } = useApiQuery<Class[]>(['classes'], '/api/v1/academics/classes');
  const [selectedClass, setSelectedClass] = useState(student?.className || '');
  const { data: sections } = useApiQuery<Section[]>(
    ['sections', selectedClass], '/api/v1/academics/sections', { classId: selectedClass }
  );

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: student ? {
      name: student.name, gender: student.gender as 'Male' | 'Female' | 'Other',
      className: student.className, section: student.section,
      parentName: String(student.parentName || ''), parentPhone: student.parentPhone,
      address: String(student.address || ''), dob: String(student.dob || ''),
      academicYear: String(student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)),
    } : { academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` },
  });

  const addMutation = useApiMutation<unknown, FormValues>(
    (data) => api.post('/api/v1/students', data).then(r => r.data),
    { successMessage: 'Student added', invalidateKeys: [['students']], onSuccess: onClose }
  );
  const editMutation = useApiMutation<unknown, FormValues>(
    (data) => api.put(`/api/v1/students/${student?.id}`, data).then(r => r.data),
    { successMessage: 'Student updated', invalidateKeys: [['students']], onSuccess: onClose }
  );

  const onSubmit = (data: FormValues) => isEdit ? editMutation.mutate(data) : addMutation.mutate(data);
  const isPending = addMutation.isPending || editMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
      {[
        { label: 'Full Name', field: 'name', col: 2 },
        { label: 'Date of Birth', field: 'dob', type: 'date' },
        { label: 'Academic Year', field: 'academicYear' },
        { label: 'Parent Name', field: 'parentName' },
        { label: 'Parent Phone', field: 'parentPhone' },
        { label: 'Address', field: 'address', col: 2 },
      ].map(({ label, field, type, col }) => (
        <div key={field} className={`space-y-1 ${col === 2 ? 'col-span-2' : ''}`}>
          <Label>{label}</Label>
          <Input type={type || 'text'} {...register(field as keyof FormValues)} />
          {errors[field as keyof FormValues] && <p className="text-xs text-destructive">{errors[field as keyof FormValues]?.message}</p>}
        </div>
      ))}

      <div className="space-y-1">
        <Label>Gender</Label>
        <Controller name="gender" control={control} render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {['Male', 'Female', 'Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="space-y-1">
        <Label>Class</Label>
        <Controller name="className" control={control} render={({ field }) => (
          <Select onValueChange={(v) => { field.onChange(v); setSelectedClass(v); }} defaultValue={field.value}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="space-y-1">
        <Label>Section</Label>
        <Controller name="section" control={control} render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              {(sections || []).map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? <LoadingSpinner size="sm" className="mr-2" /> : null}{isEdit ? 'Update' : 'Add Student'}</Button>
      </div>
    </form>
  );
}

export default function StudentList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<(Student & Record<string, unknown>) | null>(null);

  const { data: students, isLoading } = useApiQuery<Student[]>(
    ['students', search, classFilter],
    '/api/v1/students',
    { ...(search && { search }), ...(classFilter && { className: classFilter }), limit: 50 }
  );
  const { data: classes } = useApiQuery<{ id: string; name: string }[]>(['classes'], '/api/v1/academics/classes');

  const deleteMutation = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/students/${id}`).then(r => r.data),
    { successMessage: 'Student removed', invalidateKeys: [['students']] }
  );

  const exportExcel = () => {
    if (!students?.length) return;
    const ws = XLSX.utils.json_to_sheet(students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `students_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div>
      <PageHeader title="Students" description="Manage student records">
        <Button variant="outline" size="sm" onClick={exportExcel}><Download className="h-4 w-4 mr-2" />Export</Button>
        <Dialog open={dialogOpen || !!editStudent} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditStudent(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            </DialogHeader>
            <StudentForm
              student={editStudent || undefined}
              onClose={() => { setDialogOpen(false); setEditStudent(null); qc.invalidateQueries({ queryKey: ['students'] }); }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name or admission no…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? <LoadingSpinner /> : !students?.length ? (
            <EmptyState title="No students found" description="Add your first student to get started." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adm. No</TableHead><TableHead>Name</TableHead>
                  <TableHead>Class</TableHead><TableHead>Section</TableHead>
                  <TableHead>Gender</TableHead><TableHead>Parent Phone</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.className}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>{s.parentPhone}</TableCell>
                    <TableCell><Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/students/${s.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditStudent(s as Student & Record<string, unknown>)}><Pencil className="h-4 w-4" /></Button>
                      <ConfirmDialog
                        trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        title="Remove student?"
                        description={`This will deactivate ${s.name}'s record.`}
                        onConfirm={() => deleteMutation.mutate(s.id)}
                        confirmLabel="Remove"
                        isDestructive
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

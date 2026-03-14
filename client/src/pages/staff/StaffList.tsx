import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
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
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Staff {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  designation: z.string().min(2, 'Designation required'),
  department: z.string().min(2, 'Department required'),
  phone: z.string().regex(/^\d{10}$/, '10-digit phone required'),
  email: z.string().email('Valid email required'),
  salary: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  qualification: z.string().min(2, 'Qualification required'),
});
type FormValues = z.infer<typeof schema>;

const DEPARTMENTS = ['Teaching', 'Administration', 'Accounts', 'Library', 'Sports', 'Hostel', 'Transport', 'IT'];

function StaffForm({ staff, onClose }: { staff?: Staff & Record<string, unknown>; onClose: () => void }) {
  const isEdit = !!staff;
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: staff ? {
      name: staff.name, designation: staff.designation, department: staff.department,
      phone: staff.phone, email: staff.email, gender: staff.gender as 'Male' | 'Female' | 'Other',
      joiningDate: String(staff.joiningDate || ''), qualification: String(staff.qualification || ''),
    } : {},
  });

  const addMutation = useApiMutation<unknown, FormValues>(
    (data) => api.post('/api/v1/staff', data).then(r => r.data),
    { successMessage: 'Staff member added', invalidateKeys: [['staff']], onSuccess: onClose }
  );
  const editMutation = useApiMutation<unknown, FormValues>(
    (data) => api.put(`/api/v1/staff/${staff?.id}`, data).then(r => r.data),
    { successMessage: 'Staff updated', invalidateKeys: [['staff']], onSuccess: onClose }
  );

  const onSubmit = (data: FormValues) => isEdit ? editMutation.mutate(data) : addMutation.mutate(data);
  const isPending = addMutation.isPending || editMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
      {[
        { label: 'Full Name', field: 'name', col: 2 },
        { label: 'Designation', field: 'designation' },
        { label: 'Qualification', field: 'qualification' },
        { label: 'Phone', field: 'phone' },
        { label: 'Email', field: 'email', type: 'email' },
        { label: 'Salary', field: 'salary', type: 'number' },
        { label: 'Joining Date', field: 'joiningDate', type: 'date' },
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
            <SelectContent>{['Male', 'Female', 'Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        )} />
      </div>

      <div className="space-y-1">
        <Label>Department</Label>
        <Controller name="department" control={control} render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        )} />
      </div>

      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <LoadingSpinner size="sm" className="mr-2" />}{isEdit ? 'Update' : 'Add Staff'}
        </Button>
      </div>
    </form>
  );
}

export default function StaffList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<(Staff & Record<string, unknown>) | null>(null);

  const { data: staff, isLoading } = useApiQuery<Staff[]>(
    ['staff', search, deptFilter],
    '/api/v1/staff',
    { ...(search && { search }), ...(deptFilter && { department: deptFilter }), limit: 50 }
  );

  const deleteMutation = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/staff/${id}`).then(r => r.data),
    { successMessage: 'Staff member removed', invalidateKeys: [['staff']] }
  );

  const closeDialog = () => { setDialogOpen(false); setEditStaff(null); qc.invalidateQueries({ queryKey: ['staff'] }); };

  return (
    <div>
      <PageHeader title="Staff" description="Manage staff records">
        <Dialog open={dialogOpen || !!editStaff} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditStaff(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle></DialogHeader>
            <StaffForm staff={editStaff || undefined} onClose={closeDialog} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? <LoadingSpinner /> : !staff?.length ? (
            <EmptyState title="No staff records" description="Add staff members to get started." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emp. Code</TableHead><TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead><TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead><TableHead>Email</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.employeeCode}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.designation}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell className="text-xs">{s.email}</TableCell>
                    <TableCell><Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditStaff(s as Staff & Record<string, unknown>)}><Pencil className="h-4 w-4" /></Button>
                      <ConfirmDialog
                        trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        title="Remove staff member?"
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

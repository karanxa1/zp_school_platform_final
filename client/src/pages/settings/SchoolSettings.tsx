import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Settings, ClipboardList, Award, IndianRupee, Pencil, Check } from 'lucide-react';
import { format } from 'date-fns';

interface SchoolProfile { name: string; address: string; phone: string; email: string; logo?: string; }
interface AcademicYear { id: string; yearId: string; label: string; startDate: string; endDate: string; isActive: boolean; }
interface AuditLog { id: string; action: string; performedBy?: string; actorUid?: string; targetCollection: string; targetId: string; timestamp?: string; createdAt?: string; }
interface Grade { grade: string; minPercent: number; }
interface FeeComponent { id: string; componentId: string; name: string; amount: number; dueDate: string; className: string; }

const profileSchema = z.object({ name: z.string().min(2), address: z.string().min(5), phone: z.string(), email: z.string().email() });
const yearSchema = z.object({ label: z.string().min(4), startDate: z.string().min(1), endDate: z.string().min(1) });
const feeCompSchema = z.object({ name: z.string().min(2), amount: z.coerce.number().min(1), dueDate: z.string().min(1), className: z.string().min(1) });

// ── Profile ─────────────────────────────────────────────────────────────────
function ProfileTab() {
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading } = useApiQuery<SchoolProfile>(['school-profile'], '/api/v1/settings/school');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(profileSchema), values: profile });
  const save = useApiMutation<unknown, SchoolProfile>(
    (d) => api.put('/api/v1/settings/school', d).then(r => r.data),
    { successMessage: 'School profile saved', invalidateKeys: [['school-profile']], onSuccess: () => setEditing(false) }
  );
  return isLoading ? <LoadingSpinner /> : (
    <Card><CardContent className="p-6">
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold text-lg">School Profile</h3>
        {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>}
      </div>
      {editing ? (
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-3 max-w-md">
          {(['name', 'address', 'phone', 'email'] as const).map((f) => (
            <div key={f}><Label>{f.charAt(0).toUpperCase() + f.slice(1)}</Label><Input {...register(f)} />{errors[f] && <p className="text-xs text-destructive">{errors[f]?.message}</p>}</div>
          ))}
          <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>Save</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
        </form>
      ) : (
        <div className="space-y-2 text-sm">
          {[['School Name', profile?.name], ['Address', profile?.address], ['Phone', profile?.phone], ['Email', profile?.email]].map(([l, v]) => (
            <div key={l} className="flex gap-3"><span className="text-muted-foreground w-28 shrink-0">{l}</span><span className="font-medium">{v || '—'}</span></div>
          ))}
        </div>
      )}
    </CardContent></Card>
  );
}

// ── Academic Years ───────────────────────────────────────────────────────────
function AcademicYearsTab() {
  const [open, setOpen] = useState(false);
  const { data: years, isLoading } = useApiQuery<AcademicYear[]>(['academic-years'], '/api/v1/settings/academic-years');
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(yearSchema) });
  const add = useApiMutation<unknown, { label: string; startDate: string; endDate: string }>(
    (d) => api.post('/api/v1/settings/academic-years', d).then(r => r.data),
    { successMessage: 'Academic year created', invalidateKeys: [['academic-years']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const setActive = useApiMutation<unknown, string>(
    (yearId) => api.put(`/api/v1/settings/academic-years/${yearId}/activate`).then(r => r.data),
    { successMessage: 'Active year updated', invalidateKeys: [['academic-years']] }
  );
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Year</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Academic Year</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
              <div><Label>Label (e.g. 2025-2026)</Label><Input {...register('label')} placeholder="2025-2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" {...register('startDate')} /></div>
                <div><Label>End Date</Label><Input type="date" {...register('endDate')} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingSpinner /> : !years?.length ? <EmptyState title="No academic years" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{years.map(y => (
            <TableRow key={y.id}>
              <TableCell className="font-medium">{y.label}</TableCell>
              <TableCell>{y.startDate}</TableCell><TableCell>{y.endDate}</TableCell>
              <TableCell><Badge variant={y.isActive ? 'default' : 'secondary'}>{y.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
              <TableCell className="text-right">{!y.isActive && <Button size="sm" variant="outline" onClick={() => setActive.mutate(y.yearId)}><Check className="h-3 w-3 mr-1" />Set Active</Button>}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ── Grades Config ─────────────────────────────────────────────────────────
const DEFAULT_GRADES: Grade[] = [
  { grade: 'A+', minPercent: 90 }, { grade: 'A', minPercent: 80 }, { grade: 'B+', minPercent: 70 },
  { grade: 'B', minPercent: 60 }, { grade: 'C', minPercent: 50 }, { grade: 'D', minPercent: 40 }, { grade: 'F', minPercent: 0 },
];

function GradesTab() {
  const { data: grades, isLoading } = useApiQuery<Grade[]>(['grade-config'], '/api/v1/settings/grades');
  const [local, setLocal] = useState<Grade[]>(DEFAULT_GRADES);
  React.useEffect(() => { if (grades?.length) setLocal(grades); }, [grades]);

  const save = useApiMutation<unknown, Grade[]>(
    (d) => api.put('/api/v1/settings/grades', { grades: d }).then(r => r.data),
    { successMessage: 'Grade thresholds saved', invalidateKeys: [['grade-config']] }
  );

  return (
    <div className="space-y-4">
      {isLoading ? <LoadingSpinner /> : (
        <>
          <p className="text-sm text-muted-foreground">Set the minimum percentage for each grade. Students scoring ≥ the threshold receive that grade.</p>
          <Table>
            <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Min Percentage (%)</TableHead></TableRow></TableHeader>
            <TableBody>{local.map((g, i) => (
              <TableRow key={g.grade}>
                <TableCell><Badge className="text-sm font-bold w-10 justify-center">{g.grade}</Badge></TableCell>
                <TableCell>
                  <Input type="number" min={0} max={100} value={g.minPercent}
                    onChange={e => setLocal(prev => prev.map((x, j) => j === i ? { ...x, minPercent: Number(e.target.value) } : x))}
                    className="w-24" />
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
          <Button onClick={() => save.mutate(local)} disabled={save.isPending}>
            <Award className="h-4 w-4 mr-2" />Save Grade Config
          </Button>
        </>
      )}
    </div>
  );
}

// ── Fee Structure ─────────────────────────────────────────────────────────
function FeeStructureTab() {
  const [open, setOpen] = useState(false);
  const { data: components, isLoading } = useApiQuery<FeeComponent[]>(['fee-structure'], '/api/v1/fees/structure');
  const { data: classes } = useApiQuery<{ id: string; name: string }[]>(['classes'], '/api/v1/academics/classes');
  const { register, handleSubmit, control, reset } = useForm<z.infer<typeof feeCompSchema>>({ resolver: zodResolver(feeCompSchema) });

  const add = useApiMutation<unknown, z.infer<typeof feeCompSchema>>(
    (d) => api.post('/api/v1/fees/structure', d).then(r => r.data),
    { successMessage: 'Fee component added', invalidateKeys: [['fee-structure']], onSuccess: () => { reset(); setOpen(false); } }
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Component</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Fee Component</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => add.mutate(d))} className="space-y-3">
              <div><Label>Name</Label><Input {...register('name')} placeholder="Tuition Fee" /></div>
              <div><Label>Amount (₹)</Label><Input type="number" {...register('amount')} /></div>
              <div><Label>Due Date</Label><Input type="date" {...register('dueDate')} /></div>
              <div>
                <Label>Class</Label>
                <Controller name="className" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Fee Component</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <LoadingSpinner /> : !components?.length ? (
        <EmptyState icon={<IndianRupee className="h-10 w-10" />} title="No fee components defined" description="Add fee components to define the fee structure" />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Component</TableHead><TableHead>Class</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
          <TableBody>{components.map(fc => (
            <TableRow key={fc.id}><TableCell className="font-medium">{fc.name}</TableCell><TableCell>{fc.className}</TableCell><TableCell>₹{fc.amount.toLocaleString()}</TableCell><TableCell>{fc.dueDate}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────
function AuditLogTab() {
  const { data: logs, isLoading } = useApiQuery<AuditLog[]>(['audit-logs'], '/api/v1/settings/audit-logs', { limit: 50 });
  return isLoading ? <LoadingSpinner /> : !logs?.length ? <EmptyState title="No audit logs" /> : (
    <Table>
      <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Performed By</TableHead><TableHead>Target</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
      <TableBody>{logs.map(l => {
        const ts = l.createdAt || l.timestamp;
        return (
          <TableRow key={l.id}>
            <TableCell><Badge variant="outline" className="capitalize">{l.action}</Badge></TableCell>
            <TableCell className="text-xs">{l.performedBy || l.actorUid || '—'}</TableCell>
            <TableCell className="text-xs">{l.targetCollection} / {l.targetId}</TableCell>
            <TableCell className="text-xs">{ts ? format(new Date(ts), 'dd MMM yyyy, HH:mm') : '—'}</TableCell>
          </TableRow>
        );
      })}</TableBody>
    </Table>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SchoolSettings() {
  return (
    <div>
      <PageHeader title="Settings" description="School profile, academic years, grades, fee structure, and system logs" />
      <Tabs defaultValue="profile">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile"><Settings className="h-3 w-3 mr-1" />Profile</TabsTrigger>
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="grades"><Award className="h-3 w-3 mr-1" />Grades</TabsTrigger>
          <TabsTrigger value="fees"><IndianRupee className="h-3 w-3 mr-1" />Fee Structure</TabsTrigger>
          <TabsTrigger value="audit"><ClipboardList className="h-3 w-3 mr-1" />Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="years"><Card><CardContent className="p-4"><AcademicYearsTab /></CardContent></Card></TabsContent>
        <TabsContent value="grades"><Card><CardContent className="p-4"><GradesTab /></CardContent></Card></TabsContent>
        <TabsContent value="fees"><Card><CardContent className="p-4"><FeeStructureTab /></CardContent></Card></TabsContent>
        <TabsContent value="audit"><Card><CardContent className="p-4"><AuditLogTab /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}

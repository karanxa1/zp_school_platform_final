import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { CalendarOff, Plus, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Leave {
  leaveId: string; staffId: string; staffName?: string; leaveType: string;
  fromDate: string; toDate: string; reason: string; status: 'pending' | 'approved' | 'rejected'; remarks?: string;
}
type LeaveForm = { leaveType: string; fromDate: string; toDate: string; reason: string; };

const STATUS_BADGES: Record<string, 'default' | 'destructive' | 'secondary'> = {
  approved: 'default', rejected: 'destructive', pending: 'secondary',
};

function ApplyLeaveTab() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { data: leaves, isLoading } = useApiQuery<Leave[]>(['my-leaves'], '/api/v1/attendance/leaves/my');
  const { register, handleSubmit, control, reset } = useForm<LeaveForm>();

  const apply = useApiMutation<unknown, LeaveForm>(
    (d) => api.post('/api/v1/attendance/leaves', d).then(r => r.data),
    { successMessage: 'Leave application submitted', invalidateKeys: [['my-leaves']], onSuccess: () => { reset(); setOpen(false); } }
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Apply Leave</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => apply.mutate(d))} className="space-y-3">
              <div>
                <Label>Leave Type</Label>
                <Controller name="leaveType" control={control} defaultValue="casual" render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['casual', 'sick', 'earned', 'maternity', 'other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From Date</Label><Input type="date" {...register('fromDate', { required: true })} /></div>
                <div><Label>To Date</Label><Input type="date" {...register('toDate', { required: true })} /></div>
              </div>
              <div><Label>Reason</Label><Textarea {...register('reason', { required: true })} rows={3} /></div>
              <Button type="submit" className="w-full" disabled={apply.isPending}>Submit Application</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <LoadingSpinner /> : !leaves?.length ? (
        <EmptyState icon={<CalendarOff className="h-10 w-10" />} title="No leave applications" description="Apply for leave using the button above" />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
          <TableBody>{leaves.map(l => (
            <TableRow key={l.leaveId}>
              <TableCell className="capitalize">{l.leaveType}</TableCell>
              <TableCell>{formatDate(l.fromDate)}</TableCell>
              <TableCell>{formatDate(l.toDate)}</TableCell>
              <TableCell className="max-w-[160px] truncate">{l.reason}</TableCell>
              <TableCell><Badge variant={STATUS_BADGES[l.status]} className="capitalize">{l.status}</Badge></TableCell>
              <TableCell className="text-muted-foreground text-xs">{l.remarks || '—'}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

function ManageLeavesTab() {
  const { data: leaves, isLoading } = useApiQuery<Leave[]>(['all-leaves'], '/api/v1/attendance/leaves');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const approve = useApiMutation<unknown, { id: string; remarks: string }>(
    ({ id, remarks }) => api.patch(`/api/v1/attendance/leaves/${id}`, { status: 'approved', remarks }).then(r => r.data),
    { successMessage: 'Leave approved', invalidateKeys: [['all-leaves']] }
  );
  const reject = useApiMutation<unknown, { id: string; remarks: string }>(
    ({ id, remarks }) => api.patch(`/api/v1/attendance/leaves/${id}`, { status: 'rejected', remarks }).then(r => r.data),
    { successMessage: 'Leave rejected', invalidateKeys: [['all-leaves']] }
  );

  if (isLoading) return <LoadingSpinner />;
  if (!leaves?.length) return <EmptyState icon={<CalendarOff className="h-10 w-10" />} title="No leave applications" />;

  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Staff</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead><TableHead>Action</TableHead></TableRow>
      </TableHeader>
      <TableBody>{leaves.map(l => (
        <TableRow key={l.leaveId}>
          <TableCell className="font-medium text-sm">{l.staffName || l.staffId}</TableCell>
          <TableCell className="capitalize">{l.leaveType}</TableCell>
          <TableCell>{formatDate(l.fromDate)}</TableCell>
          <TableCell>{formatDate(l.toDate)}</TableCell>
          <TableCell className="max-w-[120px] truncate text-sm">{l.reason}</TableCell>
          <TableCell><Badge variant={STATUS_BADGES[l.status]} className="capitalize">{l.status}</Badge></TableCell>
          <TableCell>
            {l.status === 'pending' && (
              <Input placeholder="Remarks…" className="h-7 text-xs w-28"
                value={remarksMap[l.leaveId] || ''}
                onChange={e => setRemarksMap(m => ({ ...m, [l.leaveId]: e.target.value }))}
              />
            )}
          </TableCell>
          <TableCell>
            {l.status === 'pending' && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => approve.mutate({ id: l.leaveId, remarks: remarksMap[l.leaveId] || '' })}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => reject.mutate({ id: l.leaveId, remarks: remarksMap[l.leaveId] || '' })}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TableCell>
        </TableRow>
      ))}</TableBody>
    </Table>
  );
}

export default function LeaveManager() {
  const { role } = useAuth();
  const isAdmin = role === 'superadmin' || role === 'principal';

  return (
    <div>
      <PageHeader title="Leave Management" description="Apply and manage staff leave applications" />
      {isAdmin ? (
        <Tabs defaultValue="manage">
          <TabsList className="mb-4">
            <TabsTrigger value="manage">All Applications</TabsTrigger>
            <TabsTrigger value="apply">My Leaves</TabsTrigger>
          </TabsList>
          <TabsContent value="manage"><Card><CardContent className="p-4 overflow-x-auto"><ManageLeavesTab /></CardContent></Card></TabsContent>
          <TabsContent value="apply"><Card><CardContent className="p-4"><ApplyLeaveTab /></CardContent></Card></TabsContent>
        </Tabs>
      ) : (
        <Card><CardContent className="p-4"><ApplyLeaveTab /></CardContent></Card>
      )}
    </div>
  );
}

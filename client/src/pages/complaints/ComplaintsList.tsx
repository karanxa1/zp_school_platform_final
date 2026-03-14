import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Complaint { id: string; complaintId: string; title: string; description: string; category: string; status: string; priority: string; submittedBy: string; assignedTo?: string; createdAt: string; resolution?: string; }

const STATUS_COLORS: Record<string, string> = { open: 'bg-blue-500/20 text-blue-700', pending: 'bg-yellow-500/20 text-yellow-700', resolved: 'bg-green-500/20 text-green-700', closed: 'bg-muted text-muted-foreground' };
const CATEGORIES = ['Academic', 'Infrastructure', 'Staff', 'Administration', 'Transport', 'Hostel', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'pending', 'resolved', 'closed'];

export default function ComplaintsList() {
  const { user, role } = useAuth();
  const isAdmin = role === 'principal' || role === 'superadmin';
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');

  const { data: complaints, isLoading } = useApiQuery<Complaint[]>(
    ['complaints', statusFilter, user?.uid || ''],
    '/api/v1/complaints',
    { ...(statusFilter && { status: statusFilter }), ...(isAdmin ? {} : { userId: user?.uid }) }
  );

  const { register, handleSubmit, control, reset } = useForm<{ title: string; description: string; category: string; priority: string }>();

  const submit = useApiMutation<unknown, { title: string; description: string; category: string; priority: string }>(
    (d) => api.post('/api/v1/complaints', d).then(r => r.data),
    { successMessage: 'Complaint submitted', invalidateKeys: [['complaints']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const updateStatus = useApiMutation<unknown, { id: string; status: string; resolution?: string }>(
    ({ id, ...d }) => api.put(`/api/v1/complaints/${id}/status`, d).then(r => r.data),
    { successMessage: 'Status updated', invalidateKeys: [['complaints']], onSuccess: () => setSelectedComplaint(null) }
  );

  return (
    <div>
      <PageHeader title="Complaints" description={isAdmin ? "Manage and resolve complaints" : "Submit and track your complaints"}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />New Complaint</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Complaint</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => submit.mutate(d))} className="space-y-3">
              <div><Label>Title</Label><Input {...register('title', { required: true })} /></div>
              <div><Label>Description</Label><textarea className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[100px]" {...register('description', { required: true })} /></div>
              <div><Label>Category</Label>
                <Controller name="category" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div><Label>Priority</Label>
                <Controller name="priority" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={submit.isPending}>Submit Complaint</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent><SelectItem value="">All</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSpinner /> : !complaints?.length ? (
        <EmptyState icon={<MessageSquare className="h-10 w-10" />} title="No complaints" description="No complaints found for the selected filter." />
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedComplaint(c)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold">{c.title}</h3>
                      <Badge className={STATUS_COLORS[c.status] || ''}>{c.status}</Badge>
                      <Badge variant="outline" className="text-xs">{c.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{c.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin update dialog */}
      {isAdmin && selectedComplaint && (
        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Update Complaint — {selectedComplaint.title}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{selectedComplaint.description}</p>
              <div><Label>Resolution / Remarks</Label><textarea className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[80px]" value={resolution} onChange={e => setResolution(e.target.value)} /></div>
              <div className="flex gap-2">
                {['pending', 'resolved', 'closed'].map(s => (
                  <Button key={s} size="sm" variant={selectedComplaint.status === s ? 'default' : 'outline'} disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: selectedComplaint.id, status: s, resolution })}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

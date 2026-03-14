import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Notice { id: string; noticeId: string; title: string; content: string; targetRoles: string[]; createdAt: string; }
interface Event { id: string; eventId: string; title: string; description: string; date: string; location: string; }

const ROLES = ['all', 'teacher', 'student', 'parent', 'staff'];

function NoticesTab() {
  const { role } = useAuth();
  const canCreate = role === 'principal' || role === 'superadmin';
  const [open, setOpen] = useState(false);
  const { data: notices, isLoading } = useApiQuery<Notice[]>(['notices'], '/api/v1/communication/notices');
  const { register, handleSubmit, control, reset } = useForm<{ title: string; content: string; targetRoles: string }>();

  const add = useApiMutation<unknown, { title: string; content: string; targetRoles: string[] }>(
    (d) => api.post('/api/v1/communication/notices', d).then(r => r.data),
    { successMessage: 'Notice posted', invalidateKeys: [['notices']], onSuccess: () => { reset(); setOpen(false); } }
  );

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Post Notice</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post New Notice</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((d) => add.mutate({ ...d, targetRoles: [d.targetRoles] }))} className="space-y-3">
                <div><Label>Title</Label><Input {...register('title', { required: true })} /></div>
                <div><Label>Content</Label><textarea className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[100px]" {...register('content', { required: true })} /></div>
                <div><Label>Target Audience</Label>
                  <Controller name="targetRoles" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                      <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r === 'all' ? 'Everyone' : r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={add.isPending}>Post Notice</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {isLoading ? <LoadingSpinner /> : !notices?.length ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="No notices" />
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold">{n.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    {n.targetRoles.map(r => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsTab() {
  const { role } = useAuth();
  const canCreate = role === 'principal' || role === 'superadmin';
  const [open, setOpen] = useState(false);
  const { data: events, isLoading } = useApiQuery<Event[]>(['events'], '/api/v1/communication/events');
  const { register, handleSubmit, reset } = useForm<{ title: string; description: string; date: string; location: string }>();

  const add = useApiMutation<unknown, { title: string; description: string; date: string; location: string }>(
    (d) => api.post('/api/v1/communication/events', d).then(r => r.data),
    { successMessage: 'Event created', invalidateKeys: [['events']], onSuccess: () => { reset(); setOpen(false); } }
  );

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
                {([['title', 'Event Title', 'text'], ['description', 'Description', 'text'], ['date', 'Date', 'date'], ['location', 'Location', 'text']] as [string, string, string][]).map(([f, l, t]) => (
                  <div key={f}><Label>{l}</Label><Input type={t} {...register(f as 'title' | 'description' | 'date' | 'location')} /></div>
                ))}
                <Button type="submit" className="w-full" disabled={add.isPending}>Create Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {isLoading ? <LoadingSpinner /> : !events?.length ? (
        <EmptyState icon={<Calendar className="h-10 w-10" />} title="No events" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map(e => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-primary" /><h3 className="font-semibold">{e.title}</h3></div>
                <p className="text-sm text-muted-foreground mb-2">{e.description}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{e.date}</span><span>·</span><span>{e.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoticeBoard() {
  return (
    <div>
      <PageHeader title="Communication" description="Notices and school events" />
      <Tabs defaultValue="notices">
        <TabsList className="mb-4"><TabsTrigger value="notices">Notices</TabsTrigger><TabsTrigger value="events">Events</TabsTrigger></TabsList>
        <TabsContent value="notices"><NoticesTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

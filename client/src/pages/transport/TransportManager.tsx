import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Bus } from 'lucide-react';

interface Route { id: string; routeId: string; routeName: string; vehicleNo: string; driverName: string; driverPhone: string; stops: string[]; }

const schema = z.object({
  routeName: z.string().min(2), vehicleNo: z.string().min(4),
  driverName: z.string().min(2), driverPhone: z.string().regex(/^\d{10}$/),
  stops: z.string().min(2),
});

export default function TransportManager() {
  const [open, setOpen] = useState(false);
  const { data: routes, isLoading } = useApiQuery<Route[]>(['routes'], '/api/v1/transport/routes');
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema) });

  const add = useApiMutation<unknown, { routeName: string; vehicleNo: string; driverName: string; driverPhone: string; stops: string[] }>(
    (d) => api.post('/api/v1/transport/routes', d).then(r => r.data),
    { successMessage: 'Route created', invalidateKeys: [['routes']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/transport/routes/${id}`).then(r => r.data),
    { successMessage: 'Route deleted', invalidateKeys: [['routes']] }
  );

  const onSubmit = (data: { routeName: string; vehicleNo: string; driverName: string; driverPhone: string; stops: string }) => {
    add.mutate({ ...data, stops: data.stops.split(',').map(s => s.trim()).filter(Boolean) });
  };

  return (
    <div>
      <PageHeader title="Transport" description="Manage bus routes and drivers">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Route</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Transport Route</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {[['routeName', 'Route Name'], ['vehicleNo', 'Vehicle No'], ['driverName', 'Driver Name'], ['driverPhone', 'Driver Phone']].map(([f, l]) => (
                <div key={f}><Label>{l}</Label><Input {...register(f as keyof typeof schema.shape)} /></div>
              ))}
              <div><Label>Stops (comma-separated)</Label><Input {...register('stops')} placeholder="Stop A, Stop B, Stop C" /></div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Create Route</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingSpinner /> : !routes?.length ? (
        <EmptyState icon={<Bus className="h-10 w-10" />} title="No routes" description="Add transport routes to get started." />
      ) : (
        <div className="space-y-4">
          {routes.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bus className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{r.routeName}</h3>
                    <span className="text-xs text-muted-foreground font-mono">{r.vehicleNo}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Driver: <span className="text-foreground">{r.driverName}</span> · {r.driverPhone}</p>
                  {r.stops?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.stops.map((s, i) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  )}
                </div>
                <ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>} title="Delete route?" onConfirm={() => del.mutate(r.id)} confirmLabel="Delete" isDestructive />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

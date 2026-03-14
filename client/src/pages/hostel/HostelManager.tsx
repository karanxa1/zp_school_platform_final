import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Building, Users, Bed } from 'lucide-react';

interface Room { roomId: string; roomNumber: string; blockName: string; floor: string; capacity: number; occupiedBy: string[]; type: string; }

type RoomForm = { roomNumber: string; blockName: string; floor: string; capacity: number; type: string; };

export default function HostelManager() {
  const [open, setOpen] = useState(false);
  const { data: rooms, isLoading } = useApiQuery<Room[]>(['rooms'], '/api/v1/hostel/rooms');
  const { register, handleSubmit, control, reset } = useForm<RoomForm>({ defaultValues: { type: 'double', capacity: 2 } });

  const add = useApiMutation<unknown, RoomForm>(
    (d) => api.post('/api/v1/hostel/rooms', d).then(r => r.data),
    { successMessage: 'Room added', invalidateKeys: [['rooms']], onSuccess: () => { reset(); setOpen(false); } }
  );

  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/hostel/rooms/${id}`).then(r => r.data),
    { successMessage: 'Room removed', invalidateKeys: [['rooms']] }
  );

  const totalCapacity = Array.isArray(rooms) ? rooms.reduce((s, r) => s + r.capacity, 0) : 0;
  const totalOccupied = Array.isArray(rooms) ? rooms.reduce((s, r) => s + (r.occupiedBy?.length || 0), 0) : 0;

  return (
    <div>
      <PageHeader title="Hostel" description="Room management and occupancy" />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Rooms', val: Array.isArray(rooms) ? rooms.length : 0, icon: Building },
          { label: 'Total Capacity', val: totalCapacity, icon: Bed },
          { label: 'Occupied', val: totalOccupied, icon: Users },
        ].map(({ label, val, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="h-8 w-8 text-primary opacity-80" />
              <div><p className="text-2xl font-bold">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Room Dialog */}
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Room</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Hostel Room</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate({ ...d, capacity: Number(d.capacity) }))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Room Number</Label><Input {...register('roomNumber', { required: true })} placeholder="A-101" /></div>
                <div><Label>Block Name</Label><Input {...register('blockName', { required: true })} placeholder="Block A" /></div>
                <div><Label>Floor</Label><Input {...register('floor')} placeholder="Ground" /></div>
                <div><Label>Capacity</Label><Input type="number" {...register('capacity')} /></div>
              </div>
              <div>
                <Label>Room Type</Label>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['single', 'double', 'dormitory'].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Room</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rooms Grid */}
      {isLoading ? <LoadingSpinner /> : !rooms?.length ? (
        <EmptyState icon={<Building className="h-10 w-10" />} title="No rooms configured" description="Add hostel rooms to get started" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(r => {
            const occupied = r.occupiedBy?.length || 0;
            const pct = Math.round((occupied / r.capacity) * 100);
            const isFull = occupied >= r.capacity;
            return (
              <Card key={r.roomId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base">{r.roomNumber}</h3>
                      <p className="text-xs text-muted-foreground">{r.blockName} · Floor {r.floor}</p>
                    </div>
                    <Badge variant={isFull ? 'destructive' : 'outline'}>{r.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-secondary rounded-full h-1.5">
                      <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{occupied}/{r.capacity}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => del.mutate(r.roomId)} disabled={del.isPending}>
                    Remove
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

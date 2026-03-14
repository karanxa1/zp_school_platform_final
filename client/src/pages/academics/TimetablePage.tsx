import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { useForm, Controller } from 'react-hook-form';
import { CalendarDays, Plus } from 'lucide-react';

interface TimetableEntry {
  id: string;
  entryId: string;
  classId: string;
  day: string;
  period: number;
  subjectId: string;
  subjectName?: string;
  teacherName?: string;
  startTime?: string;
  endTime?: string;
}

interface EntryForm { day: string; period: string; subjectId: string; teacherId?: string; startTime: string; endTime: string; }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const DAY_SHORT: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const PERIOD_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-orange-50 border-orange-200 text-orange-800',
];

export default function TimetablePage() {
  const { role } = useAuth();
  const [classId, setClassId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const isAdmin = role === 'superadmin' || role === 'principal';

  const { data: classes } = useApiQuery<{ id: string; classId: string; name: string }[]>(['classes'], '/api/v1/academics/classes');
  const { data: subjects } = useApiQuery<{ id: string; subjectId: string; name: string; classId: string }[]>(
    ['subjects', classId], '/api/v1/academics/subjects', { classId }, { enabled: !!classId }
  );
  const { data: timetable, isLoading, refetch } = useApiQuery<TimetableEntry[]>(
    ['timetable', classId], '/api/v1/academics/timetable', { classId }, { enabled: !!classId }
  );

  const { register, handleSubmit, control, reset } = useForm<EntryForm>();

  const add = useApiMutation<unknown, EntryForm & { classId: string }>(
    (d) => api.post('/api/v1/academics/timetable', d).then(r => r.data),
    { successMessage: 'Period added', invalidateKeys: [['timetable', classId]], onSuccess: () => { reset(); setAddOpen(false); } }
  );

  // Build lookup map: entries[day][period] = entry
  const entryMap: Record<string, Record<number, TimetableEntry>> = {};
  (timetable || []).forEach(e => {
    if (!entryMap[e.day]) entryMap[e.day] = {};
    entryMap[e.day][e.period] = e;
  });

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly class schedule">
        {isAdmin && classId && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Period</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(d => add.mutate({ ...d, classId }))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Day</Label>
                    <Controller name="day" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label>Period</Label>
                    <Controller name="period" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                        <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Controller name="subjectId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                      <SelectContent>{(subjects || []).map(s => <SelectItem key={s.id} value={s.subjectId}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Time</Label><Input type="time" {...register('startTime')} /></div>
                  <div><Label>End Time</Label><Input type="time" {...register('endTime')} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={add.isPending}>Add Period</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="mb-4 flex items-center gap-3">
        <Label className="shrink-0">Class</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select class…" /></SelectTrigger>
          <SelectContent>
            {(classes || []).map(c => <SelectItem key={c.id} value={c.classId}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!classId ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="Select a class to view its timetable" />
      ) : isLoading ? <LoadingSpinner /> : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border/50 px-3 py-2 text-left font-semibold w-20">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="border border-border/50 px-3 py-2 text-center font-semibold min-w-[100px]">{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p => (
                  <tr key={p} className="hover:bg-muted/20">
                    <td className="border border-border/50 px-3 py-2 font-medium text-center bg-muted/30">P{p}</td>
                    {DAYS.map(d => {
                      const entry = entryMap[d]?.[p];
                      return (
                        <td key={d} className="border border-border/50 px-2 py-1.5 text-center">
                          {entry ? (
                            <div className={`rounded px-2 py-1 border text-xs ${PERIOD_COLORS[(p - 1) % PERIOD_COLORS.length]}`}>
                              <div className="font-semibold">{entry.subjectName || entry.subjectId}</div>
                              {entry.teacherName && <div className="opacity-70 text-[10px]">{entry.teacherName}</div>}
                              {entry.startTime && <div className="opacity-60 text-[10px]">{entry.startTime}–{entry.endTime}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

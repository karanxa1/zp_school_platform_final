import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, IndianRupee, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FeeRecord { id: string; studentId: string; studentName: string; feeType: string; amount: number; paidAmount: number; balance: number; dueDate: string; status: string; className: string; }
interface Student { id: string; name: string; admissionNo: string; className: string; }
interface FeeStructure { id: string; className: string; academicYear: string; fees: { type: string; amount: number; dueDate: string }[]; }

// ─── FEE COLLECTION ────────────────────────────────────────────────
function FeeCollectionTab() {
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [collectOpen, setCollectOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);

  const { data: students } = useApiQuery<Student[]>(['students', 'search', search], '/api/v1/students', { search, limit: 10 }, { enabled: search.length > 1 });
  const { data: feeRecords, isLoading } = useApiQuery<FeeRecord[]>(['fees', studentId], '/api/v1/fees/pending', { studentId }, { enabled: !!studentId });

  const collectMutation = useApiMutation<unknown, { recordId: string; paidAmount: number; paymentMode: string; remarks?: string }>(
    (d) => api.post('/api/v1/fees/collect', d).then(r => r.data),
    { successMessage: 'Payment recorded', invalidateKeys: [['fees', studentId]], onSuccess: () => setCollectOpen(false) }
  );

  const { register, handleSubmit, reset } = useForm<{ paidAmount: string; paymentMode: string; remarks?: string }>();
  const onCollect = (data: { paidAmount: string; paymentMode: string; remarks?: string }) => {
    if (!selectedRecord) return;
    collectMutation.mutate({ recordId: selectedRecord.id, paidAmount: Number(data.paidAmount), paymentMode: data.paymentMode, remarks: data.remarks });
    reset();
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search student by name or admission no…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {search.length > 1 && students?.length ? (
        <div className="border rounded-md overflow-hidden">
          {students.map(s => (
            <div key={s.id} className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent border-b last:border-0 ${studentId === s.id ? 'bg-accent' : ''}`} onClick={() => setStudentId(s.id)}>
              <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.admissionNo} · {s.className}</p></div>
            </div>
          ))}
        </div>
      ) : null}

      {studentId && (
        isLoading ? <LoadingSpinner /> : !feeRecords?.length ? (
          <EmptyState title="No pending fees" description="This student has no outstanding dues." />
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Pending Fees</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Fee Type</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {feeRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.feeType}</TableCell>
                      <TableCell>{formatCurrency(r.amount)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(r.paidAmount)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatCurrency(r.balance)}</TableCell>
                      <TableCell className="text-xs">{r.dueDate}</TableCell>
                      <TableCell><Badge variant={r.status === 'paid' ? 'default' : r.status === 'partial' ? 'secondary' : 'destructive'}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {r.status !== 'paid' && (
                          <Button size="sm" onClick={() => { setSelectedRecord(r); setCollectOpen(true); }}>
                            <IndianRupee className="h-3 w-3 mr-1" />Collect
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}

      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect Payment — {selectedRecord?.feeType}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCollect)} className="space-y-3">
            <div><Label>Balance Due</Label><p className="text-2xl font-bold text-red-600">{formatCurrency(selectedRecord?.balance || 0)}</p></div>
            <div><Label>Amount Paying</Label><Input type="number" max={selectedRecord?.balance} {...register('paidAmount', { required: true })} /></div>
            <div><Label>Payment Mode</Label>
              <select className="w-full h-10 border border-input rounded-md px-3 bg-background text-sm mt-1" {...register('paymentMode', { required: true })}>
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="cheque">Cheque</option><option value="online">Online Transfer</option>
              </select>
            </div>
            <div><Label>Remarks</Label><Input {...register('remarks')} placeholder="Optional" /></div>
            <Button type="submit" className="w-full" disabled={collectMutation.isPending}>
              {collectMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}Record Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── FEE STRUCTURE ─────────────────────────────────────────────────
const structureSchema = z.object({
  className: z.string().min(1), academicYear: z.string().min(1),
  tuition: z.string(), annual: z.string(), exam: z.string(), sports: z.string(), misc: z.string(),
});
function FeeStructureTab() {
  const [open, setOpen] = useState(false);
  const { data: classes } = useApiQuery<{ id: string; name: string }[]>(['classes'], '/api/v1/academics/classes');
  const { data: structures, isLoading } = useApiQuery<FeeStructure[]>(['fee-structures'], '/api/v1/fees/structure');
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({ resolver: zodResolver(structureSchema) });

  const addMutation = useApiMutation<unknown, { className: string; academicYear: string; fees: { type: string; amount: number; dueDate: string }[] }>(
    (d) => api.post('/api/v1/fees/structure', d).then(r => r.data),
    { successMessage: 'Fee structure saved', invalidateKeys: [['fee-structures']], onSuccess: () => { reset(); setOpen(false); } }
  );

  const year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const onSubmit = (data: Record<string, string>) => {
    const feeTypes = [
      { type: 'Tuition Fee', amount: Number(data.tuition), dueDate: `${new Date().getFullYear()}-04-10` },
      { type: 'Annual Fee', amount: Number(data.annual), dueDate: `${new Date().getFullYear()}-04-10` },
      { type: 'Exam Fee', amount: Number(data.exam), dueDate: `${new Date().getFullYear()}-09-10` },
      { type: 'Sports Fee', amount: Number(data.sports), dueDate: `${new Date().getFullYear()}-04-10` },
      { type: 'Miscellaneous', amount: Number(data.misc), dueDate: `${new Date().getFullYear()}-04-10` },
    ].filter(f => f.amount > 0);
    addMutation.mutate({ className: data.className, academicYear: data.academicYear, fees: feeTypes });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setOpen(true)}>Create Fee Structure</Button>
      </div>
      {isLoading ? <LoadingSpinner /> : !structures?.length ? <EmptyState title="No fee structures" /> : (
        <div className="space-y-4">
          {structures.map(s => (
            <Card key={s.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{s.className} — {s.academicYear}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
                  <TableBody>{s.fees.map((f, i) => <TableRow key={i}><TableCell>{f.type}</TableCell><TableCell>{formatCurrency(f.amount)}</TableCell><TableCell>{f.dueDate}</TableCell></TableRow>)}</TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div><Label>Class</Label>
              <Controller name="className" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{(classes || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div><Label>Academic Year</Label><Input defaultValue={year} {...register('academicYear')} /></div>
            {['tuition', 'annual', 'exam', 'sports', 'misc'].map(f => (
              <div key={f}><Label>{f.charAt(0).toUpperCase() + f.slice(1)} Fee (₹)</Label><Input type="number" defaultValue="0" {...register(f)} /></div>
            ))}
            <Button type="submit" className="w-full" disabled={addMutation.isPending}>Save Structure</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FeeManager() {
  return (
    <div>
      <PageHeader title="Fees Management" description="Collect fees and manage fee structures" />
      <Tabs defaultValue="collection">
        <TabsList className="mb-4"><TabsTrigger value="collection">Fee Collection</TabsTrigger><TabsTrigger value="structure">Fee Structure</TabsTrigger></TabsList>
        <TabsContent value="collection"><FeeCollectionTab /></TabsContent>
        <TabsContent value="structure"><FeeStructureTab /></TabsContent>
      </Tabs>
    </div>
  );
}

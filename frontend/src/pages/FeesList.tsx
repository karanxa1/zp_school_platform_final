import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function FeesList() {
  const [activeTab, setActiveTab] = useState<'structure' | 'payments'>('payments');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', amount_paid: '', payment_method: 'cash', fee_type: 'tuition', academic_year: '2023-2024' });
  const { fetchApi } = useApi();
  const { role } = useAuth();

  const canRecord = ["super_admin", "principal"].includes(role || '');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const endpoint = activeTab === 'structure' ? '/fees/structure' : '/fees/payments';

    if (activeTab === 'payments' && !["super_admin", "principal"].includes(role || '')) {
      setData([]);
      setLoading(false);
      setError("You don't have permission to view fee payment records.");
      return;
    }

    fetchApi(endpoint).then(res => {
      setData(res || []);
      setLoading(false);
    }).catch(err => {
      const message = err instanceof Error ? err.message : 'Failed to load fee data';
      setError(message);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/fees/payments', { method: 'POST', body: JSON.stringify({ ...formData, amount_paid: Number(formData.amount_paid) }) });
      setOpen(false);
      load();
    } catch {
      // Error message is handled via useApi; keep console clean here.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Management</h2>
          <p className="text-muted-foreground">Track and manage student fee collections.</p>
        </div>
        {canRecord && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Record Payment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Fee Payment</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input required value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" required value={formData.amount_paid} onChange={e => setFormData({ ...formData, amount_paid: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Type</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={formData.fee_type} onChange={e => setFormData({ ...formData, fee_type: e.target.value })}>
                      <option value="tuition">Tuition</option>
                      <option value="exam">Exam</option>
                      <option value="transport">Transport</option>
                      <option value="hostel">Hostel</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input value={formData.academic_year} onChange={e => setFormData({ ...formData, academic_year: e.target.value })} />
                  </div>
                </div>
                <DialogFooter><Button type="submit">Save Payment</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex space-x-2 border-b">
        {(['payments', 'structure'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            {tab === 'payments' ? 'Payment Records' : 'Fee Structure'}
          </button>
        ))}
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 text-destructive text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="glass-panel border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {activeTab === 'payments' ? (
                <>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Grade</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Day</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No records found.</TableCell></TableRow>
            ) : activeTab === 'payments' ? (
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.student_id}</TableCell>
                  <TableCell className="capitalize">{p.fee_type}</TableCell>
                  <TableCell>₹{p.amount_paid}</TableCell>
                  <TableCell className="capitalize">{p.payment_method}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize ${p.status === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>{p.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Download PDF</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.grade}</TableCell>
                  <TableCell className="capitalize">{s.fee_type}</TableCell>
                  <TableCell>₹{s.amount}</TableCell>
                  <TableCell>{s.due_day}</TableCell>
                  <TableCell className="text-right">
                    {canRecord && <Button variant="outline" size="sm">Edit</Button>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

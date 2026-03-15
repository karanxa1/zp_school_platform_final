import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const EMPTY = { first_name: '', last_name: '', email: '', password: '', phone: '', role: 'teaching', department: '', designation: '', joining_date: '', salary: '', address: '' };

export default function StaffList() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY);
  const { fetchApi } = useApi();
  const { role } = useAuth();
  const canAdd = ["super_admin", "principal", "hod"].includes(role || '');
  
  const getSelectableRoles = () => {
    if (role === 'super_admin') return ['principal', 'hod', 'teacher', 'teaching', 'non-teaching'];
    if (role === 'principal') return ['hod', 'teacher', 'teaching', 'non-teaching'];
    if (role === 'hod') return ['teacher', 'teaching', 'non-teaching'];
    return [];
  };

  const getManagementPermission = (targetRole: string) => {
    if (role === 'super_admin') return true;
    const hierarchy: Record<string, number> = { 'super_admin': 4, 'principal': 3, 'hod': 2, 'teacher': 1, 'teaching': 0, 'non-teaching': 0 };
    return (hierarchy[role || ''] || 0) > (hierarchy[targetRole] || 0);
  };

  const load = () => { setLoading(true); fetchApi('/staff/').then(d => { setStaff(d || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/staff/', { method: 'POST', body: JSON.stringify({ ...formData, salary: Number(formData.salary) }) });
    setAddOpen(false); setFormData(EMPTY); load();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi(`/staff/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone, designation: formData.designation }) });
    setEditOpen(false); load();
  };

  const openEdit = (m: any) => { setSelected(m); setFormData({ ...EMPTY, ...m, salary: String(m.salary || '') }); setEditOpen(true); };
  const openView = (m: any) => { setSelected(m); setViewOpen(true); };

  const F = ({ label, field, type = 'text', required = false }: any) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} required={required} value={(formData as any)[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <p className="text-muted-foreground">Manage teaching and non-teaching staff.</p>
        </div>
        {canAdd && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button>+ Add Staff Member</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="First Name" field="first_name" required />
                  <F label="Last Name" field="last_name" required />
                  <F label="Email" field="email" type="email" required />
                  <F label="Phone" field="phone" required />
                  <F label="Department" field="department" required />
                  <F label="Designation" field="designation" required />
                  <F label="Joining Date" field="joining_date" type="date" required />
                  <F label="Salary" field="salary" type="number" required />
                  <F label="Initial Password" field="password" type="password" required />
                  <div className="space-y-1 col-span-2"><Label>Address</Label>
                    <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                      {getSelectableRoles().map(r => (
                        <option key={r} value={r}>{r.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter><Button type="submit">Save Member</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Role</TableHead>
              <TableHead>Department</TableHead><TableHead>Designation</TableHead>
              <TableHead>Contact</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              : staff.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No staff found.</TableCell></TableRow>
              : staff.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                  <TableCell className="capitalize">{m.role}</TableCell>
                  <TableCell>{m.department}</TableCell>
                  <TableCell>{m.designation}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.phone || m.phone_number}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => openView(m)}>View</Button>
                    {getManagementPermission(m.role) && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="First Name" field="first_name" />
              <F label="Last Name" field="last_name" />
              <F label="Phone" field="phone" />
              <F label="Designation" field="designation" />
            </div>
            <DialogFooter><Button type="submit">Save Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Staff Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              {[['Name', `${selected.first_name} ${selected.last_name}`], ['Email', selected.email], ['Phone', selected.phone], ['Role', selected.role], ['Department', selected.department], ['Designation', selected.designation], ['Joining Date', selected.joining_date], ['Salary', selected.salary ? `₹${selected.salary}` : '—']].map(([k, v]) => (
                <div key={k} className="flex gap-2"><span className="font-medium w-32 shrink-0">{k}:</span><span className="text-muted-foreground">{v}</span></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

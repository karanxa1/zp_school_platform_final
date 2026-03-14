import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useApi } from '../hooks/useApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EMPTY_FORM = { first_name: '', last_name: '', roll_number: '', grade: '', section: '', email: '', admission_number: '', gender: 'Male', dob: '', address: '', parent_name: '', parent_phone: '' };

export default function StudentsList() {
  const [students, setStudents] = useState<any[]>([]);
  const { fetchApi, loading } = useApi();
  const { role } = useAuth();
  const navigate = useNavigate();
  const canEdit = ["super_admin", "principal"].includes(role || '');
  const canAdd  = ["super_admin", "principal", "teacher"].includes(role || '');

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const load = () => fetchApi('/students/').then(setStudents).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/students/', { method: 'POST', body: JSON.stringify({ ...formData, roll_number: Number(formData.roll_number) }) });
    setAddOpen(false); setFormData(EMPTY_FORM); load();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi(`/students/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ first_name: formData.first_name, last_name: formData.last_name, grade: formData.grade, section: formData.section }) });
    setEditOpen(false); load();
  };

  const openEdit = (s: any) => { setSelected(s); setFormData({ ...EMPTY_FORM, ...s, roll_number: String(s.roll_number) }); setEditOpen(true); };
  const openView = (s: any) => { setSelected(s); setViewOpen(true); };

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
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage school students.</p>
        </div>
        {canAdd && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/students/create-account')}>
              🔐 Create Account with Login
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button>+ Add Student (Basic)</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
                <form onSubmit={handleAdd} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="First Name" field="first_name" required />
                    <F label="Last Name" field="last_name" required />
                    <F label="Email" field="email" type="email" required />
                    <F label="Roll No." field="roll_number" required />
                    <F label="Grade" field="grade" required />
                    <F label="Section" field="section" required />
                    <F label="Admission No." field="admission_number" required />
                    <F label="Date of Birth" field="dob" type="date" required />
                    <F label="Address" field="address" />
                    <F label="Parent Name" field="parent_name" />
                    <F label="Parent Phone" field="parent_phone" />
                    <div className="space-y-1">
                      <Label>Gender</Label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter><Button type="submit">Save Student</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Roll No.</TableHead><TableHead>Name</TableHead>
              <TableHead>Grade</TableHead><TableHead>Section</TableHead>
              <TableHead>Email</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              : students.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No students found.</TableCell></TableRow>
              : students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.roll_number}</TableCell>
                  <TableCell>{s.first_name} {s.last_name}</TableCell>
                  <TableCell>{s.grade}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.email}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => openView(s)}>View</Button>
                    {canEdit && <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="First Name" field="first_name" />
              <F label="Last Name" field="last_name" />
              <F label="Grade" field="grade" />
              <F label="Section" field="section" />
            </div>
            <DialogFooter><Button type="submit">Save Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              {[['Name', `${selected.first_name} ${selected.last_name}`], ['Email', selected.email], ['Roll No.', selected.roll_number], ['Grade', `${selected.grade} - ${selected.section}`], ['DOB', selected.dob], ['Gender', selected.gender], ['Address', selected.address], ['Parent', selected.parent_name], ['Parent Phone', selected.parent_phone]].map(([k, v]) => (
                <div key={k} className="flex gap-2"><span className="font-medium w-28 shrink-0">{k}:</span><span className="text-muted-foreground">{v}</span></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

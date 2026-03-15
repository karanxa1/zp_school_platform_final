import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function AcademicsList() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', sections: '', subjects: '', department: '' });
  const { fetchApi } = useApi();
  const { role } = useAuth();
  const canAdd = ["super_admin", "principal", "hod", "teacher"].includes(role || '');

  const load = () => { setLoading(true); fetchApi('/academics/classes').then(d => { setClasses(d || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/academics/classes', { method: 'POST', body: JSON.stringify({ name: formData.name, department: formData.department, sections: formData.sections.split(',').map(s => s.trim()), subjects: formData.subjects.split(',').map(s => s.trim()) }) });
    setAddOpen(false); setFormData({ name: '', sections: '', subjects: '', department: '' }); load();
  };

  const openManage = (c: any) => { setSelected(c); setManageOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academics</h2>
          <p className="text-muted-foreground">Manage classes, sections, and subjects.</p>
        </div>
        {canAdd && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button>+ Add Class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Class</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2"><Label>Class Name</Label><Input required placeholder="e.g. Class 10" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Department (optional)</Label><Input placeholder="e.g. Science" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} /></div>
                <div className="space-y-2"><Label>Sections (comma-separated)</Label><Input required placeholder="e.g. A, B, C" value={formData.sections} onChange={e => setFormData({ ...formData, sections: e.target.value })} /></div>
                <div className="space-y-2"><Label>Subjects (comma-separated)</Label><Input required placeholder="e.g. Mathematics, Science" value={formData.subjects} onChange={e => setFormData({ ...formData, subjects: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Save Class</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Class Name</TableHead><TableHead>Sections</TableHead>
              <TableHead>Subjects</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              : classes.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No classes found.</TableCell></TableRow>
              : classes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{Array.isArray(c.sections) ? c.sections.join(', ') : c.sections}</TableCell>
                  <TableCell>{Array.isArray(c.subjects) ? c.subjects.join(', ') : c.subjects}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openManage(c)}>Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Class Details — {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-2">Sections</p>
                <div className="flex flex-wrap gap-2">
                  {(selected.sections || []).map((s: string) => <span key={s} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">{s}</span>)}
                </div>
              </div>
              <div>
                <p className="font-semibold mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {(selected.subjects || []).map((s: string) => <span key={s} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">{s}</span>)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

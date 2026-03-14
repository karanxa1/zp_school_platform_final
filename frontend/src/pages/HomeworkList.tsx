import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function HomeworkList() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [evalForm, setEvalForm] = useState({ student_id: '', submission_date: '', status: 'graded', grade: '', feedback: '' });
  const [formData, setFormData] = useState({ title: '', description: '', class_id: '', section_id: '', subject: '', due_date: '', teacher_id: '' });
  const { fetchApi } = useApi();
  const { role } = useAuth();
  const canAssign = ["super_admin", "principal", "teacher"].includes(role || '');

  const load = () => { setLoading(true); fetchApi('/homework/').then(d => { setAssignments(d || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/homework/', { method: 'POST', body: JSON.stringify(formData) });
    setAssignOpen(false); setFormData({ title: '', description: '', class_id: '', section_id: '', subject: '', due_date: '', teacher_id: '' }); load();
  };

  const handleEval = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/homework/submissions/', { method: 'POST', body: JSON.stringify({ homework_id: selected.id, ...evalForm }) });
    setEvalOpen(false);
  };

  const openEval = (hw: any) => { setSelected(hw); setEvalForm({ student_id: '', submission_date: '', status: 'graded', grade: '', feedback: '' }); setEvalOpen(true); };
  const openView = (hw: any) => { setSelected(hw); setViewOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Homework & Assignments</h2>
          <p className="text-muted-foreground">Manage ongoing assignments.</p>
        </div>
        {canAssign && (
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild><Button>+ Assign Homework</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Class ID</Label><Input required value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Section</Label><Input required placeholder="A" value={formData.section_id} onChange={e => setFormData({ ...formData, section_id: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Subject</Label><Input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Due Date</Label><Input type="date" required value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit">Assign</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Subject</TableHead>
              <TableHead>Class / Section</TableHead><TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              : assignments.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No homework found.</TableCell></TableRow>
              : assignments.map(hw => (
                <TableRow key={hw.id}>
                  <TableCell className="font-medium">{hw.title}</TableCell>
                  <TableCell>{hw.subject}</TableCell>
                  <TableCell>{hw.class_id} {hw.section_id && `• ${hw.section_id}`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{hw.due_date}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => openView(hw)}>View</Button>
                    {canAssign && <Button variant="outline" size="sm" onClick={() => openEval(hw)}>Evaluate</Button>}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              {[['Subject', selected.subject], ['Class', selected.class_id], ['Section', selected.section_id], ['Due Date', selected.due_date], ['Description', selected.description]].map(([k, v]) => (
                <div key={k} className="flex gap-2"><span className="font-medium w-24 shrink-0">{k}:</span><span className="text-muted-foreground">{v}</span></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evaluate Dialog */}
      <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Evaluate — {selected?.title}</DialogTitle></DialogHeader>
          <form onSubmit={handleEval} className="space-y-4">
            <div className="space-y-2"><Label>Student ID</Label><Input required value={evalForm.student_id} onChange={e => setEvalForm({ ...evalForm, student_id: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Submission Date</Label><Input type="date" required value={evalForm.submission_date} onChange={e => setEvalForm({ ...evalForm, submission_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Grade</Label><Input placeholder="A / B / C" value={evalForm.grade} onChange={e => setEvalForm({ ...evalForm, grade: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={evalForm.status} onChange={e => setEvalForm({ ...evalForm, status: e.target.value })}>
                <option value="graded">Graded</option><option value="submitted">Submitted</option><option value="late">Late</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Feedback</Label><Input value={evalForm.feedback} onChange={e => setEvalForm({ ...evalForm, feedback: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Save Evaluation</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function ExamsList() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [marksForm, setMarksForm] = useState({ student_id: '', subject_marks: '', total_marks: '', grade: '', remarks: '' });
  const [formData, setFormData] = useState({ name: '', term: 'Term 1', class_id: '', start_date: '', end_date: '' });
  const { fetchApi } = useApi();
  const { role } = useAuth();
  const canAdd = ["super_admin", "principal", "teacher", "hod"].includes(role || '');

  const load = () => { setLoading(true); fetchApi('/exams/').then(d => { setExams(d || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/exams/', { method: 'POST', body: JSON.stringify(formData) });
    setCreateOpen(false); setFormData({ name: '', term: 'Term 1', class_id: '', start_date: '', end_date: '' }); load();
  };

  const handleEnterMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectMarks: Record<string, number> = {};
    marksForm.subject_marks.split(',').forEach(pair => {
      const [subj, mark] = pair.split(':').map(s => s.trim());
      if (subj && mark) subjectMarks[subj] = Number(mark);
    });
    await fetchApi('/exams/results/', { method: 'POST', body: JSON.stringify({ exam_id: selected.id, student_id: marksForm.student_id, subject_marks: subjectMarks, total_marks: Number(marksForm.total_marks), grade: marksForm.grade, remarks: marksForm.remarks }) });
    setMarksOpen(false);
  };

  const openMarks = (exam: any) => { setSelected(exam); setMarksForm({ student_id: '', subject_marks: '', total_marks: '', grade: '', remarks: '' }); setMarksOpen(true); };
  const openView = (exam: any) => { setSelected(exam); setViewOpen(true); };

  const statusCls = (s: string) => s === 'Completed' ? 'bg-green-500/10 text-green-600' : s === 'Scheduled' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exams & Results</h2>
          <p className="text-muted-foreground">Manage exam schedules and results.</p>
        </div>
        {canAdd && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button>+ Create Exam</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2"><Label>Exam Name</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Term</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })}>
                      <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Class ID</Label><Input required value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit">Save Exam</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Exam Name</TableHead><TableHead>Term</TableHead>
              <TableHead>Timeline</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              : exams.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No exams found.</TableCell></TableRow>
              : exams.map(exam => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name || exam.title}</TableCell>
                  <TableCell>{exam.term}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{exam.start_date} → {exam.end_date}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize ${statusCls(exam.status)}`}>{exam.status}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => openView(exam)}>View</Button>
                    {canAdd && <Button variant="outline" size="sm" onClick={() => openMarks(exam)}>Enter Marks</Button>}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Exam Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              {[['Name', selected.name], ['Term', selected.term], ['Class ID', selected.class_id], ['Start', selected.start_date], ['End', selected.end_date], ['Status', selected.status]].map(([k, v]) => (
                <div key={k} className="flex gap-2"><span className="font-medium w-20 shrink-0">{k}:</span><span className="text-muted-foreground">{v}</span></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enter Marks Dialog */}
      <Dialog open={marksOpen} onOpenChange={setMarksOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enter Marks — {selected?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleEnterMarks} className="space-y-4">
            <div className="space-y-2"><Label>Student ID</Label><Input required value={marksForm.student_id} onChange={e => setMarksForm({ ...marksForm, student_id: e.target.value })} /></div>
            <div className="space-y-2"><Label>Subject Marks (e.g. Math:85, Science:90)</Label><Input required placeholder="Math:85, Science:90" value={marksForm.subject_marks} onChange={e => setMarksForm({ ...marksForm, subject_marks: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Total Marks</Label><Input type="number" required value={marksForm.total_marks} onChange={e => setMarksForm({ ...marksForm, total_marks: e.target.value })} /></div>
              <div className="space-y-2"><Label>Grade</Label><Input required placeholder="A / B / C" value={marksForm.grade} onChange={e => setMarksForm({ ...marksForm, grade: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Remarks</Label><Input value={marksForm.remarks} onChange={e => setMarksForm({ ...marksForm, remarks: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Save Marks</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

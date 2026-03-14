import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

// ─────────── Types ───────────
type Status = 'present' | 'absent' | 'late' | 'half_day';
interface StudentRow { id: string; first_name: string; last_name: string; roll_number: number; }
interface AttRecord { student_id: string; status: Status; remarks?: string; }
interface AttSession { id: string; date: string; class_id: string; section_id: string; records: AttRecord[]; }
interface StudentHistory { date: string; class_id: string; section_id: string; status: Status; remarks?: string; }

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent:  'bg-red-100 text-red-600',
  late:    'bg-yellow-100 text-yellow-700',
  half_day:'bg-orange-100 text-orange-600',
};

const statusDot: Record<string, string> = {
  present: '🟢', absent: '🔴', late: '🟡', half_day: '🟠',
};

// ─── View: Mark Attendance for a Class ───
function MarkView({ students, onClose }: { students: StudentRow[]; onClose: () => void }) {
  const { fetchApi } = useApi();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, { status: Status; remarks: string }>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const setStatus = (id: string, status: Status) =>
    setRecords(r => ({ ...r, [id]: { ...r[id], status, remarks: r[id]?.remarks || '' } }));

  const setRemarks = (id: string, remarks: string) =>
    setRecords(r => ({ ...r, [id]: { ...r[id], remarks } }));

  const markAll = (status: Status) => {
    const all: Record<string, { status: Status; remarks: string }> = {};
    students.forEach(s => { all[s.id] = { status, remarks: '' }; });
    setRecords(all);
  };

  const handleSave = async () => {
    setSaving(true);
    const rec: AttRecord[] = students.map(s => ({
      student_id: s.id,
      status: records[s.id]?.status || 'present',
      remarks: records[s.id]?.remarks || '',
    }));
    await fetchApi('/attendance/mark', { method: 'POST', body: JSON.stringify({ class_id: classId, section_id: sectionId, date, records: rec }) });
    setSaving(false); setDone(true);
    setTimeout(onClose, 800);
  };

  if (done) return <div className="flex flex-col items-center justify-center h-64 gap-4"><div className="text-5xl">✅</div><p className="text-lg font-semibold">Attendance saved!</p></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="space-y-1"><Label>Class ID</Label><Input placeholder="e.g. class_10a" value={classId} onChange={e => setClassId(e.target.value)} /></div>
        <div className="space-y-1"><Label>Section</Label><Input placeholder="e.g. A" value={sectionId} onChange={e => setSectionId(e.target.value)} /></div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground self-center">Mark all as:</span>
        {(['present','absent','late','half_day'] as Status[]).map(s => (
          <Button key={s} size="sm" variant="outline" className={statusColors[s]} onClick={() => markAll(s)}>
            {statusDot[s]} {s.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="w-72">Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0
              ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No students loaded. Select a class above to filter.</TableCell></TableRow>
              : students.map((s, i) => {
                const current = records[s.id]?.status;
                return (
                  <TableRow key={s.id} className={current ? `${statusColors[current]} bg-opacity-30` : ''}>
                    <TableCell className="text-muted-foreground text-xs">{s.roll_number || i + 1}</TableCell>
                    <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(['present','absent','late','half_day'] as Status[]).map(st => (
                          <button key={st}
                            onClick={() => setStatus(s.id, st)}
                            className={`px-2 py-1 rounded text-xs font-medium border transition-all ${current === st ? statusColors[st] + ' border-current' : 'border-muted text-muted-foreground hover:border-primary'}`}
                          >{statusDot[st]} {st === 'half_day' ? 'Half' : st.charAt(0).toUpperCase() + st.slice(1)}</button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs" placeholder="optional note" value={records[s.id]?.remarks || ''} onChange={e => setRemarks(s.id, e.target.value)} />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-sm text-muted-foreground">
          {Object.values(records).filter(r => r.status === 'present').length} present ·{' '}
          {Object.values(records).filter(r => r.status === 'absent').length} absent ·{' '}
          {students.length - Object.keys(records).length} unmarked
        </span>
        <Button onClick={handleSave} disabled={saving || !classId || !sectionId}>
          {saving ? 'Saving…' : 'Save Attendance'}
        </Button>
      </div>
    </div>
  );
}

// ─── View: Session Detail (click a row in the session table) ───
function SessionDetailView({ session, studentMap, onClose }: { session: AttSession; studentMap: Record<string, string>; onClose: () => void }) {
  const present = session.records.filter(r => r.status === 'present').length;
  const total = session.records.length;
  const pct = total ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        {[['Date', session.date], ['Class', session.class_id], ['Section', session.section_id]].map(([l, v]) => (
          <div key={l} className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-semibold">{present}/{total} present ({pct}%)</span>
      </div>

      <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {session.records.map(r => (
              <TableRow key={r.student_id}>
                <TableCell className="font-medium">{studentMap[r.student_id] || r.student_id}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[r.status]}`}>
                    {statusDot[r.status]} {r.status.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.remarks || '—'}</TableCell>
              </TableRow>
            ))}
            {session.records.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No records in this session.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </div>
  );
}

// ─── View: Student Attendance History ───
function StudentHistoryView({ students, onClose }: { students: StudentRow[]; onClose: () => void }) {
  const { fetchApi } = useApi();
  const [studentId, setStudentId] = useState('');
  const [history, setHistory] = useState<StudentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (id: string) => {
    if (!id) return;
    setLoading(true);
    const data = await fetchApi(`/attendance/student/${id}`).catch(() => []);
    setHistory(data || []);
    setLoading(false);
  };

  const present = history.filter(h => h.status === 'present').length;
  const pct = history.length ? Math.round((present / history.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Student</Label>
        <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          value={studentId}
          onChange={e => { setStudentId(e.target.value); load(e.target.value); }}>
          <option value="">— choose student —</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (Roll: {s.roll_number})</option>)}
        </select>
      </div>

      {studentId && !loading && history.length > 0 && (
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            ['Total Days', history.length, 'text-primary'],
            ['Present', history.filter(h => h.status === 'present').length, 'text-green-600'],
            ['Absent', history.filter(h => h.status === 'absent').length, 'text-red-500'],
            ['Attendance %', `${pct}%`, pct >= 75 ? 'text-green-600' : 'text-red-500'],
          ].map(([l, v, cls]) => (
            <div key={l as string} className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className={`text-xl font-bold ${cls}`}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {studentId && !loading && history.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 75 ? '#22c55e' : '#ef4444' }} />
          </div>
          <span className={`text-sm font-semibold ${pct >= 75 ? 'text-green-600' : 'text-red-500'}`}>
            {pct >= 75 ? '✅ Good' : '⚠️ Low'}
          </span>
        </div>
      )}

      <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Class</TableHead>
              <TableHead>Section</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading history…</TableCell></TableRow>
              : !studentId
              ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Select a student above.</TableCell></TableRow>
              : history.length === 0
              ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attendance records found.</TableCell></TableRow>
              : history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{h.date}</TableCell>
                  <TableCell>{h.class_id}</TableCell>
                  <TableCell>{h.section_id}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[h.status]}`}>
                      {statusDot[h.status]} {h.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{h.remarks || '—'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </div>
  );
}

// ─────────── Main Component ───────────
export default function AttendanceList() {
  const [sessions, setSessions] = useState<AttSession[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [markOpen, setMarkOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AttSession | null>(null);
  const { fetchApi } = useApi();
  const { role } = useAuth();
  const canMark = ["super_admin", "principal", "teacher"].includes(role || '');

  const loadSessions = () => {
    setLoading(true);
    fetchApi('/attendance/daily').then(d => { setSessions(d || []); setLoading(false); }).catch(() => setLoading(false));
  };

  const loadStudents = () => {
    fetchApi('/students/').then((d: StudentRow[]) => {
      setStudents(d || []);
      const map: Record<string, string> = {};
      (d || []).forEach(s => { map[s.id] = `${s.first_name} ${s.last_name}`; });
      setStudentMap(map);
    }).catch(console.error);
  };

  useEffect(() => { loadSessions(); loadStudents(); }, []);

  const summary = {
    total: sessions.length,
    totalStudents: students.length,
  };

  const openSession = (session: AttSession) => { setSelectedSession(session); setSessionOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
          <p className="text-muted-foreground">Per-student daily attendance tracking.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">📋 Student History</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Student Attendance History</DialogTitle></DialogHeader>
              <StudentHistoryView students={students} onClose={() => setHistoryOpen(false)} />
            </DialogContent>
          </Dialog>

          {canMark && (
            <Dialog open={markOpen} onOpenChange={v => { setMarkOpen(v); if (!v) loadSessions(); }}>
              <DialogTrigger asChild>
                <Button>✏️ Mark Attendance</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
                <MarkView students={students} onClose={() => setMarkOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Total Sessions', summary.total, 'bg-primary/10 text-primary'],
          ['Students', summary.totalStudents, 'bg-blue-500/10 text-blue-600'],
          ['Today', new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }), 'bg-purple-500/10 text-purple-600'],
          ['Academic Year', '2025–26', 'bg-green-500/10 text-green-600'],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="glass-panel border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sessions Table */}
      <div className="glass-panel border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Attendance Sessions</h3>
          <span className="text-xs text-muted-foreground">{sessions.length} records</span>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading sessions…</TableCell></TableRow>
              : sessions.length === 0
              ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No attendance sessions recorded yet.</TableCell></TableRow>
              : sessions.map(s => {
                const pct = (s.present_count + s.absent_count) > 0
                  ? Math.round((s.present_count / ((s.present_count || 0) + (s.absent_count || 0))) * 100) : 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{(s as any).date}</TableCell>
                    <TableCell>{(s as any).class_name || (s as any).class_id || '—'}</TableCell>
                    <TableCell>{(s as any).section || (s as any).section_id || '—'}</TableCell>
                    <TableCell>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                        🟢 {(s as any).present_count ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">
                        🔴 {(s as any).absent_count ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(s as any).present_count != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openSession(s)}>View Details</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Session Details</DialogTitle></DialogHeader>
          {selectedSession && (
            <SessionDetailView session={selectedSession} studentMap={studentMap} onClose={() => setSessionOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

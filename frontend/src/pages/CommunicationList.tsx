import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function CommunicationList() {
  const [activeTab, setActiveTab] = useState<'notices' | 'complaints'>('notices');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', target_audience: 'all' });
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', category: 'facilities', is_anonymous: false });
  const { fetchApi } = useApi();
  const { role } = useAuth();

  const isAdmin = ["admin", "super_admin", "principal", "hod"].includes(role || '');

  const load = () => {
    setLoading(true);
    const endpoint = activeTab === 'notices' ? '/communication/notices' : '/communication/complaints';
    fetchApi(endpoint).then(res => {
      setData(res || []);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { load(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'notices') {
        await fetchApi('/communication/notices', { method: 'POST', body: JSON.stringify(noticeForm) });
      } else {
        await fetchApi('/communication/complaints', { method: 'POST', body: JSON.stringify(complaintForm) });
      }
      setOpen(false);
      load();
    } catch (err) { console.error(err); }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'resolved') return 'bg-green-500/10 text-green-600';
    if (status === 'in_progress') return 'bg-blue-500/10 text-blue-600';
    return 'bg-yellow-500/10 text-yellow-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Communication</h2>
          <p className="text-muted-foreground">Broadcast notices and manage institutional complaints.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>{activeTab === 'notices' ? 'Issue Notice' : 'File Complaint'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{activeTab === 'notices' ? 'Issue Notice' : 'File Complaint'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'notices' ? (
                <>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input required value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Input required value={noticeForm.content} onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={noticeForm.target_audience} onChange={e => setNoticeForm({ ...noticeForm, target_audience: e.target.value })}>
                      <option value="all">All</option>
                      <option value="teacher">Teachers</option>
                      <option value="student">Students</option>
                      <option value="parent">Parents</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input required value={complaintForm.subject} onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={complaintForm.category} onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}>
                      <option value="facilities">Facilities</option>
                      <option value="academic">Academic</option>
                      <option value="financial">Financial</option>
                      <option value="conduct">Conduct</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}
              <DialogFooter><Button type="submit">Submit</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-2 bg-muted/30 p-1 rounded-lg w-max">
        {(['notices', 'complaints'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : activeTab === 'notices' ? (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Date Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((notice: any) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium">{notice.title}</TableCell>
                  <TableCell className="capitalize">{notice.target_audience}</TableCell>
                  <TableCell>{new Date(notice.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin && <Button variant="outline" size="sm">Remove</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No notices found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((complaint: any) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.subject}</TableCell>
                  <TableCell className="capitalize">{complaint.category}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize ${getStatusStyle(complaint.status)}`}>{complaint.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && <Button variant="outline" size="sm">Resolve</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No complaints found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

type Tab = 'library' | 'transport' | 'hostel' | 'inventory';

export default function LogisticsList() {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { fetchApi } = useApi();
  const { role } = useAuth();

  const isAdmin = ["admin", "super_admin", "principal"].includes(role || '');

  const endpoints: Record<Tab, string> = {
    library: '/logistics/library/books',
    transport: '/logistics/transport/routes',
    hostel: '/logistics/hostel/rooms',
    inventory: '/logistics/inventory/items',
  };

  const load = () => {
    setLoading(true);
    fetchApi(endpoints[activeTab]).then(res => {
      setData(res || []);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { load(); }, [activeTab]);

  const tabLabels: Record<Tab, string> = { library: 'Library', transport: 'Transport', hostel: 'Hostel', inventory: 'Inventory' };

  const addLabels: Record<Tab, string> = { library: 'Add Book', transport: 'Add Route', hostel: 'Add Room', inventory: 'Add Item' };

  const postEndpoints: Record<Tab, string> = {
    library: '/logistics/library/books',
    transport: '/logistics/transport/routes',
    hostel: '/logistics/hostel/rooms',
    inventory: '/logistics/inventory/items',
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'library':
        return <LibraryForm fetchApi={fetchApi} onDone={() => { setOpen(false); load(); }} />;
      case 'transport':
        return <TransportForm fetchApi={fetchApi} postEndpoint={postEndpoints.transport} onDone={() => { setOpen(false); load(); }} />;
      case 'hostel':
        return <HostelForm fetchApi={fetchApi} postEndpoint={postEndpoints.hostel} onDone={() => { setOpen(false); load(); }} />;
      case 'inventory':
        return <InventoryForm fetchApi={fetchApi} postEndpoint={postEndpoints.inventory} onDone={() => { setOpen(false); load(); }} />;
    }
  };

  const renderTable = () => {
    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    switch (activeTab) {
      case 'library':
        return (
          <Table>
            <TableHeader className="bg-muted/50"><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Available / Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map(b => <TableRow key={b.id}><TableCell className="font-medium">{b.title}</TableCell><TableCell>{b.author}</TableCell><TableCell>{b.available_copies} / {b.total_copies}</TableCell><TableCell className="text-right">{isAdmin && <Button variant="outline" size="sm">Issue Book</Button>}</TableCell></TableRow>)}
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No books found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        );
      case 'transport':
        return (
          <Table>
            <TableHeader className="bg-muted/50"><TableRow><TableHead>Route Name</TableHead><TableHead>Vehicle</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map(r => <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.vehicle_number}</TableCell><TableCell>{r.driver_name}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm">View Stops</Button></TableCell></TableRow>)}
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No routes found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        );
      case 'hostel':
        return (
          <Table>
            <TableHeader className="bg-muted/50"><TableRow><TableHead>Room</TableHead><TableHead>Building</TableHead><TableHead>Occupancy</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map(r => <TableRow key={r.id}><TableCell className="font-medium">{r.room_number}</TableCell><TableCell>{r.building}</TableCell><TableCell>{r.current_occupancy} / {r.capacity}</TableCell><TableCell className="text-right">{isAdmin && <Button variant="outline" size="sm">Allocate</Button>}</TableCell></TableRow>)}
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No rooms found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        );
      case 'inventory':
        return (
          <Table>
            <TableHeader className="bg-muted/50"><TableRow><TableHead>Item Name</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map(i => <TableRow key={i.id}><TableCell className="font-medium">{i.name}</TableCell><TableCell>{i.category}</TableCell><TableCell>{i.quantity} {i.unit}</TableCell><TableCell className="text-right">{isAdmin && <Button variant="outline" size="sm">Request Stock</Button>}</TableCell></TableRow>)}
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No items found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Logistics</h2>
          <p className="text-muted-foreground">Manage library, transport, hostel, and inventory.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>{addLabels[activeTab]}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{addLabels[activeTab]}</DialogTitle></DialogHeader>
              {renderForm()}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex space-x-2 bg-muted/30 p-1 rounded-lg w-max">
        {(Object.keys(tabLabels) as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="glass-panel border rounded-xl overflow-hidden">{renderTable()}</div>
    </div>
  );
}

function LibraryForm({ fetchApi, onDone }: { fetchApi: any; onDone: () => void }) {
  const [f, setF] = useState({ title: '', author: '', isbn: '', total_copies: '' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi('/logistics/library/books', { method: 'POST', body: JSON.stringify({ ...f, total_copies: Number(f.total_copies), available_copies: Number(f.total_copies) }) });
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Title</Label><Input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
        <div className="space-y-2"><Label>Author</Label><Input required value={f.author} onChange={e => setF({ ...f, author: e.target.value })} /></div>
        <div className="space-y-2"><Label>ISBN</Label><Input value={f.isbn} onChange={e => setF({ ...f, isbn: e.target.value })} /></div>
        <div className="space-y-2"><Label>Total Copies</Label><Input type="number" required value={f.total_copies} onChange={e => setF({ ...f, total_copies: e.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit">Save Book</Button></DialogFooter>
    </form>
  );
}

function TransportForm({ fetchApi, postEndpoint, onDone }: { fetchApi: any; postEndpoint: string; onDone: () => void }) {
  const [f, setF] = useState({ name: '', vehicle_number: '', driver_name: '', driver_phone: '' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi(postEndpoint, { method: 'POST', body: JSON.stringify(f) });
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Route Name</Label><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Vehicle No.</Label><Input required value={f.vehicle_number} onChange={e => setF({ ...f, vehicle_number: e.target.value })} /></div>
        <div className="space-y-2"><Label>Driver Name</Label><Input value={f.driver_name} onChange={e => setF({ ...f, driver_name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Driver Phone</Label><Input value={f.driver_phone} onChange={e => setF({ ...f, driver_phone: e.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit">Save Route</Button></DialogFooter>
    </form>
  );
}

function HostelForm({ fetchApi, postEndpoint, onDone }: { fetchApi: any; postEndpoint: string; onDone: () => void }) {
  const [f, setF] = useState({ room_number: '', building: '', capacity: '' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi(postEndpoint, { method: 'POST', body: JSON.stringify({ ...f, capacity: Number(f.capacity), current_occupancy: 0 }) });
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Room Number</Label><Input required value={f.room_number} onChange={e => setF({ ...f, room_number: e.target.value })} /></div>
        <div className="space-y-2"><Label>Building</Label><Input required value={f.building} onChange={e => setF({ ...f, building: e.target.value })} /></div>
        <div className="space-y-2"><Label>Capacity</Label><Input type="number" required value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit">Save Room</Button></DialogFooter>
    </form>
  );
}

function InventoryForm({ fetchApi, postEndpoint, onDone }: { fetchApi: any; postEndpoint: string; onDone: () => void }) {
  const [f, setF] = useState({ name: '', category: '', quantity: '', unit: 'pcs' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApi(postEndpoint, { method: 'POST', body: JSON.stringify({ ...f, quantity: Number(f.quantity) }) });
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Item Name</Label><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Category</Label><Input value={f.category} onChange={e => setF({ ...f, category: e.target.value })} /></div>
        <div className="space-y-2"><Label>Quantity</Label><Input type="number" required value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} /></div>
        <div className="space-y-2"><Label>Unit</Label><Input placeholder="pcs / boxes / kg" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit">Save Item</Button></DialogFooter>
    </form>
  );
}

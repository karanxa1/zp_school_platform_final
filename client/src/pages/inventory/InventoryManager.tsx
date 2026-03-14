import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Item { id: string; itemId: string; name: string; category: string; quantity: number; unit: string; minStock: number; costPerUnit: number; }
interface Transaction { type: 'in' | 'out'; quantity: number; remarks?: string; }

const itemSchema = z.object({ name: z.string().min(2), category: z.string().min(2), unit: z.string().min(1), quantity: z.string(), minStock: z.string(), costPerUnit: z.string() });
const txSchema = z.object({ quantity: z.string().min(1), remarks: z.string().optional() });

export default function InventoryManager() {
  const [open, setOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data: items, isLoading } = useApiQuery<Item[]>(['inventory'], '/api/v1/inventory');
  const { register: rItem, handleSubmit: hItem, reset: resetItem } = useForm({ resolver: zodResolver(itemSchema) });
  const { register: rTx, handleSubmit: hTx, reset: resetTx } = useForm({ resolver: zodResolver(txSchema) });

  const add = useApiMutation<unknown, { name: string; category: string; unit: string; quantity: number; minStock: number; costPerUnit: number }>(
    (d) => api.post('/api/v1/inventory', d).then(r => r.data),
    { successMessage: 'Item added', invalidateKeys: [['inventory']], onSuccess: () => { resetItem(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/inventory/${id}`).then(r => r.data),
    { successMessage: 'Item removed', invalidateKeys: [['inventory']] }
  );
  const stockMutation = useApiMutation<unknown, { itemId: string; type: 'in' | 'out'; quantity: number; remarks?: string }>(
    (d) => api.post(`/api/v1/inventory/${d.itemId}/stock`, d).then(r => r.data),
    { successMessage: 'Stock updated', invalidateKeys: [['inventory']], onSuccess: () => { resetTx(); setTxOpen(false); } }
  );

  return (
    <div>
      <PageHeader title="Inventory" description="Track school inventory and stock levels">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <form onSubmit={hItem((d) => add.mutate({ ...d, quantity: Number(d.quantity), minStock: Number(d.minStock), costPerUnit: Number(d.costPerUnit) }))} className="space-y-3">
              {[['name', 'Item Name'], ['category', 'Category'], ['unit', 'Unit (pcs, kg, L)']].map(([f, l]) => (
                <div key={f}><Label>{l}</Label><Input {...rItem(f as keyof typeof itemSchema.shape)} /></div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[['quantity', 'Qty'], ['minStock', 'Min Stock'], ['costPerUnit', 'Cost/Unit (₹)']].map(([f, l]) => (
                  <div key={f}><Label>{l}</Label><Input type="number" defaultValue="0" {...rItem(f as keyof typeof itemSchema.shape)} /></div>
                ))}
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingSpinner /> : !items?.length ? <EmptyState title="No items" /> : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead><TableHead>Min Stock</TableHead><TableHead>Cost/Unit</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(item => {
              const isLow = item.quantity <= item.minStock;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>{item.minStock}</TableCell>
                  <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                  <TableCell>{isLow ? <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Low Stock</Badge> : <Badge variant="default">OK</Badge>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setTxType('in'); setTxOpen(true); }}><ArrowUpCircle className="h-3 w-3 mr-1" />In</Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setTxType('out'); setTxOpen(true); }}><ArrowDownCircle className="h-3 w-3 mr-1" />Out</Button>
                    <ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} title="Remove item?" onConfirm={() => del.mutate(item.id)} confirmLabel="Remove" isDestructive />
                  </TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Stock {txType === 'in' ? 'In' : 'Out'} — {selectedItem?.name}</DialogTitle></DialogHeader>
          <form onSubmit={hTx((d) => { if (selectedItem) stockMutation.mutate({ itemId: selectedItem.itemId, type: txType, quantity: Number(d.quantity), remarks: d.remarks }); })} className="space-y-3">
            <div><Label>Quantity ({selectedItem?.unit})</Label><Input type="number" min="1" {...rTx('quantity')} /></div>
            <div><Label>Remarks</Label><Input {...rTx('remarks')} placeholder="Optional" /></div>
            <Button type="submit" className="w-full" disabled={stockMutation.isPending}>Confirm</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

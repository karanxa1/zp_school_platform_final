import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, BookOpen, RotateCcw } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface Book { id: string; bookId: string; title: string; author: string; isbn: string; category: string; totalCopies: number; availableCopies: number; }
interface Transaction { id: string; transactionId: string; bookId: string; bookTitle: string; issuedTo: string; studentName?: string; dueDate: string; returnDate?: string; fine?: number; status: string; }
interface Student { id: string; name: string; admissionNo: string; }

// ─── BOOKS TAB ─────────────────────────────────────────────────────
const bookSchema = z.object({
  title: z.string().min(2), author: z.string().min(2), isbn: z.string().min(5),
  category: z.string().min(2), totalCopies: z.string(),
});
function BooksTab() {
  const [open, setOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const { data: books, isLoading } = useApiQuery<Book[]>(['books'], '/api/v1/library/books');
  const { data: students } = useApiQuery<Student[]>(['students', 'search', studentSearch], '/api/v1/students', { search: studentSearch, limit: 5 }, { enabled: studentSearch.length > 1 });
  const [issueTo, setIssueTo] = useState('');
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(bookSchema) });

  const add = useApiMutation<unknown, { title: string; author: string; isbn: string; category: string; totalCopies: number; availableCopies: number }>(
    (d) => api.post('/api/v1/library/books', d).then(r => r.data),
    { successMessage: 'Book added', invalidateKeys: [['books']], onSuccess: () => { reset(); setOpen(false); } }
  );
  const del = useApiMutation<unknown, string>(
    (id) => api.delete(`/api/v1/library/books/${id}`).then(r => r.data),
    { successMessage: 'Book removed', invalidateKeys: [['books']] }
  );
  const issue = useApiMutation<unknown, { bookId: string; issuedTo: string; dueDate: string }>(
    (d) => api.post('/api/v1/library/issue', d).then(r => r.data),
    { successMessage: 'Book issued', invalidateKeys: [['books'], ['transactions']], onSuccess: () => { setIssueOpen(false); setIssueTo(''); setStudentSearch(''); } }
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Book</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate({ ...d, totalCopies: Number(d.totalCopies), availableCopies: Number(d.totalCopies) }))} className="space-y-3">
              {[['title', 'Title'], ['author', 'Author'], ['isbn', 'ISBN'], ['category', 'Category']].map(([f, l]) => (
                <div key={f}><Label>{l}</Label><Input {...register(f as keyof typeof bookSchema.shape)} /></div>
              ))}
              <div><Label>No. of Copies</Label><Input type="number" min="1" defaultValue="1" {...register('totalCopies')} /></div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Book</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <LoadingSpinner /> : !books?.length ? <EmptyState title="No books" icon={<BookOpen className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>ISBN</TableHead><TableHead>Category</TableHead><TableHead>Available</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{books.map(b => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.title}</TableCell><TableCell>{b.author}</TableCell>
              <TableCell className="font-mono text-xs">{b.isbn}</TableCell><TableCell>{b.category}</TableCell>
              <TableCell>
                <Badge variant={b.availableCopies > 0 ? 'default' : 'destructive'}>{b.availableCopies}/{b.totalCopies}</Badge>
              </TableCell>
              <TableCell className="text-right space-x-1">
                {b.availableCopies > 0 && (
                  <Button size="sm" variant="outline" onClick={() => { setSelectedBook(b); setIssueOpen(true); }}>Issue</Button>
                )}
                <ConfirmDialog trigger={<Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} title="Remove book?" onConfirm={() => del.mutate(b.id)} confirmLabel="Remove" isDestructive />
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Book — {selectedBook?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Search Student</Label>
              <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Type name or admission no…" />
              {studentSearch.length > 1 && students?.length ? (
                <div className="border rounded-md mt-1 overflow-hidden">
                  {students.map(s => (
                    <div key={s.id} className={`p-2 cursor-pointer hover:bg-accent ${issueTo === s.id ? 'bg-accent' : ''}`} onClick={() => { setIssueTo(s.id); setStudentSearch(s.name); }}>
                      <p className="font-medium text-sm">{s.name}</p><p className="text-xs text-muted-foreground">{s.admissionNo}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div><Label>Due Date</Label>
              <Input type="date" defaultValue={format(addDays(new Date(), 14), 'yyyy-MM-dd')} id="dueDate" />
            </div>
            <Button className="w-full" disabled={!issueTo || issue.isPending} onClick={() => {
              const dd = (document.getElementById('dueDate') as HTMLInputElement).value;
              if (selectedBook && issueTo) issue.mutate({ bookId: selectedBook.bookId, issuedTo: issueTo, dueDate: dd });
            }}>
              {issue.isPending && <LoadingSpinner size="sm" className="mr-2" />}Issue Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── TRANSACTIONS TAB ──────────────────────────────────────────────
function TransactionsTab() {
  const { data: transactions, isLoading } = useApiQuery<Transaction[]>(['transactions'], '/api/v1/library/transactions');
  const returnMutation = useApiMutation<unknown, string>(
    (tid) => api.post(`/api/v1/library/return/${tid}`).then(r => r.data),
    { successMessage: 'Book returned', invalidateKeys: [['transactions'], ['books']] }
  );

  return isLoading ? <LoadingSpinner /> : !transactions?.length ? <EmptyState title="No transactions" /> : (
    <Table>
      <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Student</TableHead><TableHead>Due Date</TableHead><TableHead>Return Date</TableHead><TableHead>Fine</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>{transactions.map(t => (
        <TableRow key={t.id}>
          <TableCell className="font-medium">{t.bookTitle}</TableCell>
          <TableCell>{t.studentName || t.issuedTo}</TableCell>
          <TableCell>{t.dueDate}</TableCell>
          <TableCell>{t.returnDate || '—'}</TableCell>
          <TableCell>{t.fine ? <span className="text-red-600 font-medium">{formatCurrency(t.fine)}</span> : '—'}</TableCell>
          <TableCell><Badge variant={t.status === 'returned' ? 'default' : t.status === 'overdue' ? 'destructive' : 'secondary'}>{t.status}</Badge></TableCell>
          <TableCell className="text-right">
            {t.status !== 'returned' && (
              <Button size="sm" variant="outline" onClick={() => returnMutation.mutate(t.transactionId)}>
                <RotateCcw className="h-3 w-3 mr-1" />Return
              </Button>
            )}
          </TableCell>
        </TableRow>
      ))}</TableBody>
    </Table>
  );
}

export default function LibraryManager() {
  return (
    <div>
      <PageHeader title="Library" description="Manage books and track issue/return transactions" />
      <Tabs defaultValue="books">
        <TabsList className="mb-4"><TabsTrigger value="books">Books</TabsTrigger><TabsTrigger value="transactions">Transactions</TabsTrigger></TabsList>
        <TabsContent value="books"><Card><CardContent className="p-4"><BooksTab /></CardContent></Card></TabsContent>
        <TabsContent value="transactions"><Card><CardContent className="p-4"><TransactionsTab /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}

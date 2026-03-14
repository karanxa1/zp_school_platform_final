import React, { useState } from 'react';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Download, BarChart2, FileText, IndianRupee, BookMarked, BookOpen, Package, UserCheck, Shield } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

function exportToExcel(data: object[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

// ─── ATTENDANCE REPORT ─────────────────────────────────────────────
function AttendanceReport() {
  const [from, setFrom] = useState(format(new Date(), 'yyyy-MM-01'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data, isLoading, refetch } = useApiQuery<{ date: string; present: number; absent: number; total: number }[]>(
    ['report-attendance', from, to], '/api/v1/attendance/report', { from, to }, { enabled: false }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div><Label>From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-36" /></div>
        <Button onClick={() => refetch()}>Generate</Button>
        {data?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(data, 'attendance_report')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      </div>
      {isLoading ? <LoadingSpinner /> : !data?.length ? <EmptyState title="No data — select range and click Generate" icon={<BarChart2 className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
          <TableBody>{data.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{formatDate(r.date)}</TableCell>
              <TableCell className="text-green-600 font-medium">{r.present}</TableCell>
              <TableCell className="text-red-600 font-medium">{r.absent}</TableCell>
              <TableCell>{r.total}</TableCell>
              <TableCell><Badge variant={Math.round((r.present/r.total)*100) >= 75 ? 'default' : 'destructive'}>{r.total > 0 ? Math.round((r.present/r.total)*100) : 0}%</Badge></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── FEE REPORT ────────────────────────────────────────────────────
function FeeReport() {
  const [month, setMonth] = useState(format(new Date(), 'MM'));
  const [year, setYear] = useState(format(new Date(), 'yyyy'));
  const { data, isLoading, refetch } = useApiQuery<{ records: object[]; total: number }>(
    ['report-fees', year, month], '/api/v1/fees/report/monthly', { year, month }, { enabled: false }
  );
  const { data: defaulters } = useApiQuery<object[]>(['report-defaulters'], '/api/v1/fees/pending');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div><Label>Year</Label><Input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-24" /></div>
        <div><Label>Month</Label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="flex h-9 w-28 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
              <option key={m} value={m}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => refetch()}>Generate</Button>
        {data?.records?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(data.records, 'fee_report')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      </div>
      {isLoading ? <LoadingSpinner /> : data && (
        <div className="space-y-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Collected</p><p className="text-3xl font-bold text-green-600">{formatCurrency(data.total)}</p></CardContent></Card>
          <div>
            <h4 className="font-semibold text-sm mb-2">Defaulters ({Array.isArray(defaulters) ? defaulters.length : 0})</h4>
            {Array.isArray(defaulters) && defaulters.length > 0 ? (
              <Table><TableHeader><TableRow><TableHead>Student ID</TableHead><TableHead>Component</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{(defaulters as any[]).slice(0,20).map((r: any, i: number) => (
                  <TableRow key={i}><TableCell>{r.studentId}</TableCell><TableCell>{r.componentName}</TableCell><TableCell className="text-red-600">{formatCurrency(r.balance)}</TableCell><TableCell><Badge variant="destructive">{r.status}</Badge></TableCell></TableRow>
                ))}</TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground">No defaulters</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EXAM RESULTS ──────────────────────────────────────────────────
function ExamResults() {
  const { data: exams } = useApiQuery<{ examId: string; name: string }[]>(['report-exams'], '/api/v1/exams');
  const [examId, setExamId] = useState('');
  const { data: marks, isLoading, refetch } = useApiQuery<object[]>(
    ['report-marks', examId], `/api/v1/exams/${examId}/marks`, undefined, { enabled: false }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label>Exam</Label>
          <select value={examId} onChange={e => setExamId(e.target.value)} className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">Select exam…</option>
            {(exams || []).map(e => <option key={e.examId} value={e.examId}>{e.name}</option>)}
          </select>
        </div>
        <Button onClick={() => refetch()} disabled={!examId}>Generate</Button>
        {marks?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(marks, 'exam_results')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      </div>
      {isLoading ? <LoadingSpinner /> : !marks?.length ? <EmptyState title="Select an exam and click Generate" icon={<FileText className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Max</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
          <TableBody>{(marks as any[]).map((m: any, i: number) => (
            <TableRow key={i}><TableCell>{m.studentId}</TableCell><TableCell>{m.subjectId}</TableCell><TableCell>{m.marksObtained}</TableCell><TableCell>{m.maxMarks}</TableCell><TableCell><Badge>{m.grade}</Badge></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── LIBRARY REPORT ────────────────────────────────────────────────
function LibraryReport() {
  const { data: transactions, isLoading } = useApiQuery<any[]>(['report-lib'], '/api/v1/library/transactions');
  const overdue = (transactions || []).filter(t => t.status === 'overdue');
  const totalFine = overdue.reduce((s: number, t: any) => s + (t.fine || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{transactions?.length || 0}</p><p className="text-xs text-muted-foreground">Total Transactions</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{overdue.length}</p><p className="text-xs text-muted-foreground">Overdue Books</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{formatCurrency(totalFine)}</p><p className="text-xs text-muted-foreground">Total Fines</p></CardContent></Card>
      </div>
      {transactions?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(transactions, 'library_report')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      {isLoading ? <LoadingSpinner /> : overdue.length === 0 ? <EmptyState title="No overdue books" icon={<BookOpen className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Issued To</TableHead><TableHead>Due Date</TableHead><TableHead>Fine</TableHead></TableRow></TableHeader>
          <TableBody>{overdue.map((t: any, i: number) => (
            <TableRow key={i}><TableCell>{t.bookTitle}</TableCell><TableCell>{t.studentName || t.issuedTo}</TableCell><TableCell>{t.dueDate}</TableCell><TableCell className="text-red-600 font-medium">{formatCurrency(t.fine || 0)}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── INVENTORY REPORT ──────────────────────────────────────────────
function InventoryReport() {
  const { data: items, isLoading } = useApiQuery<any[]>(['report-inv'], '/api/v1/inventory/items');
  const lowStock = (items || []).filter((i: any) => i.currentStock <= i.minStockLevel);
  const totalValue = (items || []).reduce((s: number, i: any) => s + ((i.currentStock || 0) * (i.unitPrice || 0)), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items?.length || 0}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p><p className="text-xs text-muted-foreground">Stock Value</p></CardContent></Card>
      </div>
      {items?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(items, 'inventory_report')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      {isLoading ? <LoadingSpinner /> : lowStock.length === 0 ? <EmptyState title="All items within stock levels" icon={<Package className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Current Stock</TableHead><TableHead>Min Level</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{lowStock.map((item: any, i: number) => (
            <TableRow key={i}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.currentStock}</TableCell><TableCell>{item.minStockLevel}</TableCell><TableCell><Badge variant="destructive">Low Stock</Badge></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── AUDIT LOG ─────────────────────────────────────────────────────
function AuditLogReport() {
  const { data: logs, isLoading } = useApiQuery<any[]>(['report-audit'], '/api/v1/settings/audit-log');
  return (
    <div className="space-y-4">
      {logs?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(logs, 'audit_log')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      {isLoading ? <LoadingSpinner /> : !logs?.length ? <EmptyState title="No audit logs" icon={<Shield className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Collection</TableHead></TableRow></TableHeader>
          <TableBody>{logs.map((l: any, i: number) => (
            <TableRow key={i}>
              <TableCell className="text-xs whitespace-nowrap">{formatDate(l.createdAt)}</TableCell>
              <TableCell className="text-xs">{l.actorUid}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{l.action}</Badge></TableCell>
              <TableCell className="text-xs font-mono">{l.targetCollection}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── STAFF ATTENDANCE ──────────────────────────────────────────────
function StaffAttendanceReport() {
  const [from, setFrom] = useState(format(new Date(), 'yyyy-MM-01'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data, isLoading, refetch } = useApiQuery<any[]>(
    ['report-staff-att', from, to], '/api/v1/attendance/report', { from, to, type: 'staff' }, { enabled: false }
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div><Label>From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-36" /></div>
        <Button onClick={() => refetch()}>Generate</Button>
        {data?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(data, 'staff_attendance')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      </div>
      {isLoading ? <LoadingSpinner /> : !data?.length ? <EmptyState title="Select range and click Generate" icon={<UserCheck className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
          <TableBody>{data.map((r: any, i: number) => (
            <TableRow key={i}><TableCell>{formatDate(r.date)}</TableCell><TableCell className="text-green-600">{r.present}</TableCell><TableCell className="text-red-600">{r.absent}</TableCell>
              <TableCell><Badge variant={r.total > 0 && Math.round((r.present/r.total)*100) >= 75 ? 'default' : 'destructive'}>{r.total > 0 ? Math.round((r.present/r.total)*100) : 0}%</Badge></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── HOMEWORK SUMMARY ──────────────────────────────────────────────
function HomeworkSummary() {
  const { data: homework, isLoading } = useApiQuery<any[]>(['report-hw'], '/api/v1/homework');
  return (
    <div className="space-y-4">
      {homework?.length ? <Button variant="outline" size="sm" onClick={() => exportToExcel(homework, 'homework_report')}><Download className="h-4 w-4 mr-2" />Export Excel</Button> : null}
      {isLoading ? <LoadingSpinner /> : !homework?.length ? <EmptyState title="No homework data" icon={<BookMarked className="h-10 w-10" />} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead>Due Date</TableHead><TableHead>Submissions</TableHead></TableRow></TableHeader>
          <TableBody>{homework.map((h: any, i: number) => (
            <TableRow key={i}><TableCell className="font-medium">{h.title}</TableCell><TableCell>{h.className}</TableCell><TableCell>{h.subjectId}</TableCell><TableCell>{h.dueDate}</TableCell><TableCell>{h.submissions || 0}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────
const tabs = [
  { value: 'attendance', label: 'Attendance', component: <AttendanceReport /> },
  { value: 'fees',       label: 'Fees',       component: <FeeReport /> },
  { value: 'exams',      label: 'Exams',      component: <ExamResults /> },
  { value: 'homework',   label: 'Homework',   component: <HomeworkSummary /> },
  { value: 'library',    label: 'Library',    component: <LibraryReport /> },
  { value: 'inventory',  label: 'Inventory',  component: <InventoryReport /> },
  { value: 'staff-att',  label: 'Staff Att.', component: <StaffAttendanceReport /> },
  { value: 'audit',      label: 'Audit Log',  component: <AuditLogReport /> },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Generate and export ERP reports" />
      <Tabs defaultValue="attendance">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {tabs.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value}>
            <Card><CardContent className="p-4">{t.component}</CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

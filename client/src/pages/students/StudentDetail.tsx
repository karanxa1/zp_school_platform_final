import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowLeft, Printer, User } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Student { studentId: string; name: string; admissionNumber: string; classId: string; sectionId: string; gender?: string; dateOfBirth?: string; phone?: string; parentPhone?: string; address?: string; bloodGroup?: string; isActive: boolean; photoUrl?: string; }
interface AttRecord { attendanceId: string; date: string; status: string; }
interface FeeRecord { feeId: string; componentName: string; paidAmount: number; balance: number; status: string; paidAt: string; receiptNumber: string; }
interface Mark { examId: string; subjectId: string; marksObtained: number; grade: string; }

function ProfileTab({ s }: { s: Student }) {
  const fields: [string, string][] = [
    ['Admission No.', s.admissionNumber], ['Class', s.classId], ['Section', s.sectionId],
    ['Gender', s.gender || '—'], ['Date of Birth', formatDate(s.dateOfBirth)],
    ['Blood Group', s.bloodGroup || '—'], ['Phone', s.phone || '—'],
    ['Parent Phone', s.parentPhone || '—'], ['Address', s.address || '—'],
  ];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {s.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{s.name}</h2>
            <Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fields.map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm">{val}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceTab({ studentId }: { studentId: string }) {
  const { data: records, isLoading } = useApiQuery<AttRecord[]>(['att-student', studentId], `/api/v1/attendance/student/${studentId}`);
  if (isLoading) return <LoadingSpinner />;
  const total = records?.length || 0;
  const present = records?.filter(r => r.status === 'present').length || 0;
  const absent = records?.filter(r => r.status === 'absent').length || 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[['Present', present, 'text-green-600'], ['Absent', absent, 'text-red-600'], ['Attendance %', `${pct}%`, pct < 75 ? 'text-red-600' : 'text-green-600']].map(([l, v, c]) => (
          <Card key={String(l)}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-muted-foreground">{l}</p></CardContent></Card>
        ))}
      </div>
      {!records?.length ? <EmptyState icon={<User className="h-8 w-8" />} title="No attendance records" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Status</th></tr></thead>
            <tbody>{records.slice(0, 30).map(r => (
              <tr key={r.attendanceId} className="border-b last:border-0">
                <td className="py-2 px-3">{formatDate(r.date)}</td>
                <td className="py-2 px-3"><Badge variant={r.status === 'present' ? 'default' : 'destructive'} className="capitalize">{r.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FeesTab({ studentId }: { studentId: string }) {
  const { data: records, isLoading } = useApiQuery<FeeRecord[]>(['fees-student', studentId], `/api/v1/fees/records/${studentId}`);
  if (isLoading) return <LoadingSpinner />;
  if (!records?.length) return <EmptyState icon={<User className="h-8 w-8" />} title="No fee records" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50"><th className="text-left py-2 px-3">Component</th><th className="text-left py-2 px-3">Paid</th><th className="text-left py-2 px-3">Balance</th><th className="text-left py-2 px-3">Status</th><th className="text-left py-2 px-3">Receipt</th></tr></thead>
        <tbody>{records.map(r => (
          <tr key={r.feeId} className="border-b last:border-0">
            <td className="py-2 px-3">{r.componentName}</td>
            <td className="py-2 px-3">{formatCurrency(r.paidAmount)}</td>
            <td className="py-2 px-3">{formatCurrency(r.balance)}</td>
            <td className="py-2 px-3"><Badge variant={r.status === 'paid' ? 'default' : 'destructive'} className="capitalize">{r.status}</Badge></td>
            <td className="py-2 px-3"><Link to={`/fees/receipt/${r.feeId}`} className="text-primary text-xs hover:underline">{r.receiptNumber}</Link></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function ExamsTab({ studentId }: { studentId: string }) {
  const { data: marks, isLoading } = useApiQuery<Mark[]>(['marks-student', studentId], `/api/v1/exams/marks/student/${studentId}`);
  if (isLoading) return <LoadingSpinner />;
  if (!marks?.length) return <EmptyState icon={<User className="h-8 w-8" />} title="No exam records" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50"><th className="text-left py-2 px-3">Subject</th><th className="text-left py-2 px-3">Marks</th><th className="text-left py-2 px-3">Grade</th></tr></thead>
        <tbody>{marks.map((m, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-2 px-3">{m.subjectId}</td>
            <td className="py-2 px-3">{m.marksObtained}</td>
            <td className="py-2 px-3"><Badge>{m.grade}</Badge></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: student, isLoading } = useApiQuery<Student>(['student', id!], `/api/v1/students/${id}`);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!student) return <EmptyState icon={<User className="h-10 w-10" />} title="Student not found" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/students"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print ID Card</Button>
      </div>
      <PageHeader title={student.name} description={`Admission No: ${student.admissionNumber}`} />
      <Tabs defaultValue="profile" className="mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab s={student} /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab studentId={id!} /></TabsContent>
        <TabsContent value="fees"><FeesTab studentId={id!} /></TabsContent>
        <TabsContent value="exams"><ExamsTab studentId={id!} /></TabsContent>
      </Tabs>
    </div>
  );
}

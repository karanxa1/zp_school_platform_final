import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiQuery } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, FileText } from 'lucide-react';

interface Mark {
  subjectId: string; subjectName?: string; marksObtained: number; maxMarks: number;
  grade: string; percentage: number; rank?: number;
}
interface Exam { examId: string; name: string; startDate: string; }
interface Student { studentId: string; name: string; admissionNumber: string; classId: string; }

export default function ReportCard() {
  const { examId, studentId } = useParams<{ examId: string; studentId: string }>();
  const { data: marks, isLoading: mLoading } = useApiQuery<Mark[]>(
    ['rc-marks', examId!, studentId!], `/api/v1/exams/${examId}/marks`, { studentId }
  );
  const { data: exam } = useApiQuery<Exam>(['rc-exam', examId!], `/api/v1/exams/${examId}`);
  const { data: student } = useApiQuery<Student>(['rc-student', studentId!], `/api/v1/students/${studentId}`);

  const school = { name: 'ZP School', address: 'Maharashtra, India' };

  if (mLoading) return <LoadingSpinner fullPage />;
  if (!marks?.length) return <EmptyState icon={<FileText className="h-10 w-10" />} title="No marks found for this student" />;

  const totalObtained = marks.reduce((s, m) => s + m.marksObtained, 0);
  const totalMax = marks.reduce((s, m) => s + m.maxMarks, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B+' : overallPct >= 60 ? 'B' : overallPct >= 50 ? 'C' : overallPct >= 40 ? 'D' : 'F';

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Controls — hidden in print */}
      <div className="flex gap-3 mb-6 print:hidden">
        <Link to="/exams"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print Report Card</Button>
      </div>

      {/* Report Card */}
      <div className="border-2 border-gray-800 rounded-lg overflow-hidden print:border-black" id="report-card">
        {/* School Header */}
        <div className="bg-primary text-primary-foreground text-center py-4 px-6 print:bg-gray-800">
          <h1 className="text-xl font-bold uppercase tracking-wide">{school.name}</h1>
          <p className="text-sm opacity-80">{school.address}</p>
          <h2 className="text-base font-semibold mt-1">PROGRESS REPORT CARD</h2>
        </div>

        {/* Student + Exam Info */}
        <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/20">
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Student: </span><span className="font-semibold">{student?.name || studentId}</span></div>
            <div><span className="text-muted-foreground">Admission No: </span><span>{student?.admissionNumber || '—'}</span></div>
            <div><span className="text-muted-foreground">Class: </span><span>{student?.classId || '—'}</span></div>
          </div>
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Exam: </span><span className="font-semibold">{exam?.name || examId}</span></div>
            <div><span className="text-muted-foreground">Date: </span><span>{exam?.startDate || '—'}</span></div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="p-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-gray-300 px-3 py-2 text-left">Subject</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Max Marks</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Marks Obtained</th>
                <th className="border border-gray-300 px-3 py-2 text-center">%</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m, i) => {
                const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="border border-gray-300 px-3 py-2 font-medium">{m.subjectName || m.subjectId}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{m.maxMarks}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{m.marksObtained}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{pct}%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className={`font-bold ${pct >= 60 ? 'text-green-700' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{m.grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/30">
                <td className="border border-gray-300 px-3 py-2">TOTAL</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{totalMax}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{totalObtained}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{overallPct}%</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className={`font-bold text-base ${overallPct >= 60 ? 'text-green-700' : overallPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{overallGrade}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Result Summary */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
          <div className="flex gap-6 text-sm">
            <div><span className="text-muted-foreground">Overall: </span><span className="font-bold text-lg">{overallPct}%</span></div>
            <div><span className="text-muted-foreground">Grade: </span><span className="font-bold text-lg text-primary">{overallGrade}</span></div>
            <div><span className="text-muted-foreground">Result: </span>
              <Badge variant={overallPct >= 40 ? 'default' : 'destructive'}>{overallPct >= 40 ? 'PASS' : 'FAIL'}</Badge>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="flex justify-between px-6 py-4 border-t text-xs text-muted-foreground">
          <span>Class Teacher Signature</span>
          <span>Principal Signature</span>
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } body { margin: 0; } }`}</style>
    </div>
  );
}

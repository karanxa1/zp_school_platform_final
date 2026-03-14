import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiQuery } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

interface Student {
  studentId: string; name: string; admissionNo: string; admissionNumber?: string;
  className: string; section?: string; gender?: string; dob?: string; bloodGroup?: string;
  parentName?: string; parentPhone?: string; photo?: string;
}
interface School { name: string; address: string; phone?: string; logo?: string; }

export default function StudentIdCard() {
  const { id } = useParams<{ id: string }>();
  const { data: student, isLoading: sLoading } = useApiQuery<Student>(['student', id!], `/api/v1/students/${id}`);
  const { data: school } = useApiQuery<School>(['school-profile'], '/api/v1/settings/school');

  if (sLoading) return <LoadingSpinner fullPage />;

  const adm = student?.admissionNumber || student?.admissionNo || student?.admissionNumber || id;

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Controls — hidden in print */}
      <div className="flex gap-3 mb-6 print:hidden">
        <Link to={`/students/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Print ID Card
        </Button>
      </div>

      {/* Card */}
      <div className="flex justify-center">
        <div
          id="id-card"
          className="border-2 border-primary rounded-2xl overflow-hidden w-80 shadow-xl print:shadow-none"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 text-center">
            <p className="font-bold text-sm uppercase tracking-wider">{school?.name || 'ZP School'}</p>
            <p className="text-[10px] opacity-80 mt-0.5">{school?.address || ''}</p>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-background p-4">
            {/* Photo + Name */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-full border-2 border-primary bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {student?.photo
                  ? <img src={student.photo} alt="photo" className="h-full w-full object-cover" />
                  : <span className="text-3xl font-bold text-primary">
                      {student?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                }
              </div>
              <div>
                <p className="font-bold text-base text-foreground leading-tight">{student?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Class {student?.className}{student?.section ? ` – ${student.section}` : ''}</p>
                <p className="text-xs font-mono text-primary font-semibold mt-0.5">{adm}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-y-1.5 text-xs border-t pt-3">
              {[
                ['Gender', student?.gender],
                ['Date of Birth', student?.dob],
                ['Blood Group', student?.bloodGroup || '—'],
                ['Parent', student?.parentName],
                ['Contact', student?.parentPhone],
                ['School Ph.', school?.phone],
              ].map(([label, value]) => value && (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/50 px-4 py-2 text-center border-t">
            <p className="text-[10px] text-muted-foreground">If found, please return to the school.</p>
            <p className="text-[10px] font-medium mt-0.5">{school?.phone || ''}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          #id-card { border-color: #000 !important; box-shadow: none !important; }
          body { margin: 0; background: white; }
          @page { size: 85mm 54mm; margin: 2mm; }
        }
      `}</style>
    </div>
  );
}

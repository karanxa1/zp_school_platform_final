import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

export default function ReportsList() {
  const [loading, setLoading] = useState(false);
  const { role } = useAuth();
  const api = useApi();
  
  if (!['super_admin', 'principal'].includes(role || '')) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const generateReport = async (type: string) => {
    setLoading(true);
    try {
      const response = await api.fetchApi('/system/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          report_type: type.toLowerCase(),
          start_date: '2023-01-01',
          end_date: '2023-12-31'
        })
      });
      alert(`${type} report generated. URL: ${response.url}`);
    } catch (error) {
      console.error('Failed to generate report', error);
      alert('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Extract comprehensive data insights and statements.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Attendance Report */}
        <div className="glass-panel p-6 border rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Attendance Ledger</h3>
            <p className="text-sm text-muted-foreground mt-2">Generate PDF registers for staff and students across selected date ranges.</p>
          </div>
          <Button disabled={loading} onClick={() => generateReport('Attendance')} className="w-full">Generate PDF</Button>
        </div>

        {/* Financial Report */}
        <div className="glass-panel p-6 border rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Financial Statements</h3>
            <p className="text-sm text-muted-foreground mt-2">Export fee collections, dues, and staff payroll records for auditing.</p>
          </div>
          <Button disabled={loading} onClick={() => generateReport('Financial')} className="w-full">Generate PDF</Button>
        </div>

        {/* Academic Report */}
        <div className="glass-panel p-6 border rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Academic Summaries</h3>
            <p className="text-sm text-muted-foreground mt-2">Institution-wide performance breakdowns, class averages, and rank lists.</p>
          </div>
          <Button disabled={loading} onClick={() => generateReport('Academic')} className="w-full">Generate PDF</Button>
        </div>
      </div>
    </div>
  );
}

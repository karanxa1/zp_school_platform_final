import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Button } from '@/components/ui/button';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  grade: string;
  section: string;
  roll_number: number;
  attendance_percentage: number;
  total_fees_paid: number;
}

export default function ParentDashboard() {
  const { role } = useAuth();
  const api = useApi();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childDetails, setChildDetails] = useState<any>(null);

  useEffect(() => {
    if (role === 'parent') {
      loadChildren();
    }
  }, [role]);

  const loadChildren = async () => {
    try {
      const data = await api.fetchApi('/parents/dashboard');
      setChildren(data.children || []);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildDetails = async (childId: string) => {
    try {
      const data = await api.fetchApi(`/students/${childId}/detailed`);
      setChildDetails(data);
      setSelectedChild(childId);
    } catch (error) {
      console.error('Failed to load child details:', error);
    }
  };

  if (role !== 'parent') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">This page is only accessible to parents.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parent Dashboard</h2>
        <p className="text-muted-foreground">View your children's academic progress and information.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <div key={child.id} className="glass-panel border rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{child.first_name} {child.last_name}</h3>
                <p className="text-sm text-muted-foreground">Grade {child.grade} - {child.section}</p>
                <p className="text-xs text-muted-foreground">Roll No: {child.roll_number}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className={`h-full rounded-full ${child.attendance_percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${child.attendance_percentage}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${child.attendance_percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                    {child.attendance_percentage}%
                  </span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Fees Paid</p>
                <p className="text-lg font-bold">₹{child.total_fees_paid.toLocaleString()}</p>
              </div>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => loadChildDetails(child.id)}
            >
              View Full Details
            </Button>
          </div>
        ))}

        {children.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No children linked to your account yet.
          </div>
        )}
      </div>

      {selectedChild && childDetails && (
        <div className="glass-panel border rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold">{childDetails.first_name} {childDetails.last_name}</h3>
              <p className="text-muted-foreground">Detailed Information</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedChild(null)}>Close</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Attendance Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Attendance Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Days:</span>
                  <span className="font-medium">{childDetails.attendance_summary?.total_days || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Present:</span>
                  <span className="font-medium text-green-600">{childDetails.attendance_summary?.present_days || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Absent:</span>
                  <span className="font-medium text-red-600">{childDetails.attendance_summary?.absent_days || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Percentage:</span>
                  <span className="font-bold text-lg">{childDetails.attendance_summary?.percentage || 0}%</span>
                </div>
              </div>
            </div>

            {/* Fee Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Fee Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Paid:</span>
                  <span className="font-medium">₹{childDetails.fee_summary?.total_paid?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Payments Made:</span>
                  <span className="font-medium">{childDetails.fee_summary?.payment_count || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Exams */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Recent Exam Results</h4>
            {childDetails.recent_exams && childDetails.recent_exams.length > 0 ? (
              <div className="space-y-2">
                {childDetails.recent_exams.map((exam: any, idx: number) => (
                  <div key={idx} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{exam.exam_name}</p>
                        <p className="text-sm text-muted-foreground">{exam.remarks}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{exam.grade}</p>
                        <p className="text-xs text-muted-foreground">{exam.total_marks} marks</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exam results available yet.</p>
            )}
          </div>

          {/* Pending Homework */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Pending Homework</h4>
            {childDetails.homework_pending && childDetails.homework_pending.length > 0 ? (
              <div className="space-y-2">
                {childDetails.homework_pending.map((hw: any) => (
                  <div key={hw.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{hw.title}</p>
                        <p className="text-sm text-muted-foreground">{hw.subject}</p>
                      </div>
                      <p className="text-xs text-red-600 font-medium">Due: {hw.due_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">All homework completed! 🎉</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

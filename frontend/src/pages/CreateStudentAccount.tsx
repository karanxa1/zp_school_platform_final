import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function CreateStudentAccount() {
  const { role } = useAuth();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    admission_number: '',
    grade: '',
    section: '',
    roll_number: '',
    dob: '',
    gender: 'Male',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    blood_group: '',
    student_password: '',
    parent_password: '',
    create_parent_account: false
  });

  const canCreate = ['super_admin', 'principal', 'teacher'].includes(role || '');

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to create student accounts.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...formData,
        roll_number: Number(formData.roll_number),
        create_firebase_account: true
      };

      const response = await api.fetchApi('/students/with-account', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setResult(response);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        admission_number: '',
        grade: '',
        section: '',
        roll_number: '',
        dob: '',
        gender: 'Male',
        address: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        blood_group: '',
        student_password: '',
        parent_password: '',
        create_parent_account: false
      });
    } catch (error: any) {
      alert(`Failed to create account: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Student Account</h2>
        <p className="text-muted-foreground">Create a new student with Firebase authentication and optional parent linking.</p>
      </div>

      {result && (
        <div className="glass-panel border-2 border-green-500 rounded-xl p-6 space-y-4 bg-green-50">
          <div className="flex items-start gap-3">
            <div className="text-3xl">✅</div>
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold text-green-800">Account Created Successfully!</h3>
              
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-green-800">Student Credentials</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono font-medium">{result.student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-mono font-medium">{result.student.password}</span>
                  </div>
                  {result.student.password_was_generated && (
                    <p className="text-xs text-orange-600 mt-2">⚠️ Password was auto-generated</p>
                  )}
                </div>
              </div>

              {result.parent && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-green-800">Parent Credentials</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono font-medium">{result.parent.email}</span>
                    </div>
                    {result.parent.password && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Password:</span>
                          <span className="font-mono font-medium">{result.parent.password}</span>
                        </div>
                        {result.parent.password_was_generated && (
                          <p className="text-xs text-orange-600 mt-2">⚠️ Password was auto-generated</p>
                        )}
                      </>
                    )}
                    {result.parent.already_existed && (
                      <p className="text-xs text-blue-600 mt-2">ℹ️ Parent account already existed</p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Important: Save these credentials securely. They cannot be retrieved later.
                </p>
              </div>

              <Button onClick={() => setResult(null)} className="w-full">
                Create Another Student
              </Button>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <form onSubmit={handleSubmit} className="glass-panel border rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Student Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Password (optional)</Label>
                <Input 
                  type="text" 
                  placeholder="Leave blank to auto-generate"
                  value={formData.student_password || ''} 
                  onChange={e => setFormData({...formData, student_password: e.target.value})} 
                />
                <p className="text-xs text-muted-foreground">Min 6 characters. Auto-generated if left blank.</p>
              </div>

              <div className="space-y-2">
                <Label>Admission Number *</Label>
                <Input required value={formData.admission_number} onChange={e => setFormData({...formData, admission_number: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Roll Number *</Label>
                <Input type="number" required value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Grade *</Label>
                <Input required placeholder="e.g., 10" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Section *</Label>
                <Input required placeholder="e.g., A" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <select 
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Input placeholder="e.g., O+" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Address *</Label>
                <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Parent Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Name *</Label>
                <Input required value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Parent Phone *</Label>
                <Input required value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Parent Email</Label>
                <Input 
                  type="email" 
                  placeholder="Optional - for parent portal access"
                  value={formData.parent_email} 
                  onChange={e => setFormData({...formData, parent_email: e.target.value})} 
                />
              </div>

              {formData.parent_email && (
                <div className="space-y-2">
                  <Label>Parent Password (optional)</Label>
                  <Input 
                    type="text" 
                    placeholder="Leave blank to auto-generate"
                    value={formData.parent_password || ''} 
                    onChange={e => setFormData({...formData, parent_password: e.target.value})} 
                  />
                  <p className="text-xs text-muted-foreground">Only used if creating new parent account</p>
                </div>
              )}

              {formData.parent_email && (
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={formData.create_parent_account}
                      onChange={e => setFormData({...formData, create_parent_account: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Create parent account if doesn't exist</span>
                  </label>
                  <p className="text-xs text-muted-foreground ml-6">
                    If unchecked and parent doesn't exist, student will be created without parent link
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Student Account'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

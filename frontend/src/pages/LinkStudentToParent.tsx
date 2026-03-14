import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  grade: string;
  section: string;
  roll_number: number;
  admission_number: string;
  parent_email?: string;
  parent_uid?: string;
}

export default function LinkStudentToParent() {
  const { role } = useAuth();
  const api = useApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const [parentForm, setParentForm] = useState({
    parent_email: '',
    parent_password: '',
    create_parent_if_not_exists: true
  });

  const canLink = ['super_admin', 'principal', 'teacher'].includes(role || '');

  useEffect(() => {
    if (canLink) {
      loadStudents();
    }
  }, [canLink]);

  useEffect(() => {
    // Filter students based on search term
    if (searchTerm) {
      const filtered = students.filter(s => 
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number.toString().includes(searchTerm)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const loadStudents = async () => {
    try {
      const data = await api.fetchApi('/students/');
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setResult(null);
    // Pre-fill parent email if exists
    if (student.parent_email) {
      setParentForm({
        ...parentForm,
        parent_email: student.parent_email
      });
    }
  };

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const response = await api.fetchApi('/students/link-parent', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedStudent.id,
          parent_email: parentForm.parent_email,
          create_parent_if_not_exists: parentForm.create_parent_if_not_exists
        })
      });

      setResult(response);
      
      // Reload students to update the list
      await loadStudents();
      
      // Reset form
      setParentForm({
        parent_email: '',
        parent_password: '',
        create_parent_if_not_exists: true
      });
    } catch (error: any) {
      alert(`Failed to link parent: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!canLink) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to link students to parents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Link Student to Parent Account</h2>
        <p className="text-muted-foreground">Select an enrolled student and assign them to a parent account for portal access.</p>
      </div>

      {result && (
        <div className="glass-panel border-2 border-green-500 rounded-xl p-6 space-y-4 bg-green-50">
          <div className="flex items-start gap-3">
            <div className="text-3xl">✅</div>
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold text-green-800">Successfully Linked!</h3>
              
              <div className="bg-white rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Student:</span> {selectedStudent?.first_name} {selectedStudent?.last_name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Parent Email:</span> {result.parent?.email}
                </p>
                
                {result.parent?.password && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">Parent Login Credentials:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-mono font-medium">{result.parent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Password:</span>
                        <span className="font-mono font-medium">{result.parent.password}</span>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">⚠️ Save these credentials - they won't be shown again!</p>
                  </div>
                )}
                
                {result.parent?.already_existed && (
                  <p className="text-xs text-blue-600 mt-2">ℹ️ Parent account already existed - student added to their children list</p>
                )}
              </div>

              <Button onClick={() => { setResult(null); setSelectedStudent(null); }} className="w-full">
                Link Another Student
              </Button>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Student Selection Panel */}
          <div className="glass-panel border rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Step 1: Select Student</h3>
              <p className="text-sm text-muted-foreground">Choose a student from the list below</p>
            </div>

            <div className="space-y-2">
              <Label>Search Students</Label>
              <Input 
                placeholder="Search by name, admission number, roll number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        {searchTerm ? 'No students found matching your search' : 'No students enrolled yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => (
                      <TableRow 
                        key={student.id}
                        className={selectedStudent?.id === student.id ? 'bg-primary/10' : ''}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-muted-foreground">Roll: {student.roll_number} • {student.admission_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.grade} - {student.section}</span>
                        </TableCell>
                        <TableCell>
                          {student.parent_email ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                ✓ Linked
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              Not Linked
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={selectedStudent?.id === student.id ? 'default' : 'outline'}
                            onClick={() => handleSelectStudent(student)}
                          >
                            {selectedStudent?.id === student.id ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Parent Assignment Panel */}
          <div className="glass-panel border rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Step 2: Assign Parent Account</h3>
              <p className="text-sm text-muted-foreground">Enter parent email to link or create account</p>
            </div>

            {selectedStudent ? (
              <>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Selected Student:</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</span></p>
                    <p><span className="text-muted-foreground">Class:</span> <span className="font-medium">{selectedStudent.grade} - {selectedStudent.section}</span></p>
                    <p><span className="text-muted-foreground">Roll No:</span> <span className="font-medium">{selectedStudent.roll_number}</span></p>
                    <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedStudent.email}</span></p>
                    {selectedStudent.parent_email && (
                      <p className="mt-2 text-xs text-blue-600">
                        ℹ️ Currently linked to: {selectedStudent.parent_email}
                      </p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleLinkParent} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Email *</Label>
                    <Input 
                      type="email"
                      required
                      placeholder="parent@email.com"
                      value={parentForm.parent_email}
                      onChange={e => setParentForm({...parentForm, parent_email: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      If this email exists, student will be added to their children list
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Parent Password (optional)</Label>
                    <Input 
                      type="text"
                      placeholder="Leave blank to auto-generate"
                      value={parentForm.parent_password}
                      onChange={e => setParentForm({...parentForm, parent_password: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only used if creating a new parent account
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        checked={parentForm.create_parent_if_not_exists}
                        onChange={e => setParentForm({...parentForm, create_parent_if_not_exists: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Create parent account if doesn't exist</span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">
                      If unchecked and parent doesn't exist, linking will fail
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedStudent(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Linking...' : 'Link to Parent'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div className="space-y-2">
                  <div className="text-5xl">👈</div>
                  <p className="text-muted-foreground">Select a student from the list to continue</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="glass-panel border rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-lg">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-2xl">1️⃣</div>
            <p className="font-medium">Select Student</p>
            <p className="text-muted-foreground">Choose an enrolled student from the list. You can search by name, roll number, or admission number.</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">2️⃣</div>
            <p className="font-medium">Enter Parent Email</p>
            <p className="text-muted-foreground">Provide the parent's email address. If they already have an account, the student will be added to their children list.</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">3️⃣</div>
            <p className="font-medium">Create or Link</p>
            <p className="text-muted-foreground">If the parent account doesn't exist, a new one will be created with the provided or auto-generated password.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

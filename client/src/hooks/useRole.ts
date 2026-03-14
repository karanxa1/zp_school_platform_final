import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export function useRole() {
  const { role } = useAuth();
  const hasRole = (r: Role | Role[]) => {
    if (!role) return false;
    if (Array.isArray(r)) return r.includes(role);
    return role === r;
  };
  const isAdmin = hasRole(['superadmin', 'principal']);
  const isTeacher = hasRole('teacher');
  const isStudent = hasRole('student');
  const isParent = hasRole('parent');
  return { role, hasRole, isAdmin, isTeacher, isStudent, isParent };
}

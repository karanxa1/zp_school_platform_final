import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/attendance.controller';

const r = Router();
r.post('/mark', verifyToken, checkRole(['teacher','principal','superadmin']), c.markAttendance);
r.get('/class', verifyToken, c.getClassAttendance);
r.get('/student/:studentId', verifyToken, c.getStudentAttendance);
r.get('/report/class', verifyToken, c.getAttendanceReport);
r.post('/staff/mark', verifyToken, checkRole(['superadmin','principal']), c.markStaffAttendance);
r.get('/staff/report', verifyToken, checkRole(['superadmin','principal']), c.getStaffAttendanceReport);
// Leave
r.post('/leave/apply', verifyToken, c.applyLeave);
r.get('/leave', verifyToken, checkRole(['superadmin','principal']), c.listLeaveRequests);
r.put('/leave/:leaveId', verifyToken, checkRole(['superadmin','principal']), c.updateLeaveRequest);
export default r;

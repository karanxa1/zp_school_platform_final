import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/complaints.controller';

const r = Router();
r.post('/', verifyToken, c.submitComplaint);
r.get('/', verifyToken, checkRole(['superadmin','principal']), c.listComplaints);
r.get('/my', verifyToken, c.getMyComplaints);
r.put('/:complaintId/assign', verifyToken, checkRole(['superadmin','principal']), c.assignComplaint);
r.put('/:complaintId/status', verifyToken, checkRole(['superadmin','principal']), c.updateComplaintStatus);
export default r;

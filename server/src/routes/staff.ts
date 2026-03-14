import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/staff.controller';

const r = Router();
r.get('/', verifyToken, c.listStaff);
r.post('/', verifyToken, checkRole(['superadmin','principal']), c.createStaff);
r.get('/:staffId', verifyToken, c.getStaff);
r.put('/:staffId', verifyToken, checkRole(['superadmin','principal']), c.updateStaff);
r.delete('/:staffId', verifyToken, checkRole(['superadmin','principal']), c.deleteStaff);
export default r;

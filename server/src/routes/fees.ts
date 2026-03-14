import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/fees.controller';

const r = Router();
r.post('/structure', verifyToken, checkRole(['superadmin','principal']), c.createFeeStructure);
r.get('/structure/:classId', verifyToken, c.getFeeStructure);
r.put('/structure/:feeStructureId', verifyToken, checkRole(['superadmin','principal']), c.updateFeeStructure);
r.post('/collect', verifyToken, checkRole(['superadmin','principal']), c.collectFee);
r.get('/records/:studentId', verifyToken, c.getStudentFeeRecords);
r.get('/pending', verifyToken, c.getPendingFees);
r.post('/discount', verifyToken, checkRole(['superadmin','principal']), c.applyDiscount);
r.get('/report/daily', verifyToken, c.getDailyFeeReport);
r.get('/report/monthly', verifyToken, c.getMonthlyFeeReport);
r.get('/receipt/:feeId', verifyToken, c.getFeeReceipt);
export default r;

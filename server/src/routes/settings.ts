import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/settings.controller';

const r = Router();
r.get('/:docId', verifyToken, c.getSettings);
r.put('/:docId', verifyToken, checkRole(['superadmin']), c.updateSettings);
r.get('/academic-years/list', verifyToken, c.listAcademicYears);
r.post('/academic-years', verifyToken, checkRole(['superadmin']), c.createAcademicYear);
r.put('/academic-years/:yearId/activate', verifyToken, checkRole(['superadmin']), c.setActiveAcademicYear);
r.get('/audit-logs/list', verifyToken, checkRole(['superadmin']), c.getAuditLogs);
export default r;

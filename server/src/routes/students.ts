import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/students.controller';

const r = Router();
r.get('/', verifyToken, c.listStudents);
r.post('/', verifyToken, checkRole(['superadmin','principal']), c.createStudent);
r.post('/bulk-import', verifyToken, checkRole(['superadmin','principal']), c.bulkImportStudents);
r.get('/:studentId', verifyToken, c.getStudent);
r.put('/:studentId', verifyToken, checkRole(['superadmin','principal']), c.updateStudent);
r.delete('/:studentId', verifyToken, checkRole(['superadmin','principal']), c.deleteStudent);
r.get('/:studentId/id-card', verifyToken, c.getStudentIdCard);
r.post('/:studentId/transfer-certificate', verifyToken, checkRole(['superadmin','principal']), c.generateTC);
export default r;

import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/homework.controller';

const r = Router();
r.get('/', verifyToken, c.listHomework);
r.post('/', verifyToken, checkRole(['teacher']), c.createHomework);
r.get('/student/:studentId', verifyToken, c.getStudentHomework);
r.get('/:homeworkId', verifyToken, c.getHomework);
r.put('/:homeworkId', verifyToken, checkRole(['teacher']), c.updateHomework);
r.delete('/:homeworkId', verifyToken, checkRole(['teacher']), c.deleteHomework);
r.post('/:homeworkId/submit', verifyToken, checkRole(['student']), c.submitAssignment);
r.get('/:homeworkId/submissions', verifyToken, checkRole(['teacher','principal','superadmin']), c.getSubmissions);
r.put('/submissions/:assignmentId/grade', verifyToken, checkRole(['teacher']), c.gradeSubmission);
export default r;

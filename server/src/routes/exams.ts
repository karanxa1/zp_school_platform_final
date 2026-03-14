import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/exams.controller';

const r = Router();
r.post('/', verifyToken, checkRole(['superadmin','principal']), c.createExam);
r.get('/', verifyToken, c.listExams);
r.post('/schedule', verifyToken, checkRole(['superadmin','principal']), c.addExamSchedule);
r.get('/schedule/:examId', verifyToken, c.getExamSchedule);
r.post('/marks', verifyToken, checkRole(['teacher','superadmin','principal']), c.enterMarks);
r.get('/marks/:examId/:subjectId', verifyToken, c.getMarksSheet);
r.post('/report-card/generate/:examId/:classId', verifyToken, checkRole(['superadmin','principal']), c.generateReportCards);
r.get('/report-card/:studentId/:examId', verifyToken, c.getReportCard);
r.get('/result/:studentId', verifyToken, c.getStudentResults);
export default r;

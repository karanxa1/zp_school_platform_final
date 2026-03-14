import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import * as c from '../controllers/academics.controller';

const r = Router();
// Classes
r.get('/classes', verifyToken, c.listClasses);
r.post('/classes', verifyToken, c.createClass);
r.put('/classes/:classId', verifyToken, c.updateClass);
r.delete('/classes/:classId', verifyToken, c.deleteClass);
// Sections
r.get('/sections', verifyToken, c.listSections);
r.post('/sections', verifyToken, c.createSection);
r.put('/sections/:sectionId', verifyToken, c.updateSection);
r.delete('/sections/:sectionId', verifyToken, c.deleteSection);
// Subjects
r.get('/subjects', verifyToken, c.listSubjects);
r.post('/subjects', verifyToken, c.createSubject);
r.put('/subjects/:subjectId', verifyToken, c.updateSubject);
r.delete('/subjects/:subjectId', verifyToken, c.deleteSubject);
// Timetable
r.get('/timetable', verifyToken, c.getTimetable);
r.post('/timetable', verifyToken, c.saveTimetable);
export default r;

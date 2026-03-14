import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

export const createHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeworkId = uuidv4();
    const data = { homeworkId, teacherId: req.user!.uid, ...req.body, createdAt: new Date().toISOString() };
    await db.collection('homework').doc(homeworkId).set(data);
    res.status(201).json({ success: true, data, message: 'Homework created' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const listHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, subjectId, teacherId } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('homework');
    if (classId) query = query.where('classId', '==', classId);
    if (sectionId) query = query.where('sectionId', '==', sectionId);
    if (subjectId) query = query.where('subjectId', '==', subjectId);
    if (teacherId) query = query.where('teacherId', '==', teacherId);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('homework').doc(req.params.homeworkId).get();
    if (!doc.exists) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: doc.data(), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.collection('homework').doc(req.params.homeworkId).update(req.body);
    res.json({ success: true, data: {}, message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const deleteHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.collection('homework').doc(req.params.homeworkId).delete();
    res.json({ success: true, data: {}, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignmentId = uuidv4();
    const data = { assignmentId, homeworkId: req.params.homeworkId, studentId: req.user!.uid, status: 'submitted', submittedAt: new Date().toISOString(), ...req.body };
    await db.collection('assignments').doc(assignmentId).set(data);
    res.status(201).json({ success: true, data, message: 'Submitted' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('assignments').where('homeworkId', '==', req.params.homeworkId).get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade, feedback } = req.body;
    await db.collection('assignments').doc(req.params.assignmentId).update({ grade, feedback, gradedBy: req.user!.uid, status: 'graded', gradedAt: new Date().toISOString() });
    res.json({ success: true, data: {}, message: 'Graded' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getStudentHomework = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentDoc = await db.collection('students').where('uid', '==', req.params.studentId).limit(1).get();
    if (studentDoc.empty) { res.status(404).json({ success: false, error: 'Student not found' }); return; }
    const student = studentDoc.docs[0].data();
    const hwSnap = await db.collection('homework').where('classId', '==', student.classId).get();
    const hwList = hwSnap.docs.map(d => d.data());
    const assignments = await db.collection('assignments').where('studentId', '==', req.params.studentId).get();
    const assignMap: Record<string, unknown> = {};
    assignments.docs.forEach(d => { const a = d.data(); assignMap[a.homeworkId as string] = a; });
    const result = hwList.map(hw => ({ ...hw, submission: assignMap[hw.homeworkId as string] || null }));
    res.json({ success: true, data: result, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

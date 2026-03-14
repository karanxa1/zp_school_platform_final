import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db, logAudit } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_GRADE_BOUNDARIES = [
  { grade: 'A+', min: 90 }, { grade: 'A', min: 80 }, { grade: 'B+', min: 70 },
  { grade: 'B', min: 60 }, { grade: 'C', min: 50 }, { grade: 'D', min: 40 }, { grade: 'F', min: 0 },
];

async function getGradeBoundaries() {
  const doc = await db.collection('settings').doc('grades').get();
  return doc.exists ? (doc.data()?.boundaries || DEFAULT_GRADE_BOUNDARIES) : DEFAULT_GRADE_BOUNDARIES;
}

function calcGrade(marks: number, boundaries: { grade: string; min: number }[]): string {
  for (const b of boundaries) {
    if (marks >= b.min) return b.grade;
  }
  return 'F';
}

export const createExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const examId = uuidv4();
    const data = { examId, ...req.body, createdAt: new Date().toISOString() };
    await db.collection('exams').doc(examId).set(data);
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'created', targetCollection: 'exams', targetDocId: examId, newValue: data, ipAddress: req.ip });
    res.status(201).json({ success: true, data, message: 'Exam created' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const listExams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: FirebaseFirestore.Query = db.collection('exams');
    const { classId, academicYear } = req.query as Record<string, string>;
    if (classId) query = query.where('classId', '==', classId);
    if (academicYear) query = query.where('academicYear', '==', academicYear);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const addExamSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scheduleId = uuidv4();
    const data = { scheduleId, ...req.body, createdAt: new Date().toISOString() };
    await db.collection('exam_schedule').doc(scheduleId).set(data);
    res.status(201).json({ success: true, data, message: 'Schedule added' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getExamSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('exam_schedule').where('examId', '==', req.params.examId).get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const enterMarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examId, subjectId, records } = req.body as {
      examId: string; subjectId: string;
      records: { studentId: string; marksObtained: number; isAbsent: boolean }[];
    };
    const boundaries = await getGradeBoundaries();
    const batch = db.batch();
    for (const rec of records) {
      const markId = uuidv4();
      const ref = db.collection('marks').doc(markId);
      const grade = rec.isAbsent ? 'AB' : calcGrade(rec.marksObtained, boundaries);
      batch.set(ref, { markId, examId, subjectId, ...rec, grade, enteredBy: req.user!.uid, enteredAt: new Date().toISOString() });
    }
    await batch.commit();
    res.status(201).json({ success: true, data: { count: records.length }, message: 'Marks entered' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getMarksSheet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examId, subjectId } = req.params;
    const snap = await db.collection('marks')
      .where('examId', '==', examId)
      .where('subjectId', '==', subjectId)
      .get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const generateReportCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examId, classId } = req.params;
    const boundaries = await getGradeBoundaries();

    // Get all students in class
    const studentSnap = await db.collection('students').where('classId', '==', classId).where('isActive', '==', true).get();
    const students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get all marks for this exam
    const marksSnap = await db.collection('marks').where('examId', '==', examId).get();
    const allMarks = marksSnap.docs.map(d => d.data());

    // Get schedule (for max marks)
    const scheduleSnap = await db.collection('exam_schedule').where('examId', '==', examId).get();
    const schedules = scheduleSnap.docs.map(d => d.data());

    const batch = db.batch();
    const reportCards: Record<string, unknown>[] = [];

    for (const student of students) {
      const studentMarks = allMarks.filter(m => m.studentId === (student as Record<string, unknown>).id);
      const totalMarks = studentMarks.reduce((sum, m) => sum + (m.isAbsent ? 0 : (m.marksObtained as number || 0)), 0);
      const totalMaxMarks = schedules.reduce((sum, s) => sum + (s.maxMarks as number || 0), 0);
      const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;

      const reportCardId = uuidv4();
      const rcData = {
        reportCardId, studentId: (student as Record<string, unknown>).id, examId, classId,
        subjectWiseMarks: studentMarks, totalMarks, totalMaxMarks,
        percentage, grade: calcGrade(percentage, boundaries), rank: 0,
        generatedAt: new Date().toISOString(), pdfUrl: '',
      };
      batch.set(db.collection('report_cards').doc(reportCardId), rcData);
      reportCards.push(rcData);
    }

    // Assign ranks
    reportCards.sort((a, b) => (b.totalMarks as number) - (a.totalMarks as number));
    let rank = 1;
    for (const rc of reportCards) {
      await db.collection('report_cards').doc(rc.reportCardId as string).update({ rank });
      rank++;
    }

    await batch.commit();
    res.json({ success: true, data: reportCards, message: 'Report cards generated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getReportCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, examId } = req.params;
    const snap = await db.collection('report_cards')
      .where('studentId', '==', studentId)
      .where('examId', '==', examId)
      .limit(1).get();
    if (snap.empty) { res.status(404).json({ success: false, error: 'Report card not found' }); return; }
    res.json({ success: true, data: snap.docs[0].data(), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getStudentResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('report_cards').where('studentId', '==', req.params.studentId).get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

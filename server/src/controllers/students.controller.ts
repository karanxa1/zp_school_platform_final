import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db, logAudit, getPaginated } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

// Helper to auto-generate admission number: YYYY-XXXX
async function generateAdmissionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const snap = await db.collection('students')
    .where('admissionNumber', '>=', `${year}-`)
    .where('admissionNumber', '<=', `${year}-ZZZZ`)
    .get();
  const seq = String(snap.size + 1).padStart(4, '0');
  return `${year}-${seq}`;
}

export const listStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, isActive, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filters: Record<string, unknown> = {};
    if (classId) filters.classId = classId;
    if (sectionId) filters.sectionId = sectionId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await getPaginated('students', filters, parseInt(page), parseInt(limit));

    // Apply search filter in memory for name or admissionNumber
    if (search) {
      const q = search.toLowerCase();
      result.data = result.data.filter((s: Record<string, unknown>) =>
        (s.name as string)?.toLowerCase().includes(q) ||
        (s.admissionNumber as string)?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: result, message: 'Students fetched' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const getStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('students').doc(req.params.studentId).get();
    if (!doc.exists) { res.status(404).json({ success: false, error: 'Student not found' }); return; }
    res.json({ success: true, data: { id: doc.id, ...doc.data() }, message: '' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = uuidv4();
    const admissionNumber = await generateAdmissionNumber();
    const data = {
      studentId,
      admissionNumber,
      ...req.body,
      isActive: true,
      admissionDate: req.body.admissionDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.collection('students').doc(studentId).set(data);
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'created', targetCollection: 'students', targetDocId: studentId, newValue: data, ipAddress: req.ip });
    res.status(201).json({ success: true, data, message: 'Student created' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ref = db.collection('students').doc(req.params.studentId);
    const old = (await ref.get()).data();
    await ref.update({ ...req.body, updatedAt: new Date().toISOString() });
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'updated', targetCollection: 'students', targetDocId: req.params.studentId, oldValue: old, newValue: req.body, ipAddress: req.ip });
    res.json({ success: true, data: { studentId: req.params.studentId, ...req.body }, message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ref = db.collection('students').doc(req.params.studentId);
    await ref.update({ isActive: false, deletedAt: new Date().toISOString() });
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'deleted', targetCollection: 'students', targetDocId: req.params.studentId, ipAddress: req.ip });
    res.json({ success: true, data: {}, message: 'Student deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const bulkImportStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows: Record<string, string>[] = req.body.rows || [];
    const batch = db.batch();
    const created: string[] = [];
    for (const row of rows) {
      const studentId = uuidv4();
      const admissionNumber = await generateAdmissionNumber();
      const ref = db.collection('students').doc(studentId);
      batch.set(ref, { studentId, admissionNumber, ...row, isActive: true, createdAt: new Date().toISOString() });
      created.push(studentId);
    }
    await batch.commit();
    res.status(201).json({ success: true, data: { created: created.length }, message: 'Bulk import complete' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const getStudentIdCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('students').doc(req.params.studentId).get();
    if (!doc.exists) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const s = doc.data()!;
    const classDoc = s.classId ? await db.collection('classes').doc(s.classId).get() : null;
    const schoolDoc = await db.collection('settings').doc('schoolProfile').get();
    res.json({
      success: true,
      data: {
        studentName: s.name,
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber,
        className: classDoc?.data()?.name || '',
        photoUrl: s.photoUrl || '',
        schoolName: schoolDoc.data()?.name || 'ZP School',
        academicYear: s.academicYear || '',
      },
      message: ''
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const generateTC = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('students').doc(req.params.studentId).get();
    if (!doc.exists) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    // TC data — actual PDF generation done on client
    const tcData = { ...doc.data(), generatedAt: new Date().toISOString(), remarks: req.body.remarks || '' };
    await doc.ref.update({ tcGenerated: true, tcGeneratedAt: tcData.generatedAt });
    res.json({ success: true, data: tcData, message: 'TC data ready' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

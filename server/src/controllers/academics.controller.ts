import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db, logAudit } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

// ─── CLASSES ────────────────────────────────────────────────────
export const listClasses = async (_req: AuthRequest, res: Response) => {
  const snap = await db.collection('classes').get();
  res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })), message: '' });
};

export const createClass = async (req: AuthRequest, res: Response) => {
  const classId = uuidv4();
  const data = { classId, ...req.body, createdAt: new Date().toISOString() };
  await db.collection('classes').doc(classId).set(data);
  await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'created', targetCollection: 'classes', targetDocId: classId, newValue: data, ipAddress: req.ip });
  res.status(201).json({ success: true, data, message: 'Class created' });
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  await db.collection('classes').doc(req.params.classId).update(req.body);
  res.json({ success: true, data: {}, message: 'Class updated' });
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  await db.collection('classes').doc(req.params.classId).delete();
  res.json({ success: true, data: {}, message: 'Class deleted' });
};

// ─── SECTIONS ───────────────────────────────────────────────────
export const listSections = async (req: AuthRequest, res: Response) => {
  let query: FirebaseFirestore.Query = db.collection('sections');
  if (req.query.classId) query = query.where('classId', '==', req.query.classId);
  const snap = await query.get();
  res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })), message: '' });
};

export const createSection = async (req: AuthRequest, res: Response) => {
  const sectionId = uuidv4();
  const data = { sectionId, studentIds: [], ...req.body, createdAt: new Date().toISOString() };
  await db.collection('sections').doc(sectionId).set(data);
  res.status(201).json({ success: true, data, message: 'Section created' });
};

export const updateSection = async (req: AuthRequest, res: Response) => {
  await db.collection('sections').doc(req.params.sectionId).update(req.body);
  res.json({ success: true, data: {}, message: 'Section updated' });
};

export const deleteSection = async (req: AuthRequest, res: Response) => {
  await db.collection('sections').doc(req.params.sectionId).delete();
  res.json({ success: true, data: {}, message: 'Section deleted' });
};

// ─── SUBJECTS ───────────────────────────────────────────────────
export const listSubjects = async (req: AuthRequest, res: Response) => {
  let query: FirebaseFirestore.Query = db.collection('subjects');
  if (req.query.classId) query = query.where('classId', '==', req.query.classId);
  const snap = await query.get();
  res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })), message: '' });
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  const subjectId = uuidv4();
  const data = { subjectId, ...req.body, createdAt: new Date().toISOString() };
  await db.collection('subjects').doc(subjectId).set(data);
  res.status(201).json({ success: true, data, message: 'Subject created' });
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  await db.collection('subjects').doc(req.params.subjectId).update(req.body);
  res.json({ success: true, data: {}, message: 'Subject updated' });
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  await db.collection('subjects').doc(req.params.subjectId).delete();
  res.json({ success: true, data: {}, message: 'Subject deleted' });
};

// ─── TIMETABLE ──────────────────────────────────────────────────
export const getTimetable = async (req: AuthRequest, res: Response) => {
  const { classId, sectionId } = req.query as Record<string, string>;
  let query: FirebaseFirestore.Query = db.collection('timetable');
  if (classId) query = query.where('classId', '==', classId);
  if (sectionId) query = query.where('sectionId', '==', sectionId);
  const snap = await query.limit(1).get();
  if (snap.empty) { res.json({ success: true, data: null, message: '' }); return; }
  const doc = snap.docs[0];
  res.json({ success: true, data: { id: doc.id, ...doc.data() }, message: '' });
};

export const saveTimetable = async (req: AuthRequest, res: Response) => {
  const { classId, sectionId, weeklySchedule } = req.body;
  // Conflict detection
  const conflicts: string[] = [];
  const days = Object.keys(weeklySchedule || {});
  for (const day of days) {
    const slots = weeklySchedule[day] || [];
    for (const slot of slots) {
      const snap = await db.collection('timetable').get();
      for (const doc of snap.docs) {
        const tt = doc.data();
        if (tt.classId === classId && tt.sectionId === sectionId) continue;
        const daySlots = tt.weeklySchedule?.[day] || [];
        const clash = daySlots.find((s: { teacherId: string; startTime: string; endTime: string }) =>
          s.teacherId === slot.teacherId && s.startTime === slot.startTime
        );
        if (clash) conflicts.push(`Teacher conflict on ${day} at ${slot.startTime}`);
      }
    }
  }
  if (conflicts.length > 0) {
    res.status(409).json({ success: false, error: conflicts.join(', ') });
    return;
  }

  let query: FirebaseFirestore.Query = db.collection('timetable');
  query = query.where('classId', '==', classId).where('sectionId', '==', sectionId);
  const existing = await query.limit(1).get();

  const timetableId = existing.empty ? uuidv4() : existing.docs[0].id;
  const data = { timetableId, classId, sectionId, weeklySchedule, updatedAt: new Date().toISOString() };
  await db.collection('timetable').doc(timetableId).set(data, { merge: true });
  res.json({ success: true, data, message: 'Timetable saved' });
};

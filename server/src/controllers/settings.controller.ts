import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { docId } = req.params;
    const doc = await db.collection('settings').doc(docId).get();
    res.json({ success: true, data: doc.exists ? { id: doc.id, ...doc.data() } : null, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { docId } = req.params;
    await db.collection('settings').doc(docId).set({ ...req.body, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ success: true, data: {}, message: 'Settings saved' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const listAcademicYears = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('academic_years').orderBy('startDate', 'desc').get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const createAcademicYear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.body.label; // e.g. "2025-26"
    await db.collection('academic_years').doc(id).set({ ...req.body, isActive: false, createdAt: new Date().toISOString() });
    res.status(201).json({ success: true, data: { id }, message: 'Academic year created' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const setActiveAcademicYear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Deactivate all
    const snap = await db.collection('academic_years').get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { isActive: false }));
    batch.update(db.collection('academic_years').doc(req.params.yearId), { isActive: true });
    await batch.commit();
    res.json({ success: true, data: {}, message: 'Active year set' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'superadmin') { res.status(403).json({ success: false, error: 'Superadmin only' }); return; }
    const { search, collection: col, fromDate, toDate, page = '1' } = req.query as Record<string, string>;
    const limit = 20;
    let query: FirebaseFirestore.Query = db.collection('audit_logs').orderBy('timestamp', 'desc');
    if (col) query = query.where('targetCollection', '==', col);
    if (fromDate) query = query.where('timestamp', '>=', fromDate);
    if (toDate) query = query.where('timestamp', '<=', toDate);
    const snap = await query.get();
    let logs = snap.docs.map(d => d.data());
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l => (l.actorUid as string)?.includes(q) || (l.actorRole as string)?.includes(q));
    }
    const total = logs.length;
    const start = (parseInt(page) - 1) * limit;
    const paged = logs.slice(start, start + limit);
    res.json({ success: true, data: { logs: paged, total, page: parseInt(page), totalPages: Math.ceil(total / limit) }, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

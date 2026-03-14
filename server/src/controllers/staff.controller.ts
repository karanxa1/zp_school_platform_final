import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db, logAudit, getPaginated } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

async function generateEmployeeCode(): Promise<string> {
  const year = new Date().getFullYear();
  const snap = await db.collection('staff').get();
  const seq = String(snap.size + 1).padStart(4, '0');
  return `EMP-${year}-${seq}`;
}

export const listStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department, designation, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filters: Record<string, unknown> = {};
    if (department) filters.department = department;
    if (designation) filters.designation = designation;
    const result = await getPaginated('staff', filters, parseInt(page), parseInt(limit));
    if (search) {
      const q = search.toLowerCase();
      result.data = result.data.filter((s: Record<string, unknown>) => (s.name as string)?.toLowerCase().includes(q));
    }
    res.json({ success: true, data: result, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('staff').doc(req.params.staffId).get();
    if (!doc.exists) { res.status(404).json({ success: false, error: 'Staff not found' }); return; }
    res.json({ success: true, data: { id: doc.id, ...doc.data() }, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = uuidv4();
    const employeeCode = await generateEmployeeCode();
    const data = { staffId, employeeCode, ...req.body, isActive: true, createdAt: new Date().toISOString() };
    await db.collection('staff').doc(staffId).set(data);
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'created', targetCollection: 'staff', targetDocId: staffId, newValue: data, ipAddress: req.ip });
    res.status(201).json({ success: true, data, message: 'Staff created' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ref = db.collection('staff').doc(req.params.staffId);
    const old = (await ref.get()).data();
    await ref.update({ ...req.body, updatedAt: new Date().toISOString() });
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'updated', targetCollection: 'staff', targetDocId: req.params.staffId, oldValue: old, newValue: req.body, ipAddress: req.ip });
    res.json({ success: true, data: { staffId: req.params.staffId }, message: 'Staff updated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const deleteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.collection('staff').doc(req.params.staffId).update({ isActive: false });
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'deleted', targetCollection: 'staff', targetDocId: req.params.staffId, ipAddress: req.ip });
    res.json({ success: true, data: {}, message: 'Staff deactivated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

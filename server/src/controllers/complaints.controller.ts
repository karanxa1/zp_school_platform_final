import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

export const submitComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaintId = uuidv4();
    const data = {
      complaintId, submittedBy: req.user!.uid, submitterRole: req.user!.role,
      status: 'open', ...req.body, createdAt: new Date().toISOString()
    };
    await db.collection('complaints').doc(complaintId).set(data);
    res.status(201).json({ success: true, data, message: 'Complaint submitted' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const listComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('complaints');
    if (status) query = query.where('status', '==', status);
    const snap = await query.orderBy('createdAt', 'desc').get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const assignComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignedTo } = req.body;
    await db.collection('complaints').doc(req.params.complaintId).update({ assignedTo, status: 'in-progress', updatedAt: new Date().toISOString() });
    res.json({ success: true, data: {}, message: 'Complaint assigned' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, resolution } = req.body;
    const update: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
    if (status === 'resolved') { update.resolution = resolution; update.resolvedAt = new Date().toISOString(); }
    await db.collection('complaints').doc(req.params.complaintId).update(update);
    res.json({ success: true, data: {}, message: 'Status updated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('complaints').where('submittedBy', '==', req.user!.uid).orderBy('createdAt', 'desc').get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

// ─── TRANSPORT ROUTES ───────────────────────────────────────────
export const listRoutes = async (_req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('transport_routes').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const createRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  const routeId = uuidv4();
  await db.collection('transport_routes').doc(routeId).set({ routeId, ...req.body, createdAt: new Date().toISOString() });
  res.status(201).json({ success: true, data: { routeId }, message: 'Route created' });
};

export const updateRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('transport_routes').doc(req.params.routeId).update(req.body);
  res.json({ success: true, data: {}, message: 'Updated' });
};

export const deleteRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('transport_routes').doc(req.params.routeId).delete();
  res.json({ success: true, data: {}, message: 'Deleted' });
};

export const assignTransport = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = uuidv4();
  await db.collection('transport_assignments').doc(id).set({ assignmentId: id, ...req.body, createdAt: new Date().toISOString() });
  res.status(201).json({ success: true, data: { assignmentId: id }, message: 'Assigned' });
};

export const listTransportAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { routeId, academicYear } = req.query as Record<string, string>;
  let query: FirebaseFirestore.Query = db.collection('transport_assignments');
  if (routeId) query = query.where('routeId', '==', routeId);
  if (academicYear) query = query.where('academicYear', '==', academicYear);
  const snap = await query.get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const removeTransportAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('transport_assignments').doc(req.params.assignmentId).delete();
  res.json({ success: true, data: {}, message: 'Removed' });
};

export const getStudentRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('transport_assignments').where('studentId', '==', req.params.studentId).limit(1).get();
  if (snap.empty) { res.json({ success: true, data: null, message: '' }); return; }
  const assignment = snap.docs[0].data();
  const routeDoc = await db.collection('transport_routes').doc(assignment.routeId as string).get();
  res.json({ success: true, data: { ...assignment, route: routeDoc.data() }, message: '' });
};

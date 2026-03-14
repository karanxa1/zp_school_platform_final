import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

// ─── ROOMS ──────────────────────────────────────────────────────
export const listRooms = async (_req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('hostel_rooms').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  const roomId = uuidv4();
  await db.collection('hostel_rooms').doc(roomId).set({ roomId, occupiedBy: [], ...req.body, createdAt: new Date().toISOString() });
  res.status(201).json({ success: true, data: { roomId }, message: 'Room created' });
};

export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('hostel_rooms').doc(req.params.roomId).update(req.body);
  res.json({ success: true, data: {}, message: 'Updated' });
};

// ─── ASSIGNMENTS ────────────────────────────────────────────────
export const assignHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, roomId } = req.body;
  const roomRef = db.collection('hostel_rooms').doc(roomId);
  const roomDoc = await roomRef.get();
  if (!roomDoc.exists) { res.status(404).json({ success: false, error: 'Room not found' }); return; }
  const room = roomDoc.data()!;
  const occupied = room.occupiedBy || [];
  if (occupied.length >= room.capacity) { res.status(409).json({ success: false, error: 'Room is at full capacity' }); return; }
  const id = uuidv4();
  await db.collection('hostel_assignments').doc(id).set({ assignmentId: id, ...req.body, checkInDate: new Date().toISOString() });
  await roomRef.update({ occupiedBy: [...occupied, studentId] });
  res.status(201).json({ success: true, data: { assignmentId: id }, message: 'Assigned' });
};

export const listHostelAssignments = async (_req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('hostel_assignments').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const vacateHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('hostel_assignments').doc(req.params.assignmentId).get();
  if (!doc.exists) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  const { studentId, roomId } = doc.data()!;
  await doc.ref.update({ checkOutDate: new Date().toISOString() });
  const roomDoc = await db.collection('hostel_rooms').doc(roomId as string).get();
  const occupied = (roomDoc.data()?.occupiedBy || []).filter((id: string) => id !== studentId);
  await roomDoc.ref.update({ occupiedBy: occupied });
  res.json({ success: true, data: {}, message: 'Vacated' });
};

// ─── MESS MENU ──────────────────────────────────────────────────
export const saveMessMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('hostel_settings').doc('messMenu').set({ menu: req.body.menu, updatedAt: new Date().toISOString() });
  res.json({ success: true, data: {}, message: 'Mess menu saved' });
};

export const getMessMenu = async (_req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('hostel_settings').doc('messMenu').get();
  res.json({ success: true, data: doc.exists ? doc.data() : {}, message: '' });
};

// ─── VISITORS ───────────────────────────────────────────────────
export const logVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = uuidv4();
  await db.collection('hostel_visitors').doc(id).set({ visitorId: id, ...req.body, loggedAt: new Date().toISOString() });
  res.status(201).json({ success: true, data: { visitorId: id }, message: 'Visitor logged' });
};

export const listVisitors = async (_req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('hostel_visitors').orderBy('loggedAt', 'desc').limit(100).get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

// ─── NOTICES ────────────────────────────────────────────────────
export const listNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  let query: FirebaseFirestore.Query = db.collection('notices');
  const { targetAudience } = req.query as Record<string, string>;
  if (targetAudience) query = query.where('targetAudience', 'in', [targetAudience, 'all']);
  const snap = await query.orderBy('createdAt', 'desc').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const createNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  const noticeId = uuidv4();
  const data = { noticeId, postedBy: req.user!.uid, ...req.body, createdAt: new Date().toISOString() };
  await db.collection('notices').doc(noticeId).set(data);
  res.status(201).json({ success: true, data, message: 'Notice created' });
};

export const updateNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('notices').doc(req.params.noticeId).update(req.body);
  res.json({ success: true, data: {}, message: 'Updated' });
};

export const deleteNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('notices').doc(req.params.noticeId).delete();
  res.json({ success: true, data: {}, message: 'Deleted' });
};

// ─── EVENTS ─────────────────────────────────────────────────────
export const listEvents = async (_req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('events').orderBy('date', 'asc').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const eventId = uuidv4();
  const data = { eventId, organizer: req.user!.uid, registeredStudents: [], ...req.body, createdAt: new Date().toISOString() };
  await db.collection('events').doc(eventId).set(data);
  res.status(201).json({ success: true, data, message: 'Event created' });
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('events').doc(req.params.eventId).update(req.body);
  res.json({ success: true, data: {}, message: 'Updated' });
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('events').doc(req.params.eventId).delete();
  res.json({ success: true, data: {}, message: 'Deleted' });
};

// ─── MESSAGES ───────────────────────────────────────────────────
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const messageId = uuidv4();
  const data = { messageId, senderId: req.user!.uid, isRead: false, sentAt: new Date().toISOString(), ...req.body };
  await db.collection('messages').doc(messageId).set(data);
  res.status(201).json({ success: true, data, message: 'Sent' });
};

export const getInbox = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('messages').where('receiverId', '==', req.user!.uid).orderBy('sentAt', 'desc').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const getSent = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('messages').where('senderId', '==', req.user!.uid).orderBy('sentAt', 'desc').get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const markMessageRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('messages').doc(req.params.messageId).update({ isRead: true });
  res.json({ success: true, data: {}, message: 'Marked read' });
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('messages').where('receiverId', '==', req.user!.uid).where('isRead', '==', false).get();
  res.json({ success: true, data: { count: snap.size }, message: '' });
};

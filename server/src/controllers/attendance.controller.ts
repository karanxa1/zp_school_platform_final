import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

async function sendSMS(phone: string, message: string) {
  if (!env.MSG91_AUTH_KEY) return;
  try {
    await fetch(`https://api.msg91.com/api/v5/flow/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: env.MSG91_AUTH_KEY },
      body: JSON.stringify({
        template_id: env.MSG91_TEMPLATE_ID,
        sender: env.MSG91_SENDER_ID,
        mobiles: phone,
        message,
      }),
    });
  } catch { /* non-critical */ }
}

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, date, records } = req.body as {
      classId: string; sectionId: string; date: string;
      records: { studentId: string; status: string }[];
    };
    const batch = db.batch();
    for (const rec of records) {
      const attendanceId = uuidv4();
      const ref = db.collection('attendance').doc(attendanceId);
      const data = { attendanceId, classId, sectionId, date, ...rec, markedBy: req.user!.uid, parentNotified: false, createdAt: new Date().toISOString() };
      batch.set(ref, data);

      if (rec.status === 'absent') {
        // Get parent contact and notify
        const studentSnap = await db.collection('students').doc(rec.studentId).get();
        const student = studentSnap.data();
        if (student?.parentPhone) {
          await sendSMS(student.parentPhone, `Your child ${student.name} was marked absent on ${date}.`);
          batch.update(ref, { parentNotified: true });
        }
      }
    }
    await batch.commit();
    res.status(201).json({ success: true, data: { count: records.length }, message: 'Attendance marked' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getClassAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, date } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('attendance');
    if (classId) query = query.where('classId', '==', classId);
    if (sectionId) query = query.where('sectionId', '==', sectionId);
    if (date) query = query.where('date', '==', date);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('attendance').where('studentId', '==', req.params.studentId);
    if (fromDate) query = query.where('date', '>=', fromDate);
    if (toDate) query = query.where('date', '<=', toDate);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, fromDate, toDate } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('attendance');
    if (classId) query = query.where('classId', '==', classId);
    if (sectionId) query = query.where('sectionId', '==', sectionId);
    if (fromDate) query = query.where('date', '>=', fromDate);
    if (toDate) query = query.where('date', '<=', toDate);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const markStaffAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staffId, date, status, checkInTime, checkOutTime } = req.body;
    const id = uuidv4();
    await db.collection('staff_attendance').doc(id).set({ id, staffId, date, status, checkInTime, checkOutTime, createdAt: new Date().toISOString() });
    res.status(201).json({ success: true, data: { id }, message: 'Staff attendance marked' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getStaffAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('staff_attendance');
    if (fromDate) query = query.where('date', '>=', fromDate);
    if (toDate) query = query.where('date', '<=', toDate);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

// ─── LEAVE REQUESTS ─────────────────────────────────────────────
export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaveId = uuidv4();
    const data = { leaveId, applicantUid: req.user!.uid, status: 'pending', appliedAt: new Date().toISOString(), ...req.body };
    await db.collection('leave_requests').doc(leaveId).set(data);
    res.status(201).json({ success: true, data, message: 'Leave applied' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const listLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('leave_requests');
    if (status) query = query.where('status', '==', status);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, remarks } = req.body;
    await db.collection('leave_requests').doc(req.params.leaveId).update({ status, remarks, approvedBy: req.user!.uid, updatedAt: new Date().toISOString() });
    res.json({ success: true, data: {}, message: 'Leave updated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

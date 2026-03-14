import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db, logAudit } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

function generateReceiptNumber(): string {
  const now = new Date();
  return `RCP-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`;
}

export const createFeeStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = uuidv4();
    const data = { feeStructureId: id, ...req.body, createdAt: new Date().toISOString() };
    await db.collection('fee_structure').doc(id).set(data);
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'created', targetCollection: 'fee_structure', targetDocId: id, newValue: data, ipAddress: req.ip });
    res.status(201).json({ success: true, data, message: 'Fee structure created' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getFeeStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('fee_structure').where('classId', '==', req.params.classId).get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateFeeStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.collection('fee_structure').doc(req.params.feeStructureId).update(req.body);
    res.json({ success: true, data: {}, message: 'Fee structure updated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const collectFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, feeStructureId, componentName, amountPaid, paymentMode, remarks, dueDate } = req.body;
    const settings = (await db.collection('settings').doc('feeConfig').get()).data();
    const lateFinePerDay = settings?.lateFinePerDay || 0;

    let lateFine = 0;
    if (dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      if (today > due) {
        const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        lateFine = diffDays * lateFinePerDay;
      }
    }

    const totalDue = (req.body.componentAmount || 0) + lateFine;
    const balance = totalDue - amountPaid;
    const status = balance <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    const receiptNumber = generateReceiptNumber();
    const feeId = uuidv4();

    const data = {
      feeId, studentId, feeStructureId, componentName, amount: totalDue,
      dueDate, paidAmount: amountPaid, balance, status, receiptNumber,
      collectedBy: req.user!.uid, paidAt: new Date().toISOString(),
      paymentMode, remarks, lateFine,
    };
    await db.collection('fee_records').doc(feeId).set(data);
    await logAudit({ actorUid: req.user!.uid, actorRole: req.user!.role!, action: 'created', targetCollection: 'fee_records', targetDocId: feeId, newValue: data, ipAddress: req.ip });
    res.status(201).json({ success: true, data, message: 'Fee collected' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getStudentFeeRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('fee_records').where('studentId', '==', req.params.studentId).get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getPendingFees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('fee_records').where('status', 'in', ['unpaid', 'partial']);
    const snap = await query.get();
    let records = snap.docs.map(d => d.data());
    if (classId) {
      const studentSnap = await db.collection('students').where('classId', '==', classId).get();
      const studentIds = studentSnap.docs.map(d => d.id);
      records = records.filter(r => studentIds.includes(r.studentId as string));
    }
    res.json({ success: true, data: records, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const applyDiscount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = uuidv4();
    const data = { discountId: id, approvedBy: req.user!.uid, ...req.body, createdAt: new Date().toISOString() };
    await db.collection('discounts').doc(id).set(data);
    res.status(201).json({ success: true, data, message: 'Discount applied' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getDailyFeeReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query as Record<string, string>;
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    const snap = await db.collection('fee_records')
      .where('paidAt', '>=', startOfDay)
      .where('paidAt', '<=', endOfDay)
      .get();
    const records = snap.docs.map(d => d.data());
    const total = records.reduce((sum, r) => sum + (r.paidAmount as number || 0), 0);
    res.json({ success: true, data: { records, total, date }, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getMonthlyFeeReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query as Record<string, string>;
    const start = `${year}-${month.padStart(2,'0')}-01`;
    const end = `${year}-${month.padStart(2,'0')}-31`;
    const snap = await db.collection('fee_records')
      .where('paidAt', '>=', start)
      .where('paidAt', '<=', end)
      .get();
    const records = snap.docs.map(d => d.data());
    const total = records.reduce((sum, r) => sum + (r.paidAmount as number || 0), 0);
    res.json({ success: true, data: { records, total }, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getFeeReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('fee_records').doc(req.params.feeId).get();
    if (!doc.exists) { res.status(404).json({ success: false, error: 'Receipt not found' }); return; }
    const fee = doc.data()!;
    const studentDoc = await db.collection('students').doc(fee.studentId as string).get();
    const schoolDoc = await db.collection('settings').doc('schoolProfile').get();
    res.json({
      success: true,
      data: { ...fee, student: studentDoc.data(), school: schoolDoc.data() },
      message: ''
    });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

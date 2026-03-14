import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db, getPaginated } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

export const listBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    const result = await getPaginated('library_books', filters, parseInt(page), parseInt(limit));
    if (search) {
      const q = search.toLowerCase();
      result.data = result.data.filter((b: Record<string, unknown>) =>
        (b.title as string)?.toLowerCase().includes(q) ||
        (b.author as string)?.toLowerCase().includes(q) ||
        (b.isbn as string)?.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, data: result, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const addBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookId = uuidv4();
    const data = { bookId, availableCopies: req.body.totalCopies, ...req.body, createdAt: new Date().toISOString() };
    await db.collection('library_books').doc(bookId).set(data);
    res.status(201).json({ success: true, data, message: 'Book added' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const updateBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.collection('library_books').doc(req.params.bookId).update(req.body);
    res.json({ success: true, data: {}, message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const deleteBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.collection('library_books').doc(req.params.bookId).delete();
    res.json({ success: true, data: {}, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const issueBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    const bookRef = db.collection('library_books').doc(bookId);
    const bookDoc = await bookRef.get();
    if (!bookDoc.exists) { res.status(404).json({ success: false, error: 'Book not found' }); return; }
    const book = bookDoc.data()!;
    if (book.availableCopies <= 0) { res.status(409).json({ success: false, error: 'No copies available' }); return; }
    const txId = uuidv4();
    await db.collection('library_transactions').doc(txId).set({ transactionId: txId, bookId, studentId, issueDate: new Date().toISOString(), dueDate, status: 'issued' });
    await bookRef.update({ availableCopies: book.availableCopies - 1 });
    res.status(201).json({ success: true, data: { transactionId: txId }, message: 'Book issued' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const returnBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const txRef = db.collection('library_transactions').doc(req.params.transactionId);
    const txDoc = await txRef.get();
    if (!txDoc.exists) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }
    const tx = txDoc.data()!;
    const returnDate = new Date();
    const dueDate = new Date(tx.dueDate as string);
    let fineAmount = 0;
    if (returnDate > dueDate) {
      const diffDays = Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 2; // ₹2 per day
    }
    await txRef.update({ returnDate: returnDate.toISOString(), fineAmount, status: fineAmount > 0 ? 'returned' : 'returned' });
    const bookRef = db.collection('library_books').doc(tx.bookId as string);
    const bookDoc = await bookRef.get();
    await bookRef.update({ availableCopies: (bookDoc.data()?.availableCopies || 0) + 1 });
    res.json({ success: true, data: { fineAmount }, message: 'Book returned' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const listTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, studentId } = req.query as Record<string, string>;
    let query: FirebaseFirestore.Query = db.collection('library_transactions');
    if (status) query = query.where('status', '==', status);
    if (studentId) query = query.where('studentId', '==', studentId);
    const snap = await query.get();
    res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

export const getOverdueBooks = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('library_transactions').where('status', '==', 'issued').get();
    const now = new Date();
    const overdue = snap.docs.map(d => d.data()).filter(tx => {
      const due = new Date(tx.dueDate as string);
      return now > due;
    }).map(tx => {
      const due = new Date(tx.dueDate as string);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return { ...tx, daysOverdue: diffDays, fine: diffDays * 2 };
    });
    res.json({ success: true, data: overdue, message: '' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
};

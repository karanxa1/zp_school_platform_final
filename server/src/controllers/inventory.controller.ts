import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';
import { v4 as uuidv4 } from 'uuid';

export const listItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category } = req.query as Record<string, string>;
  let query: FirebaseFirestore.Query = db.collection('inventory_items');
  if (category) query = query.where('category', '==', category);
  const snap = await query.get();
  const items = snap.docs.map(d => {
    const item = d.data();
    return { ...item, isLowStock: (item.availableQuantity as number) <= (item.minStockAlert as number) };
  });
  res.json({ success: true, data: items, message: '' });
};

export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const itemId = uuidv4();
  const data = { itemId, availableQuantity: req.body.totalQuantity, ...req.body, createdAt: new Date().toISOString() };
  await db.collection('inventory_items').doc(itemId).set(data);
  res.status(201).json({ success: true, data, message: 'Item created' });
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  await db.collection('inventory_items').doc(req.params.itemId).update(req.body);
  res.json({ success: true, data: {}, message: 'Updated' });
};

export const stockIn = async (req: AuthRequest, res: Response): Promise<void> => {
  const { itemId, quantity, supplier, remarks } = req.body;
  const itemRef = db.collection('inventory_items').doc(itemId);
  const itemDoc = await itemRef.get();
  if (!itemDoc.exists) { res.status(404).json({ success: false, error: 'Item not found' }); return; }
  const item = itemDoc.data()!;
  const newQty = (item.availableQuantity as number) + quantity;
  const newTotal = (item.totalQuantity as number) + quantity;
  await itemRef.update({ availableQuantity: newQty, totalQuantity: newTotal });
  const txId = uuidv4();
  await db.collection('inventory_transactions').doc(txId).set({ transactionId: txId, itemId, type: 'in', quantity, supplier, remarks, issuedBy: req.user!.uid, date: new Date().toISOString() });
  res.status(201).json({ success: true, data: { availableQuantity: newQty }, message: 'Stock in recorded' });
};

export const stockOut = async (req: AuthRequest, res: Response): Promise<void> => {
  const { itemId, quantity, purpose, issuedTo } = req.body;
  const itemRef = db.collection('inventory_items').doc(itemId);
  const itemDoc = await itemRef.get();
  if (!itemDoc.exists) { res.status(404).json({ success: false, error: 'Item not found' }); return; }
  const item = itemDoc.data()!;
  if ((item.availableQuantity as number) < quantity) { res.status(409).json({ success: false, error: 'Insufficient stock' }); return; }
  const newQty = (item.availableQuantity as number) - quantity;
  await itemRef.update({ availableQuantity: newQty });
  const txId = uuidv4();
  await db.collection('inventory_transactions').doc(txId).set({ transactionId: txId, itemId, type: 'out', quantity, purpose, issuedTo, issuedBy: req.user!.uid, date: new Date().toISOString() });
  res.status(201).json({ success: true, data: { availableQuantity: newQty }, message: 'Stock out recorded' });
};

export const getItemTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('inventory_transactions').where('itemId', '==', req.params.itemId).get();
  res.json({ success: true, data: snap.docs.map(d => d.data()), message: '' });
};

export const getLowStockItems = async (_req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('inventory_items').get();
  const low = snap.docs.map(d => d.data()).filter(item => (item.availableQuantity as number) <= (item.minStockAlert as number));
  res.json({ success: true, data: low, message: '' });
};

import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import * as c from '../controllers/inventory.controller';

const r = Router();
r.get('/items', verifyToken, c.listItems);
r.post('/items', verifyToken, c.createItem);
r.put('/items/:itemId', verifyToken, c.updateItem);
r.post('/transactions/in', verifyToken, c.stockIn);
r.post('/transactions/out', verifyToken, c.stockOut);
r.get('/transactions/:itemId', verifyToken, c.getItemTransactions);
r.get('/low-stock', verifyToken, c.getLowStockItems);
export default r;

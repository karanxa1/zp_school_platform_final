import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import * as c from '../controllers/library.controller';

const r = Router();
r.get('/books', verifyToken, c.listBooks);
r.post('/books', verifyToken, c.addBook);
r.put('/books/:bookId', verifyToken, c.updateBook);
r.delete('/books/:bookId', verifyToken, c.deleteBook);
r.post('/issue', verifyToken, c.issueBook);
r.post('/return/:transactionId', verifyToken, c.returnBook);
r.get('/transactions', verifyToken, c.listTransactions);
r.get('/overdue', verifyToken, c.getOverdueBooks);
export default r;

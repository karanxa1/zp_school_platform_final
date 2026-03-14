import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { verifyUser } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/verify
router.post('/verify', verifyToken, verifyUser);

export default router;

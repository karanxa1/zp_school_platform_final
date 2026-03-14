import { Response } from 'express';
import { AuthRequest } from '../middleware/verifyToken';
import { db } from '../services/firestore';

export const verifyUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: 'User profile not found in Firestore' });
      return;
    }

    const profile = userDoc.data();
    res.json({ success: true, data: { uid, ...profile }, message: 'Token verified' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

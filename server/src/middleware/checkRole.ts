import { Response, NextFunction } from 'express';
import { AuthRequest } from './verifyToken';

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
};

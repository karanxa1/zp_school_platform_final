// Global Express type augmentation
// Fixes qs.ParsedQs type compatibility with string parameters
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
        [key: string]: unknown;
      };
    }
  }
}

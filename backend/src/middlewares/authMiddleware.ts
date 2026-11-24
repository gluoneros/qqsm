import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'CHANGE_ME';

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'object' && payload !== null && 'sub' in payload) {
      const sub = payload.sub;
      if (typeof sub === 'number') {
        req.userId = sub;
        return next();
      }
    }
    res.status(401).json({ error: 'Invalid token payload' });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
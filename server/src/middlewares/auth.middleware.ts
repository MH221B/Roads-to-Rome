import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import Role from '../enums/user.enum';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: (decoded as JwtPayload).userId,
      role: (decoded as JwtPayload).role,
    };
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.role) {
      res.status(403).json({ message: 'Forbidden: No role found' });
      return;
    }

    const hasRole = roles.includes(user.role);

    if (!hasRole) {
      res.status(403).json({ message: 'Forbidden: Insufficient role' });
      return;
    }

    next();
  };
};

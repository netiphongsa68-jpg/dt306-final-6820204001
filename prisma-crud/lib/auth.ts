import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET || 'super-secret-key';

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}

export function verifyToken(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}
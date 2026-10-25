import crypto from 'crypto';
import pool from './db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.AUTH_SECRET || 'liveexam_secret_key_2026_secure_sha256';

export interface AuthUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'STUDENT';
  display_name: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const pwdHash = hashPassword(password);
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, role, display_name FROM users WHERE username = ? AND password_hash = ?',
    [username.trim().toLowerCase(), pwdHash]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const user = rows[0];
  return {
    id: user.id,
    username: user.username,
    role: user.role as 'ADMIN' | 'STUDENT',
    display_name: user.display_name,
  };
}

export function createToken(user: AuthUser, rememberMe: boolean = true): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // If rememberMe: 365 days (1 year), otherwise 7 days
  const expiresInSeconds = rememberMe ? 365 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      display_name: decoded.display_name,
    };
  } catch (err) {
    return null;
  }
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}


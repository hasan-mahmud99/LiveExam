import { NextResponse } from 'next/server';
import { verifyToken, parseCookie } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    let token = parseCookie(cookieHeader, 'liveexam_auth');
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = verifyToken(token);
    return NextResponse.json({ user: user || null });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}


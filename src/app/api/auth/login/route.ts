import { NextResponse } from 'next/server';
import { authenticateUser, createToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password, rememberMe = true } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ইউজারনেম এবং পাসওয়ার্ড দিন' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড' },
        { status: 401 }
      );
    }

    const token = createToken(user, rememberMe);
    const response = NextResponse.json({
      success: true,
      user,
      token,
    });

    const maxAge = rememberMe ? 365 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    // Set secure cookie - persistent for 1 year if rememberMe is true
    response.cookies.set('liveexam_auth', token, {
      httpOnly: false, // Accessible to client-side JS for easy state check
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'লগইন করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}


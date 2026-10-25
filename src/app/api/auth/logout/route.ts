import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'লগআউট সম্পন্ন হয়েছে' });
  response.cookies.set('liveexam_auth', '', {
    path: '/',
    maxAge: 0,
  });
  return response;
}


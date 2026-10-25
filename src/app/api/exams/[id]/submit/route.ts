import { NextRequest, NextResponse } from 'next/server';
import { submitExam } from '@/lib/services';
import { verifyToken, parseCookie } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.user_name || !body.user_name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const cookieHeader = request.headers.get('cookie');
    const token = parseCookie(cookieHeader, 'liveexam_auth');
    const authUser = token ? verifyToken(token) : null;
    const userId = authUser?.id || body.user_id || null;

    const result = await submitExam({
      exam_id: id,
      user_name: body.user_name,
      user_id: userId,
      time_taken_seconds: body.time_taken_seconds || 0,
      answers: body.answers || {}
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

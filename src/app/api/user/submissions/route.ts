import { NextRequest, NextResponse } from 'next/server';
import { getUserSubmissions } from '@/lib/services';
import { verifyToken, parseCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = parseCookie(cookieHeader, 'liveexam_auth');
    const user = token ? verifyToken(token) : null;

    const { searchParams } = new URL(request.url);
    const queryName = searchParams.get('userName') || user?.display_name || user?.username || '';
    const userId = user?.id || null;

    if (!queryName && !userId) {
      return NextResponse.json({ submissions: [], examMap: {} });
    }

    const submissions = await getUserSubmissions(queryName, userId);

    // Build quick examMap: exam_id -> { submission_id, score, total_questions, submitted_at, attempts }
    const examMap: Record<string, any> = {};
    for (const sub of submissions) {
      if (!examMap[sub.exam_id]) {
        examMap[sub.exam_id] = {
          submission_id: sub.id,
          score: sub.score,
          total_questions: sub.total_questions,
          correct_count: sub.correct_count,
          wrong_count: sub.wrong_count,
          submitted_at: sub.submitted_at,
          attempts: 1,
        };
      } else {
        examMap[sub.exam_id].attempts += 1;
        // Keep highest score or most recent
        if (sub.score > examMap[sub.exam_id].score) {
          examMap[sub.exam_id].score = sub.score;
          examMap[sub.exam_id].submission_id = sub.id;
        }
      }
    }

    return NextResponse.json({ submissions, examMap });
  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json({ submissions: [], examMap: {} });
  }
}


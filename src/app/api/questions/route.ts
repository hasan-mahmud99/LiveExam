import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, insertQuestionsBatch } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const exam_type = searchParams.get('exam_type') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const topic = searchParams.get('topic') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const result = await getQuestions({
      subject,
      exam_type,
      grade,
      topic,
      search,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const insertedCount = await insertQuestionsBatch(items);
    return NextResponse.json({ success: true, inserted: insertedCount });
  } catch (error: any) {
    console.error('Error inserting questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

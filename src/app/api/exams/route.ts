import { NextRequest, NextResponse } from 'next/server';
import { getExams, createExam } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || undefined;
    const subject = searchParams.get('subject') || undefined;

    const exams = await getExams({ mode, subject });
    return NextResponse.json(exams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const exam = await createExam({
      title: data.title,
      description: data.description,
      mode: data.mode || 'practice',
      subject: data.subject,
      topic_filter: data.topic_filter,
      exam_type_filter: data.exam_type_filter,
      grade_filter: data.grade_filter,
      duration_minutes: data.duration_minutes || 15,
      negative_marking: data.negative_marking !== undefined ? data.negative_marking : 0.25,
      marks_per_question: data.marks_per_question || 1.0,
      scheduled_start_time: data.scheduled_start_time,
      question_count: data.question_count || 15,
      question_ids: data.question_ids
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getExamById } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exam = await getExamById(id);
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

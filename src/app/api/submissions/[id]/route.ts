import { NextRequest, NextResponse } from 'next/server';
import { getSubmissionDetails } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const details = await getSubmissionDetails(id);
    if (!details) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

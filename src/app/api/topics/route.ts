import { NextRequest, NextResponse } from 'next/server';
import { getTopics } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;

    const topics = await getTopics(subject);
    return NextResponse.json({ topics });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


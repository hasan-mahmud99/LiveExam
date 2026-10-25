import { NextResponse } from 'next/server';
import { getStats } from '@/lib/services';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

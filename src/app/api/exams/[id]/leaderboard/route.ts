import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaderboard = await getLeaderboard(id);
    return NextResponse.json(leaderboard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decisions = await meetingRepository.getDecisionsForUser(userId);

    return NextResponse.json({ success: true, decisions });
  } catch (err: unknown) {
    console.error('Error fetching decisions:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch decisions' },
      { status: 500 }
    );
  }
}

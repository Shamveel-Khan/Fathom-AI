import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const actionItems = await meetingRepository.getActionItemsForUser(userId);

    return NextResponse.json({ success: true, actionItems });
  } catch (err: unknown) {
    console.error('Error fetching action items:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch action items' },
      { status: 500 }
    );
  }
}

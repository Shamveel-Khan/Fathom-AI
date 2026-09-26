import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const meetings = await meetingRepository.listMeetingsForUser(userId);
    return NextResponse.json({ success: true, meetings });
  } catch (err) {
    console.error('/api/meetings GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load meetings.' }, { status: 500 });
  }
}

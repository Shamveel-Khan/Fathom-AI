import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const meeting = await meetingRepository.getMeetingById(userId, id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Meeting not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, meeting });
  } catch (err) {
    console.error(`/api/meetings/${id} GET error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to load meeting.' }, { status: 500 });
  }
}

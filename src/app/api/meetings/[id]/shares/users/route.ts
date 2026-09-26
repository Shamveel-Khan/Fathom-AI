import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { shareRepository, meetingRepository } from '@/lib/repositories';

// POST /api/meetings/[id]/shares/users — share with a specific user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: meetingId } = await params;

  const meeting = await meetingRepository.getMeetingById(userId, meetingId);
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  if (!meeting.isOwner) return NextResponse.json({ error: 'Only the meeting owner can share it' }, { status: 403 });

  const body = await request.json();
  const { userId: targetUserId } = body;
  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (targetUserId === userId) {
    return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
  }

  await shareRepository.shareWithUser(userId, meetingId, targetUserId);
  const sharedUsers = await shareRepository.listSharedUsers(meetingId);
  return NextResponse.json({ success: true, sharedUsers });
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { shareRepository, meetingRepository } from '@/lib/repositories';

// POST /api/meetings/[id]/shares/public — create/renew public share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: meetingId } = await params;

  // Verify ownership — only owner can share
  const meeting = await meetingRepository.getMeetingById(userId, meetingId);
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  if (!meeting.isOwner) return NextResponse.json({ error: 'Only the meeting owner can share it' }, { status: 403 });

  const share = await shareRepository.createPublicShare(userId, meetingId);
  return NextResponse.json({ success: true, token: share.token, createdAt: share.createdAt });
}

// DELETE /api/meetings/[id]/shares/public — revoke public share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: meetingId } = await params;
  const revoked = await shareRepository.revokePublicShare(userId, meetingId);
  return NextResponse.json({ success: revoked });
}

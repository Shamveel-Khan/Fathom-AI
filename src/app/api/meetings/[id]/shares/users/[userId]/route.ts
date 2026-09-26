import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { shareRepository } from '@/lib/repositories';

// DELETE /api/meetings/[id]/shares/users/[userId] — remove user access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const currentUserId = await getUserIdFromRequest(request);
  if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: meetingId, userId: targetUserId } = await params;
  const removed = await shareRepository.removeUserShare(currentUserId, meetingId, targetUserId);
  return NextResponse.json({ success: removed });
}

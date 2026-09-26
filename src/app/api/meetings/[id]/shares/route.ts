import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { shareRepository } from '@/lib/repositories';

// GET /api/meetings/[id]/shares — list all share state for a meeting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: meetingId } = await params;

  const [publicShare, sharedUsers] = await Promise.all([
    shareRepository.getPublicShare(meetingId),
    shareRepository.listSharedUsers(meetingId),
  ]);

  return NextResponse.json({
    success: true,
    publicShare: publicShare
      ? { token: publicShare.token, createdAt: publicShare.createdAt }
      : null,
    sharedUsers,
  });
}

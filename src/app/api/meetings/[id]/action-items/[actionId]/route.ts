import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: meetingId, actionId } = await params;

  try {
    const body = await request.json() as {
      completed?: boolean;
      assignee?: string | null;
      dueDate?: string | null;
    };

    const success = await meetingRepository.updateActionItem(
      userId,
      meetingId,
      actionId,
      body
    );

    return NextResponse.json({ success });
  } catch (err: unknown) {
    console.error(`/api/meetings/${meetingId}/action-items/${actionId} PATCH error:`, err);
    const message = err instanceof Error ? err.message : 'Failed to update action item.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

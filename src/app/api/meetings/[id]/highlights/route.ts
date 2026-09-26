import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';
import { MeetingHighlight } from '@/lib/schemas/meeting';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: meetingId } = await params;

  try {
    const body = await request.json() as MeetingHighlight;

    if (!body.quote || !body.speaker || !body.timestamp) {
      return NextResponse.json(
        { success: false, error: 'Quote, speaker, and timestamp are required.' },
        { status: 400 }
      );
    }

    const saved = await meetingRepository.addHighlight(userId, meetingId, body);
    return NextResponse.json({ success: true, highlight: saved });
  } catch (err: unknown) {
    console.error(`/api/meetings/${meetingId}/highlights POST error:`, err);
    const message = err instanceof Error ? err.message : 'Failed to save highlight.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: meetingId } = await params;
  const { searchParams } = new URL(request.url);
  const highlightId = searchParams.get('highlightId');

  if (!highlightId) {
    return NextResponse.json(
      { success: false, error: 'highlightId parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const deleted = await meetingRepository.deleteHighlight(userId, meetingId, highlightId);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    console.error(`/api/meetings/${meetingId}/highlights DELETE error:`, err);
    const message = err instanceof Error ? err.message : 'Failed to delete highlight.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

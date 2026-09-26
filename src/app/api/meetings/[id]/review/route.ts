import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';
import { generateMeetingReview, getMockMeetingReview } from '@/lib/ai/service';

// GET /api/meetings/[id]/review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const review = await meetingRepository.getMeetingReview(userId, meetingId);

    if (!review) {
      return NextResponse.json({ error: 'AI Review not found for this meeting' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    console.error('Error fetching AI review:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meetings/[id]/review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const meeting = await meetingRepository.getMeetingById(userId, meetingId);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (!meeting.isOwner) {
      return NextResponse.json({ error: 'Forbidden: Only meeting owner can generate review' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { useMock = false, model = 'gpt-4o-mini' } = body as { useMock?: boolean; model?: string };

    const apiKey = request.headers.get('x-api-key') || undefined;
    const baseUrl = request.headers.get('x-base-url') || undefined;
    const effectiveKey = apiKey || process.env.OPENAI_API_KEY;

    let reviewData;
    if (useMock || !effectiveKey) {
      reviewData = getMockMeetingReview(meeting.template);
    } else {
      reviewData = await generateMeetingReview({
        transcript: meeting.transcript,
        template: meeting.template,
        apiKey: effectiveKey,
        baseUrl,
        model,
      });
    }

    const savedReview = await meetingRepository.saveMeetingReview(userId, meetingId, reviewData);

    return NextResponse.json({
      success: true,
      review: savedReview,
    });
  } catch (err: unknown) {
    console.error('Error generating AI review:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

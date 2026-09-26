import { NextRequest, NextResponse } from 'next/server';
import { shareRepository } from '@/lib/repositories';

// GET /api/share/[token] — public, unauthenticated endpoint
// Resolves token → meeting data. Never exposes internal meeting ID.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

  const meeting = await shareRepository.getMeetingByPublicToken(token);
  if (!meeting) {
    return NextResponse.json({ error: 'Share link not found or has been revoked' }, { status: 404 });
  }

  // Return a sanitized view — strip internal IDs and owner info
  return NextResponse.json({
    success: true,
    meeting: {
      title: meeting.title,
      date: meeting.date,
      durationMinutes: meeting.durationMinutes,
      videoUrl: meeting.videoUrl,
      template: meeting.template || 'general',
      participants: meeting.participants,
      transcript: meeting.transcript,
      analysis: meeting.analysis,
      review: meeting.review,
    },
  });
}

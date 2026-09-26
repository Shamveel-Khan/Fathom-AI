import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';
import { analyzeMeeting, getMockMeetingAnalysis } from '@/lib/ai/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: meetingId } = await params;
  const apiKey = request.headers.get('x-api-key') || undefined;
  const baseUrl = request.headers.get('x-base-url') || undefined;

  try {
    const body = await request.json() as {
      useMock?: boolean;
      model?: string;
    };
    const { useMock = false, model = 'gpt-4o-mini' } = body;

    // Load full meeting for its transcript
    const meeting = await meetingRepository.getMeetingById(userId, meetingId);
    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Meeting not found.' }, { status: 404 });
    }

    let analysis;

    if (useMock) {
      analysis = getMockMeetingAnalysis();
    } else {
      const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
      if (!effectiveKey) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_API_KEY',
              message:
                'No OpenAI API key provided. Configure your API key or use Instant Demo mode.',
            },
          },
          { status: 401 }
        );
      }

      analysis = await analyzeMeeting({
        transcript: meeting.transcript,
        operation: 'full',
        apiKey: effectiveKey,
        baseUrl,
        model,
      });
    }

    // Persist analysis back to userX.json via repository
    const updatedMeeting = await meetingRepository.saveMeetingAnalysis(userId, meetingId, analysis);

    return NextResponse.json({ success: true, meeting: updatedMeeting });
  } catch (err: unknown) {
    console.error(`/api/meetings/${meetingId}/analyze error:`, err);
    const message = err instanceof Error ? err.message : 'Failed to analyze meeting.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';
import { ImportMeetingSchema } from '@/lib/schemas/import';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload. Please verify JSON formatting.' },
        { status: 400 }
      );
    }

    // Support single meeting root, or wrapped under { meeting: ... }
    const targetPayload =
      typeof rawBody === 'object' && rawBody !== null && 'meeting' in rawBody
        ? (rawBody as Record<string, unknown>).meeting
        : rawBody;

    const parseResult = ImportMeetingSchema.safeParse(targetPayload);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      const errorSummaries: string[] = [];

      for (const issue of parseResult.error.issues) {
        const pathStr = issue.path.join('.') || 'root';
        if (!fieldErrors[pathStr]) fieldErrors[pathStr] = [];
        fieldErrors[pathStr].push(issue.message);
        errorSummaries.push(`${pathStr}: ${issue.message}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Schema validation failed (${parseResult.error.issues.length} issue${
            parseResult.error.issues.length > 1 ? 's' : ''
          }): ${errorSummaries.slice(0, 3).join(', ')}${
            errorSummaries.length > 3 ? '...' : ''
          }`,
          fieldErrors,
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const createdMeeting = await meetingRepository.importMeeting(userId, parseResult.data);

    return NextResponse.json(
      {
        success: true,
        message: 'Meeting successfully imported.',
        meeting: createdMeeting,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Error importing meeting:', err);
    const message = err instanceof Error ? err.message : 'Internal server error while importing meeting';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

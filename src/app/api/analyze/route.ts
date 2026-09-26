import { NextRequest, NextResponse } from 'next/server';
import { analyzeMeeting, getMockMeetingAnalysis } from '@/lib/ai/service';
import { AnalyzeResponse } from '@/lib/schemas/analysis';
import { TranscriptUtterance } from '@/lib/schemas/meeting';

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const apiKey = request.headers.get('x-api-key') || undefined;
    const baseUrl = request.headers.get('x-base-url') || undefined;

    const body = await request.json();
    const {
      transcript,
      operation = 'full',
      model = 'gpt-4o-mini',
      useMock = false,
    } = body as {
      transcript: TranscriptUtterance[];
      operation?: 'full' | 'summary' | 'actionItems' | 'decisions' | 'highlights';
      model?: string;
      useMock?: boolean;
    };

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'A non-empty transcript array is required for analysis.',
          },
        },
        { status: 400 }
      );
    }

    // Demo/mock bypass
    if (useMock) {
      const mockData = getMockMeetingAnalysis();
      return NextResponse.json({
        success: true,
        data: mockData,
      });
    }

    // Check if API key is provided either in header or server env
    const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
    if (!effectiveKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message:
              'No OpenAI API key provided. Please configure your API key in the top bar or run in Demo Mode.',
          },
        },
        { status: 401 }
      );
    }

    const result = await analyzeMeeting({
      transcript,
      operation,
      apiKey: effectiveKey,
      baseUrl,
      model,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error('API /api/analyze error:', err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown internal error';
    let code = 'LLM_ERROR';
    let status = 500;

    if (errorMessage === 'NO_API_KEY') {
      code = 'NO_API_KEY';
      status = 401;
    } else if (errorMessage.includes('Incorrect API key') || errorMessage.includes('401')) {
      code = 'INVALID_API_KEY';
      status = 401;
    } else if (errorMessage.includes('Zod schema validation failed')) {
      code = 'VALIDATION_FAILED';
      status = 502;
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message: errorMessage,
        },
      },
      { status }
    );
  }
}

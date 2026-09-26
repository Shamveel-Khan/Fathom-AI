import { TranscriptUtterance } from '../schemas/meeting';
import {
  MeetingAnalysis,
  MeetingAnalysisSchema,
  AnalysisOperation,
} from '../schemas/analysis';
import { createOpenAIClient } from './client';
import { SYSTEM_PROMPT_ANALYSIS, formatTranscriptForPrompt } from './prompts';

export interface AnalyzeMeetingOptions {
  transcript: TranscriptUtterance[];
  operation?: AnalysisOperation;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export async function analyzeMeeting(
  options: AnalyzeMeetingOptions
): Promise<MeetingAnalysis> {
  const { transcript, apiKey, baseUrl, model = 'gpt-4o-mini' } = options;

  if (!transcript || transcript.length === 0) {
    throw new Error('Transcript cannot be empty');
  }

  // Create client (throws if no key in options or env)
  const client = createOpenAIClient({ apiKey, baseUrl });
  const userPrompt = formatTranscriptForPrompt(transcript);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_ANALYSIS },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('LLM returned an empty response');
  }

  // Parse raw JSON
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    throw new Error('Failed to parse LLM output as JSON');
  }

  // Validate with Zod schema
  const validationResult = MeetingAnalysisSchema.safeParse(parsedJson);

  if (!validationResult.success) {
    console.error('Zod schema validation failed:', validationResult.error);
    throw new Error(`AI response structure mismatch: ${validationResult.error.message}`);
  }

  return validationResult.data;
}

/**
 * Mock generator for offline testing or instant preview demo.
 */
export function getMockMeetingAnalysis(): MeetingAnalysis {
  return {
    executiveSummary:
      'The team conducted a Q3 feature rollout and risk assessment sync covering three primary pillars: the real-time AI summary engine, workspace migration, and updated billing tiers. Frontend reporting confirmed 95% completion with robust latency and memory profiles. Infrastructure raised token-bucket rate limits on LLM proxy handlers, leading to an agreed policy of Bring-Your-Own-Key (BYOK) for power users. All marketing and deployment milestones remain on track for Friday.',
    keyTakeaways: [
      'Frontend meeting timeline and AI action-items panel are 95% complete with under 45MB memory usage.',
      'Adopted BYOK model for power users and 5 runs/day limit for free users.',
      'Decision made to include transcript deep-link timestamps in all clipboard/Slack exports.',
      'Staging deployment set for Thursday night with public marketing launch Friday at 2 PM EST.',
    ],
    actionItems: [
      {
        id: 'act-1',
        task: 'Implement Redis token-bucket limiter and integration tests',
        assignee: 'Marcus Brody',
        context: 'To prevent rate limiting when users run simultaneous transcript summaries',
        completed: false,
      },
      {
        id: 'act-2',
        task: 'Add deep-link timestamps to copy-to-markdown export payload',
        assignee: 'Alex Rivera',
        context: 'Requested by marketing for richer Slack and documentation sharing',
        completed: false,
      },
      {
        id: 'act-3',
        task: 'Finalize draft of release notes and changelog blog post',
        assignee: 'Elena Rostova',
        context: 'Draft due Thursday morning ahead of Friday 2 PM newsletter blast',
        completed: false,
      },
      {
        id: 'act-4',
        task: 'Review pricing tier copy for enterprise billing update',
        assignee: 'Sarah Chen',
        context: 'Part of Q3 launch deliverables',
        completed: false,
      },
    ],
    decisions: [
      {
        id: 'dec-1',
        decision: 'Enforce Bring-Your-Own-Key (BYOK) for high-frequency AI users while capping free tier to 5 daily runs',
        rationale: 'Mitigate LLM proxy rate limits and manage API compute overhead',
        madeBy: 'Sarah Chen & Marcus Brody',
      },
      {
        id: 'dec-2',
        decision: 'All exported summaries will include transcript deep-link timestamps by default',
        rationale: 'Provides seamless verification back to the source audio/utterance moment',
        madeBy: 'Sarah Chen',
      },
      {
        id: 'dec-3',
        decision: 'Staging deployment locked for Thursday night to guarantee QA smoke testing Friday morning',
        rationale: 'Prevents release day bugs before the 2 PM EST public announcement',
        madeBy: 'Marcus Brody',
      },
    ],
    highlights: [
      {
        id: 'hl-1',
        quote: "We tested latency with 50+ participants and client memory stayed rock-solid under 45MB.",
        speaker: 'Alex Rivera',
        timestamp: '00:38',
        significance: 'Validates frontend scalability for enterprise-scale calls.',
      },
      {
        id: 'hl-2',
        quote: "All clipboard exports will contain deep-linked transcript timestamps by default.",
        speaker: 'Sarah Chen',
        timestamp: '05:15',
        significance: 'Core UX differentiator connecting AI summaries directly to source evidence.',
      },
    ],
  };
}

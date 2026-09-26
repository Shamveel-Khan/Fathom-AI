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

export interface ReviewMeetingOptions {
  transcript: TranscriptUtterance[];
  template?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export async function generateMeetingReview(
  options: ReviewMeetingOptions
): Promise<import('../schemas/review').AIReview> {
  const { transcript, template, apiKey, baseUrl, model = 'gpt-4o-mini' } = options;

  if (!transcript || transcript.length === 0) {
    throw new Error('Transcript cannot be empty');
  }

  const { AIReviewSchema } = await import('../schemas/review');
  const { SYSTEM_PROMPT_REVIEW, formatReviewPrompt } = await import('./prompts');

  const client = createOpenAIClient({ apiKey, baseUrl });
  const userPrompt = formatReviewPrompt(transcript, template);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_REVIEW },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('LLM returned an empty review response');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    throw new Error('Failed to parse LLM review output as JSON');
  }

  const validationResult = AIReviewSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    console.error('AI Review Zod schema validation failed:', validationResult.error);
    throw new Error(`AI Review structure mismatch: ${validationResult.error.message}`);
  }

  return validationResult.data;
}

export function getMockMeetingReview(template?: string): import('../schemas/review').AIReview {
  if (template === 'sales') {
    return {
      overallScore: 82,
      summary:
        'Strong alignment on pain points and team evaluation criteria, but contract term commitment and security questionnaire sign-off deadline remain unspecified.',
      unresolvedQuestions: [
        {
          id: 'uq-1',
          question: 'Does Acme Corp require self-hosted audit logging or is SOC2 Type II compliance sufficient?',
          raisedBy: 'David Miller (Acme VP Eng)',
          context: 'Crucial for enterprise compliance sign-off ahead of legal review',
          severity: 'high',
        },
      ],
      unassignedResponsibilities: [
        {
          id: 'ur-1',
          task: 'Send updated enterprise security whitepaper and DPA draft',
          context: 'Needed before David presents to their CISO',
          suggestedRole: 'Sales Solutions Engineer',
        },
      ],
      missingDeadlines: [
        {
          id: 'md-1',
          task: 'Finalize customized pricing proposal for 250 seats',
          assignee: 'Sarah Chen',
          urgency: 'high',
        },
      ],
      missingDependencies: [
        {
          id: 'dp-1',
          blocker: 'Infra team must confirm custom data retention toggle timeline',
          impactedArea: 'Sales contract clause 4.2',
          description: 'Client needs 90-day retention guarantee',
        },
      ],
      contradictions: [],
      potentialRisks: [
        {
          id: 'rk-1',
          risk: 'Competitor vendor POC is running concurrently through end of month',
          severity: 'high',
          mitigation: 'Deliver benchmark speed tests and share ROI model by Wednesday',
        },
      ],
      reviewedAt: new Date().toISOString(),
    };
  }

  return {
    overallScore: 86,
    summary:
      'High team alignment on core deliverables and architecture, with slight ambiguity around rate limiting rollback procedures and staging QA cut-off timestamps.',
    unresolvedQuestions: [
      {
        id: 'uq-1',
        question: 'What is the fallback threshold if Redis token-bucket limiter latency exceeds 15ms?',
        raisedBy: 'Elena Rostova',
        context: 'Redis latency spike could degrade summary streaming speed during peak launch traffic',
        severity: 'medium',
      },
      {
        id: 'uq-2',
        question: 'Will existing free-tier accounts be grandfathered or immediately prompted for BYOK key?',
        raisedBy: 'Alex Rivera',
        context: 'Affects onboarding toast messaging on Friday rollout',
        severity: 'high',
      },
    ],
    unassignedResponsibilities: [
      {
        id: 'ur-1',
        task: 'Monitor production error rate metrics in Datadog during the Friday 2 PM rollout',
        context: 'Needs designated on-call engineer',
        suggestedRole: 'DevOps / SRE Lead',
      },
    ],
    missingDeadlines: [
      {
        id: 'md-1',
        task: 'Review pricing tier copy for enterprise billing update',
        assignee: 'Sarah Chen',
        urgency: 'high',
      },
      {
        id: 'md-2',
        task: 'Add deep-link timestamps to copy-to-markdown export payload',
        assignee: 'Alex Rivera',
        urgency: 'medium',
      },
    ],
    missingDependencies: [
      {
        id: 'dp-1',
        blocker: 'Production database schema migration must complete before Thursday staging lock',
        impactedArea: 'Release Staging Deployment',
        description: 'New columns required for transcript search indexing',
      },
    ],
    contradictions: [
      {
        id: 'ct-1',
        topic: 'Launch announcement timing',
        statements: [
          'Elena mentioned 2 PM EST newsletter blast',
          'Marcus noted final QA sign-off may extend until 2:30 PM EST',
        ],
        participantsInvolved: ['Elena Rostova', 'Marcus Brody'],
      },
    ],
    potentialRisks: [
      {
        id: 'rk-1',
        risk: 'Third-party LLM rate limit quotas could be exceeded if concurrent summary requests surge 5x',
        severity: 'high',
        mitigation: 'Implement exponential backoff and provide immediate fallback to BYOK user key',
      },
      {
        id: 'rk-2',
        risk: 'Staging lock on Thursday night leaves narrow 4-hour window for Friday morning regression smoke test',
        severity: 'medium',
        mitigation: 'Automate Playwright critical path tests in staging CI pipeline',
      },
    ],
    reviewedAt: new Date().toISOString(),
  };
}

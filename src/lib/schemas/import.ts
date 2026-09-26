import { z } from 'zod';
import { AIReviewSchema } from './review';

export const ImportParticipantSchema = z.object({
  name: z.string().min(1, 'Participant name is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  role: z.string().optional().nullable(),
  avatarColor: z.string().optional().nullable(),
});

export const ImportTranscriptUtteranceSchema = z.object({
  id: z.string().optional(),
  speaker: z.string().min(1, 'Speaker name is required'),
  speakerRole: z.string().optional().nullable(),
  timestamp: z.string().min(1, 'Timestamp is required (e.g. "01:24")'),
  timestampSeconds: z.number().nonnegative().optional(),
  text: z.string().min(1, 'Transcript text cannot be empty'),
});

export const ImportActionItemSchema = z.object({
  id: z.string().optional(),
  task: z.string().min(1, 'Task description is required'),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  context: z.string().optional().nullable(),
  completed: z.boolean().default(false),
});

export const ImportDecisionSchema = z.object({
  id: z.string().optional(),
  decision: z.string().min(1, 'Decision text is required'),
  rationale: z.string().optional().nullable(),
  madeBy: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
  timestampSeconds: z.number().nonnegative().optional(),
});

export const ImportHighlightSchema = z.object({
  id: z.string().optional(),
  quote: z.string().min(1, 'Quote is required'),
  speaker: z.string().min(1, 'Speaker is required'),
  timestamp: z.string().min(1, 'Timestamp is required'),
  timestampSeconds: z.number().nonnegative().optional(),
  significance: z.string().min(1, 'Significance description is required'),
  category: z
    .enum(['key_moment', 'decision', 'action', 'risk', 'question', 'user_saved'])
    .default('key_moment'),
  isUserSaved: z.boolean().default(false),
});

export const ImportAnalysisSchema = z.object({
  executiveSummary: z.string().min(1, 'Executive summary is required'),
  keyTakeaways: z.array(z.string()).default([]),
  actionItems: z.array(ImportActionItemSchema).default([]),
  decisions: z.array(ImportDecisionSchema).default([]),
  highlights: z.array(ImportHighlightSchema).default([]),
  analyzedAt: z.string().optional(),
});

export const ImportMeetingSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Meeting title is required'),
  date: z.string().min(1, 'Meeting date is required (e.g. "Oct 24, 2026")'),
  durationMinutes: z.coerce.number().positive('Duration must be a positive number').default(30),
  template: z
    .enum(['general', 'one_on_one', 'sales', 'interview', 'project'])
    .default('general'),
  videoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  participants: z.array(ImportParticipantSchema).min(1, 'At least one participant is required'),
  transcript: z.array(ImportTranscriptUtteranceSchema).min(1, 'At least one transcript utterance is required'),
  analysis: ImportAnalysisSchema.nullable().optional(),
  review: AIReviewSchema.nullable().optional(),
});

export type ImportMeetingInput = z.infer<typeof ImportMeetingSchema>;

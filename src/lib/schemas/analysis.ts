import { z } from 'zod';

export const ActionItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  assignee: z.string().nullable().optional(),
  context: z.string().optional(),
  completed: z.boolean().default(false),
});

export const DecisionSchema = z.object({
  id: z.string(),
  decision: z.string(),
  rationale: z.string().optional(),
  madeBy: z.string().optional(),
});

export const HighlightSchema = z.object({
  id: z.string(),
  quote: z.string(),
  speaker: z.string(),
  timestamp: z.string(),
  significance: z.string(),
});

export const MeetingAnalysisSchema = z.object({
  executiveSummary: z.string(),
  keyTakeaways: z.array(z.string()),
  actionItems: z.array(ActionItemSchema),
  decisions: z.array(DecisionSchema),
  highlights: z.array(HighlightSchema),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type MeetingAnalysis = z.infer<typeof MeetingAnalysisSchema>;

export type AnalysisOperation = 'full' | 'summary' | 'actionItems' | 'decisions' | 'highlights';

export interface AnalyzeRequest {
  transcript: Array<{
    id: string;
    speaker: string;
    speakerRole?: string;
    timestamp: string;
    text: string;
  }>;
  operation?: AnalysisOperation;
  model?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: MeetingAnalysis;
  error?: {
    code: string;
    message: string;
  };
}

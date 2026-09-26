import { z } from 'zod';

export type SearchResultType = 'meeting' | 'transcript' | 'action_item' | 'decision' | 'highlight';

export const SearchResultItemSchema = z.object({
  id: z.string(),
  meetingId: z.string(),
  meetingTitle: z.string(),
  meetingDate: z.string(),
  type: z.enum(['meeting', 'transcript', 'action_item', 'decision', 'highlight']),
  title: z.string(),
  snippet: z.string(),
  speaker: z.string().optional(),
  timestamp: z.string().optional(),
  timestampSeconds: z.number().optional(),
  badgeText: z.string().optional(),
});

export type SearchResultItem = {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  speaker?: string;
  timestamp?: string;
  timestampSeconds?: number;
  badgeText?: string;
};

export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResultItem[];
  total: number;
}

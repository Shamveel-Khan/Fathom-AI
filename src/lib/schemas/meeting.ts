import { MeetingAnalysis, Highlight } from '@/lib/schemas/analysis';
import { AIReview } from '@/lib/schemas/review';

export interface Participant {
  name: string;
  email?: string;
  role?: string;
  avatarColor?: string;
}

export interface TranscriptUtterance {
  id: string;
  speaker: string;
  speakerRole?: string;
  timestamp: string; // e.g. "01:24"
  timestampSeconds?: number; // e.g. 84
  text: string;
}

export interface MeetingHighlight extends Highlight {
  category?: 'key_moment' | 'decision' | 'action' | 'risk' | 'question' | 'user_saved' | string;
  isUserSaved?: boolean;
  createdAt?: string;
}

export interface StoredMeetingAnalysis extends Omit<MeetingAnalysis, 'highlights'> {
  analyzedAt: string;
  highlights: MeetingHighlight[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  videoUrl?: string;
  template?: string; // 'general' | 'one_on_one' | 'sales' | 'interview' | 'project'
  participants: Participant[];
  transcript: TranscriptUtterance[];
  analysis?: StoredMeetingAnalysis | null;
  review?: AIReview | null;
  isOwner?: boolean;
  isShared?: boolean;
  sharedBy?: {
    id: string;
    name: string;
    email: string;
    avatarColor?: string;
    avatarUrl?: string;
  };
}

// Lightweight meeting summary for list views — no transcript, no full analysis
export interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  template?: string;
  participants: Participant[];
  hasAnalysis: boolean;
  hasReview?: boolean;
  actionItemsCount: number;
  decisionsCount: number;
  isShared?: boolean;
  sharedBy?: {
    id: string;
    name: string;
    email: string;
    avatarColor?: string;
    avatarUrl?: string;
  };
}


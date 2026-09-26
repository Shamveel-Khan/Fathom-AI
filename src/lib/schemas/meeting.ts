import { MeetingAnalysis } from '@/lib/schemas/analysis';

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
  timestamp: string;
  text: string;
}

export interface StoredMeetingAnalysis extends MeetingAnalysis {
  analyzedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  participants: Participant[];
  transcript: TranscriptUtterance[];
  analysis?: StoredMeetingAnalysis | null;
}

// Lightweight meeting summary for list views — no transcript, no full analysis
export interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  participants: Participant[];
  hasAnalysis: boolean;
  actionItemsCount: number;
  decisionsCount: number;
}

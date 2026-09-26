export interface Participant {
  name: string;
  role?: string;
  avatarColor?: string;
}

export interface TranscriptUtterance {
  id: string;
  speaker: string;
  speakerRole?: string;
  timestamp: string; // e.g. "01:24"
  text: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  participants: Participant[];
  transcript: TranscriptUtterance[];
}

import { User, UserAccount, CreateUserInput } from '@/lib/auth/types';
import { Meeting, MeetingSummary, MeetingHighlight } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';

export interface GoogleProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

// -------------------------------------------------------
// User Repository Interface
// -------------------------------------------------------
export interface IUserRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<User | null>;
  listAll(): Promise<User[]>;
  createUser(data: CreateUserInput): Promise<User>;
  findOrCreateOAuthUser(
    provider: string,
    providerAccountId: string,
    profile: GoogleProfile
  ): Promise<User>;
  linkOAuthAccount(
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<void>;
}


// -------------------------------------------------------
// Meeting Repository Interface
// -------------------------------------------------------
export interface IMeetingRepository {
  listMeetingsForUser(userId: string): Promise<MeetingSummary[]>;
  getMeetingById(userId: string, meetingId: string): Promise<Meeting | null>;
  saveMeetingAnalysis(
    userId: string,
    meetingId: string,
    analysis: MeetingAnalysis
  ): Promise<Meeting>;
  addHighlight(
    userId: string,
    meetingId: string,
    highlight: MeetingHighlight
  ): Promise<MeetingHighlight>;
  deleteHighlight(
    userId: string,
    meetingId: string,
    highlightId: string
  ): Promise<boolean>;
  toggleActionItem(
    userId: string,
    meetingId: string,
    actionItemId: string,
    completed: boolean
  ): Promise<boolean>;
}

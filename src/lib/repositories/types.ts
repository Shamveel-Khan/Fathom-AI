import { User, UserAccount } from '@/lib/auth/types';
import { Meeting, MeetingSummary } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';

// -------------------------------------------------------
// User Repository Interface
// -------------------------------------------------------
export interface IUserRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<User | null>;
  listAll(): Promise<User[]>;
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
}

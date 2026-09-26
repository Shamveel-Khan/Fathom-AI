import { User, UserAccount, CreateUserInput } from '@/lib/auth/types';
import { Meeting, MeetingSummary, MeetingHighlight } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';
import { AIReview } from '@/lib/schemas/review';
import { SearchResultItem } from '@/lib/schemas/search';

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
  searchUsers(query: string, excludeUserId: string): Promise<User[]>;
  createUser(data: CreateUserInput): Promise<User>;
  updateProfile(userId: string, data: { name?: string; role?: string; avatarColor?: string }): Promise<User>;
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
  saveMeetingReview(
    userId: string,
    meetingId: string,
    review: AIReview
  ): Promise<AIReview>;
  getMeetingReview(
    userId: string,
    meetingId: string
  ): Promise<AIReview | null>;
  updateMeetingTemplate(
    userId: string,
    meetingId: string,
    template: string
  ): Promise<boolean>;
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
  updateActionItem(
    userId: string,
    meetingId: string,
    actionItemId: string,
    updates: { completed?: boolean; assignee?: string | null; dueDate?: string | null }
  ): Promise<boolean>;
}

// -------------------------------------------------------
// Search Repository Interface
// -------------------------------------------------------
export interface ISearchRepository {
  search(userId: string, query: string): Promise<SearchResultItem[]>;
}

// -------------------------------------------------------
// Share Repository Interface
// -------------------------------------------------------
export interface PublicShareRecord {
  id: string;
  token: string;
  meetingId: string;
  createdAt: string;
  revokedAt?: string | null;
}

export interface SharedUserRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatarUrl?: string;
  sharedAt: string;
}

export interface IShareRepository {
  getPublicShare(meetingId: string): Promise<PublicShareRecord | null>;
  createPublicShare(userId: string, meetingId: string): Promise<PublicShareRecord>;
  revokePublicShare(userId: string, meetingId: string): Promise<boolean>;
  getMeetingByPublicToken(token: string): Promise<Meeting | null>;
  listSharedUsers(meetingId: string): Promise<SharedUserRecord[]>;
  shareWithUser(sharedByUserId: string, meetingId: string, sharedWithUserId: string): Promise<void>;
  removeUserShare(sharedByUserId: string, meetingId: string, sharedWithUserId: string): Promise<boolean>;
}



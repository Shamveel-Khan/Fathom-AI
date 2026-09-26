import fs from 'fs/promises';
import path from 'path';
import { User, UserAccount, CreateUserInput } from '@/lib/auth/types';
import { Meeting, MeetingSummary, MeetingHighlight } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';
import { IUserRepository, IMeetingRepository, ISearchRepository, IShareRepository, PublicShareRecord, SharedUserRecord, GoogleProfile } from './types';
import { SearchResultItem } from '@/lib/schemas/search';

const DATA_DIR = path.join(process.cwd(), 'data');

// The JSON files on disk still use the legacy schema
interface LegacyUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  dataFile: string;
  role?: string;
  avatarColor?: string;
}

interface UserDataFile {
  user: User;
  meetings: Meeting[];
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

function toMeetingSummary(meeting: Meeting): MeetingSummary {
  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    durationMinutes: meeting.durationMinutes,
    participants: meeting.participants,
    hasAnalysis: Boolean(meeting.analysis),
    actionItemsCount: meeting.analysis?.actionItems?.length ?? 0,
    decisionsCount: meeting.analysis?.decisions?.length ?? 0,
  };
}

export class JsonUserRepository implements IUserRepository {
  private readonly usersPath = path.join(DATA_DIR, 'users.json');

  private async readLegacyUsers(): Promise<LegacyUserRecord[]> {
    return readJson<LegacyUserRecord[]>(this.usersPath);
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const users = await this.readLegacyUsers();
    const u = users.find((r) => r.email.toLowerCase() === email.toLowerCase().trim());
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarColor: u.avatarColor,
      // Legacy JSON stores plaintext password — expose as passwordHash so
      // the login route can do a plain comparison in dev mode.
      // The Postgres repo uses real bcrypt hashes in production.
      passwordHash: u.password,
    };
  }

  async findById(id: string): Promise<User | null> {
    const users = await this.readLegacyUsers();
    const u = users.find((r) => r.id === id);
    if (!u) return null;
    return { id: u.id, name: u.name, email: u.email, role: u.role, avatarColor: u.avatarColor };
  }

  async listAll(): Promise<User[]> {
    const users = await this.readLegacyUsers();
    return users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatarColor: u.avatarColor }));
  }

  async searchUsers(_query: string, _excludeUserId: string): Promise<User[]> {
    throw new Error('searchUsers is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
  }

  // Not implemented for JSON repo — only the Postgres repo supports auth mutations
  async createUser(_data: CreateUserInput): Promise<User> {
    throw new Error('createUser is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
  }

  async updateProfile(_userId: string, _data: { name?: string; role?: string; avatarColor?: string }): Promise<User> {
    throw new Error('updateProfile is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
  }

  async findOrCreateOAuthUser(_provider: string, _id: string, _profile: GoogleProfile): Promise<User> {
    throw new Error('OAuth is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
  }

  async linkOAuthAccount(_userId: string, _provider: string, _accountId: string): Promise<void> {
    throw new Error('OAuth is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
  }
}



export class JsonMeetingRepository implements IMeetingRepository {
  private readonly usersPath = path.join(DATA_DIR, 'users.json');

  private async getUserDataFilePath(userId: string): Promise<string | null> {
    const users = await readJson<LegacyUserRecord[]>(this.usersPath);
    const account = users.find((u) => u.id === userId);
    if (!account) return null;
    return path.join(DATA_DIR, account.dataFile);
  }

  private async readUserData(userId: string): Promise<UserDataFile | null> {
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) return null;
    return readJson<UserDataFile>(filePath);
  }

  async listMeetingsForUser(userId: string): Promise<MeetingSummary[]> {
    const userData = await this.readUserData(userId);
    if (!userData) return [];
    return userData.meetings.map(toMeetingSummary);
  }

  async getMeetingById(userId: string, meetingId: string): Promise<Meeting | null> {
    const userData = await this.readUserData(userId);
    if (!userData) return null;
    return userData.meetings.find((m) => m.id === meetingId) ?? null;
  }

  async saveMeetingAnalysis(
    userId: string,
    meetingId: string,
    analysis: MeetingAnalysis
  ): Promise<Meeting> {
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) throw new Error(`No data file found for user ${userId}`);

    const userData = await readJson<UserDataFile>(filePath);
    const meetingIndex = userData.meetings.findIndex((m) => m.id === meetingId);
    if (meetingIndex === -1) throw new Error(`Meeting ${meetingId} not found for user ${userId}`);

    const existingHighlights = userData.meetings[meetingIndex].analysis?.highlights || [];
    const userSavedHighlights = existingHighlights.filter((h) => h.isUserSaved);

    const mergedHighlights: MeetingHighlight[] = [
      ...(analysis.highlights || []).map((h) => ({
        ...h,
        category: 'key_moment',
        isUserSaved: false,
      })),
      ...userSavedHighlights,
    ];

    const updatedMeeting: Meeting = {
      ...userData.meetings[meetingIndex],
      analysis: {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        highlights: mergedHighlights,
      },
    };

    userData.meetings[meetingIndex] = updatedMeeting;
    await writeJson(filePath, userData);

    return updatedMeeting;
  }

  async addHighlight(
    userId: string,
    meetingId: string,
    highlight: MeetingHighlight
  ): Promise<MeetingHighlight> {
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) throw new Error('User not found');

    const userData = await readJson<UserDataFile>(filePath);
    const meeting = userData.meetings.find((m) => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const newHighlight: MeetingHighlight = {
      ...highlight,
      id: highlight.id || `hl-user-${Date.now()}`,
      category: highlight.category || 'user_saved',
      isUserSaved: true,
      createdAt: new Date().toISOString(),
    };

    if (!meeting.analysis) {
      meeting.analysis = {
        executiveSummary: '',
        keyTakeaways: [],
        actionItems: [],
        decisions: [],
        highlights: [newHighlight],
        analyzedAt: new Date().toISOString(),
      };
    } else {
      meeting.analysis.highlights = [...(meeting.analysis.highlights || []), newHighlight];
    }

    await writeJson(filePath, userData);
    return newHighlight;
  }

  async deleteHighlight(
    userId: string,
    meetingId: string,
    highlightId: string
  ): Promise<boolean> {
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) return false;

    const userData = await readJson<UserDataFile>(filePath);
    const meeting = userData.meetings.find((m) => m.id === meetingId);
    if (!meeting || !meeting.analysis) return false;

    meeting.analysis.highlights = meeting.analysis.highlights.filter((h) => h.id !== highlightId);
    await writeJson(filePath, userData);
    return true;
  }

  async toggleActionItem(
    userId: string,
    meetingId: string,
    actionItemId: string,
    completed: boolean
  ): Promise<boolean> {
    return this.updateActionItem(userId, meetingId, actionItemId, { completed });
  }

  async updateActionItem(
    userId: string,
    meetingId: string,
    actionItemId: string,
    updates: { completed?: boolean; assignee?: string | null; dueDate?: string | null }
  ): Promise<boolean> {
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) return false;

    const userData = await readJson<UserDataFile>(filePath);
    const meeting = userData.meetings.find((m) => m.id === meetingId);
    if (!meeting || !meeting.analysis) return false;

    const item = meeting.analysis.actionItems.find((a) => a.id === actionItemId);
    if (!item) return false;

    if (updates.completed !== undefined) item.completed = updates.completed;
    if (updates.assignee !== undefined) item.assignee = updates.assignee;
    if (updates.dueDate !== undefined) item.dueDate = updates.dueDate;

    await writeJson(filePath, userData);
    return true;
  }

  async importMeeting(
    userId: string,
    input: import('@/lib/schemas/import').ImportMeetingInput
  ): Promise<Meeting> {
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) throw new Error('User not found');

    const userData = await readJson<UserDataFile>(filePath);
    const meetingId = input.id || `mtg-imp-${Date.now()}`;

    const newMeeting: Meeting = {
      id: meetingId,
      title: input.title,
      date: input.date,
      durationMinutes: input.durationMinutes || 30,
      videoUrl: input.videoUrl || undefined,
      template: input.template || 'general',
      participants: input.participants.map((p) => ({
        name: p.name,
        email: p.email || undefined,
        role: p.role || undefined,
        avatarColor: p.avatarColor || undefined,
      })),
      transcript: input.transcript.map((u, i) => ({
        id: u.id || `${meetingId}-utt-${i + 1}`,
        speaker: u.speaker,
        speakerRole: u.speakerRole || undefined,
        timestamp: u.timestamp,
        timestampSeconds: u.timestampSeconds,
        text: u.text,
      })),
      analysis: input.analysis
        ? {
            executiveSummary: input.analysis.executiveSummary,
            keyTakeaways: input.analysis.keyTakeaways || [],
            analyzedAt: input.analysis.analyzedAt || new Date().toISOString(),
            actionItems: (input.analysis.actionItems || []).map((a, i) => ({
              id: a.id || `${meetingId}-act-${i + 1}`,
              task: a.task,
              assignee: a.assignee || null,
              dueDate: a.dueDate || null,
              context: a.context || undefined,
              completed: Boolean(a.completed),
            })),
            decisions: (input.analysis.decisions || []).map((d, i) => ({
              id: d.id || `${meetingId}-dec-${i + 1}`,
              decision: d.decision,
              rationale: d.rationale || undefined,
              madeBy: d.madeBy || undefined,
              timestamp: d.timestamp || undefined,
              timestampSeconds: d.timestampSeconds,
            })),
            highlights: (input.analysis.highlights || []).map((h, i) => ({
              id: h.id || `${meetingId}-hl-${i + 1}`,
              quote: h.quote,
              speaker: h.speaker,
              timestamp: h.timestamp,
              timestampSeconds: h.timestampSeconds,
              significance: h.significance,
              category: h.category || 'key_moment',
              isUserSaved: Boolean(h.isUserSaved),
            })),
          }
        : null,
      review: input.review || null,
      isOwner: true,
      isShared: false,
    };

    userData.meetings.unshift(newMeeting);
    await writeJson(filePath, userData);
    return newMeeting;
  }

  async saveMeetingReview(
    _userId: string,
    _meetingId: string,
    _review: import('@/lib/schemas/review').AIReview
  ): Promise<import('@/lib/schemas/review').AIReview> {
    throw new Error('saveMeetingReview is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
  }

  async getMeetingReview(
    _userId: string,
    _meetingId: string
  ): Promise<import('@/lib/schemas/review').AIReview | null> {
    return null;
  }

  async updateMeetingTemplate(
    _userId: string,
    _meetingId: string,
    _template: string
  ): Promise<boolean> {
    return true;
  }
}

export class JsonSearchRepository implements ISearchRepository {
  private readonly meetingRepo: JsonMeetingRepository;

  constructor() {
    this.meetingRepo = new JsonMeetingRepository();
  }

  async search(userId: string, searchQuery: string): Promise<SearchResultItem[]> {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const summaries = await this.meetingRepo.listMeetingsForUser(userId);
    const results: SearchResultItem[] = [];

    for (const s of summaries) {
      const meeting = await this.meetingRepo.getMeetingById(userId, s.id);
      if (!meeting) continue;

      if (meeting.title.toLowerCase().includes(q)) {
        results.push({
          id: `sr-mtg-${meeting.id}`,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingDate: meeting.date,
          type: 'meeting',
          title: meeting.title,
          snippet: `Meeting recorded on ${meeting.date}`,
          badgeText: 'Meeting Title',
        });
      }

      for (const u of meeting.transcript || []) {
        if (u.text.toLowerCase().includes(q)) {
          results.push({
            id: `sr-utt-${u.id}`,
            meetingId: meeting.id,
            meetingTitle: meeting.title,
            meetingDate: meeting.date,
            type: 'transcript',
            title: `${u.speaker} at ${u.timestamp}`,
            snippet: u.text,
            speaker: u.speaker,
            timestamp: u.timestamp,
            timestampSeconds: u.timestampSeconds,
            badgeText: 'Transcript',
          });
        }
      }

      if (meeting.analysis) {
        for (const act of meeting.analysis.actionItems || []) {
          if (
            act.task.toLowerCase().includes(q) ||
            (act.assignee && act.assignee.toLowerCase().includes(q)) ||
            (act.context && act.context.toLowerCase().includes(q))
          ) {
            results.push({
              id: `sr-act-${act.id}`,
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              meetingDate: meeting.date,
              type: 'action_item',
              title: act.task,
              snippet: act.context || (act.assignee ? `Assigned to @${act.assignee}` : 'Action Item'),
              badgeText: 'Action Item',
            });
          }
        }

        for (const dec of meeting.analysis.decisions || []) {
          if (
            dec.decision.toLowerCase().includes(q) ||
            (dec.rationale && dec.rationale.toLowerCase().includes(q))
          ) {
            results.push({
              id: `sr-dec-${dec.id}`,
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              meetingDate: meeting.date,
              type: 'decision',
              title: dec.decision,
              snippet: dec.rationale || 'Key Decision',
              timestamp: dec.timestamp,
              timestampSeconds: dec.timestampSeconds,
              badgeText: 'Decision',
            });
          }
        }
      }
    }

    return results;
  }
}


export class JsonShareRepository implements IShareRepository {
  async getPublicShare(_meetingId: string): Promise<PublicShareRecord | null> {
    return null;
  }
  async createPublicShare(_userId: string, _meetingId: string): Promise<PublicShareRecord> {
    throw new Error('Sharing is not supported by the JSON repository. Set DATABASE_URL.');
  }
  async revokePublicShare(_userId: string, _meetingId: string): Promise<boolean> {
    return false;
  }
  async getMeetingByPublicToken(_token: string): Promise<Meeting | null> {
    return null;
  }
  async listSharedUsers(_meetingId: string): Promise<SharedUserRecord[]> {
    return [];
  }
  async shareWithUser(_sharedByUserId: string, _meetingId: string, _sharedWithUserId: string): Promise<void> {
    throw new Error('Sharing is not supported by the JSON repository. Set DATABASE_URL.');
  }
  async removeUserShare(_sharedByUserId: string, _meetingId: string, _sharedWithUserId: string): Promise<boolean> {
    return false;
  }
}

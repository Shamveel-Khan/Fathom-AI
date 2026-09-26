import fs from 'fs/promises';
import path from 'path';
import { User, UserAccount, CreateUserInput } from '@/lib/auth/types';
import { Meeting, MeetingSummary, MeetingHighlight } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';
import { IUserRepository, IMeetingRepository, GoogleProfile } from './types';

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

  // Not implemented for JSON repo — only the Postgres repo supports auth mutations
  async createUser(_data: CreateUserInput): Promise<User> {
    throw new Error('createUser is not supported by the JSON repository. Set DATABASE_URL to use PostgreSQL.');
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
    const filePath = await this.getUserDataFilePath(userId);
    if (!filePath) return false;

    const userData = await readJson<UserDataFile>(filePath);
    const meeting = userData.meetings.find((m) => m.id === meetingId);
    if (!meeting || !meeting.analysis) return false;

    const item = meeting.analysis.actionItems.find((a) => a.id === actionItemId);
    if (!item) return false;

    item.completed = completed;
    await writeJson(filePath, userData);
    return true;
  }
}

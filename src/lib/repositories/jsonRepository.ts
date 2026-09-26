import fs from 'fs/promises';
import path from 'path';
import { User, UserAccount } from '@/lib/auth/types';
import { Meeting, MeetingSummary } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';
import { IUserRepository, IMeetingRepository } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

// -------------------------------------------------------
// Internal file shape for user data files (user-X.json)
// -------------------------------------------------------
interface UserDataFile {
  user: User;
  meetings: Meeting[];
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  // Write to a temp file first, then rename for atomicity
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

// -------------------------------------------------------
// User Repository Implementation
// -------------------------------------------------------

export class JsonUserRepository implements IUserRepository {
  private readonly usersPath = path.join(DATA_DIR, 'users.json');

  async findByEmail(email: string): Promise<UserAccount | null> {
    const users = await readJson<UserAccount[]>(this.usersPath);
    return users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const users = await readJson<UserAccount[]>(this.usersPath);
    const account = users.find((u) => u.id === id);
    if (!account) return null;
    // Strip sensitive fields before returning
    const { password: _pw, dataFile: _df, ...user } = account;
    return user;
  }

  async listAll(): Promise<User[]> {
    const users = await readJson<UserAccount[]>(this.usersPath);
    return users.map(({ password: _pw, dataFile: _df, ...user }) => user);
  }

  // Helper for auth: get full account including dataFile
  async getFullAccount(id: string): Promise<UserAccount | null> {
    const users = await readJson<UserAccount[]>(this.usersPath);
    return users.find((u) => u.id === id) ?? null;
  }
}

// -------------------------------------------------------
// Meeting Repository Implementation
// -------------------------------------------------------

export class JsonMeetingRepository implements IMeetingRepository {
  private readonly usersPath = path.join(DATA_DIR, 'users.json');

  private async getUserDataFilePath(userId: string): Promise<string | null> {
    const users = await readJson<UserAccount[]>(this.usersPath);
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

    const updatedMeeting: Meeting = {
      ...userData.meetings[meetingIndex],
      analysis: {
        ...analysis,
        analyzedAt: new Date().toISOString(),
      },
    };

    userData.meetings[meetingIndex] = updatedMeeting;
    await writeJson(filePath, userData);

    return updatedMeeting;
  }
}

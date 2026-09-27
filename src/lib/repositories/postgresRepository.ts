import crypto from 'crypto';
import { query, withTransaction, queryClient } from '@/lib/db/client';
import { User, UserAccount, CreateUserInput } from '@/lib/auth/types';
import {
  IUserRepository,
  IMeetingRepository,
  ISearchRepository,
  IShareRepository,
  PublicShareRecord,
  SharedUserRecord,
  GoogleProfile,
  ActionItemWithMeeting,
  DecisionWithMeeting,
  DashboardData,
} from './types';
import { SearchResultItem } from '@/lib/schemas/search';
import {
  Meeting,
  MeetingSummary,
  Participant,
  TranscriptUtterance,
  MeetingHighlight,
  StoredMeetingAnalysis,
} from '@/lib/schemas/meeting';
import { MeetingAnalysis, ActionItem, Decision } from '@/lib/schemas/analysis';
import { AIReview } from '@/lib/schemas/review';
import { ImportMeetingInput } from '@/lib/schemas/import';
import { timestampToSeconds } from '@/lib/utils/time';

function parseJsonField<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// -------------------------------------------------------
// Postgres User Repository
// -------------------------------------------------------

export class PostgresUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserAccount | null> {
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      password_hash: string | null;
      role: string | null;
      avatar_color: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, name, email, password_hash, role, avatar_color, avatar_url
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      passwordHash: r.password_hash,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
    };
  }

  async findById(id: string): Promise<User | null> {
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, name, email, role, avatar_color, avatar_url
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
    };
  }

  async listAll(): Promise<User[]> {
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
      avatar_url: string | null;
    }>(`SELECT id, name, email, role, avatar_color, avatar_url FROM users ORDER BY name ASC`);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
    }));
  }

  async searchUsers(searchQuery: string, excludeUserId: string): Promise<User[]> {
    const pattern = `%${searchQuery.trim()}%`;
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, name, email, role, avatar_color, avatar_url
       FROM users
       WHERE id != $1
         AND (name ILIKE $2 OR email ILIKE $2)
       ORDER BY name ASC
       LIMIT 10`,
      [excludeUserId, pattern]
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
    }));
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const id = `user-${crypto.randomUUID()}`;
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
      avatar_url: string | null;
    }>(
      `INSERT INTO users (id, name, email, password, password_hash, updated_at)
       VALUES ($1, $2, $3, '', $4, NOW())
       RETURNING id, name, email, role, avatar_color, avatar_url`,
      [id, data.name.trim(), data.email.toLowerCase().trim(), data.passwordHash]
    );
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
    };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; role?: string; avatarColor?: string }
  ): Promise<User> {
    const updates: string[] = [];
    const values: unknown[] = [userId];
    let idx = 2;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(data.role.trim());
    }
    if (data.avatarColor !== undefined) {
      updates.push(`avatar_color = $${idx++}`);
      values.push(data.avatarColor);
    }
    updates.push(`updated_at = NOW()`);

    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
      avatar_url: string | null;
    }>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, email, role, avatar_color, avatar_url`,
      values
    );

    if (rows.length === 0) throw new Error('User not found');
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
    };
  }

  async findOrCreateOAuthUser(
    provider: string,
    providerAccountId: string,
    profile: GoogleProfile
  ): Promise<User> {
    // 1. Check if this OAuth account already exists
    const oauthRows = await query<{ user_id: string }>(
      `SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_account_id = $2`,
      [provider, providerAccountId]
    );

    if (oauthRows.length > 0) {
      const user = await this.findById(oauthRows[0].user_id);
      if (!user) throw new Error('OAuth user_id points to a non-existent user.');
      return user;
    }

    // 2. Check if a user with the same email exists (link accounts)
    const existingUser = await this.findByEmail(profile.email);
    if (existingUser) {
      await this.linkOAuthAccount(existingUser.id, provider, providerAccountId);
      // Optionally update avatar_url from Google profile
      if (profile.picture) {
        await query(
          `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
          [profile.picture, existingUser.id]
        );
      }
      return existingUser;
    }

    // 3. Create a brand-new user + link OAuth account (in a transaction)
    const newUserId = `user-${crypto.randomUUID()}`;
    await withTransaction(async (client) => {
      await queryClient(
        client,
        `INSERT INTO users (id, name, email, password, avatar_url, updated_at)
         VALUES ($1, $2, $3, '', $4, NOW())`,
        [newUserId, profile.name, profile.email.toLowerCase(), profile.picture ?? null]
      );
      const oauthId = `oauth-${crypto.randomUUID()}`;
      await queryClient(
        client,
        `INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id)
         VALUES ($1, $2, $3, $4)`,
        [oauthId, newUserId, provider, providerAccountId]
      );
    });

    const newUser = await this.findById(newUserId);
    if (!newUser) throw new Error('Failed to retrieve newly created OAuth user.');
    return newUser;
  }

  async linkOAuthAccount(
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<void> {
    const id = `oauth-${crypto.randomUUID()}`;
    await query(
      `INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (provider, provider_account_id) DO NOTHING`,
      [id, userId, provider, providerAccountId]
    );
  }
}


export class PostgresMeetingRepository implements IMeetingRepository {
  async listMeetingsForUser(userId: string): Promise<MeetingSummary[]> {
    // Fetch owned meetings + meetings shared with user via UNION
    const meetingRows = await query<{
      id: string;
      title: string;
      meeting_date: string;
      duration_minutes: number;
      template: string;
      has_analysis: boolean;
      has_review: boolean;
      action_items_count: string | number;
      decisions_count: string | number;
      is_owner: boolean;
      shared_by_id: string | null;
      shared_by_name: string | null;
      shared_by_email: string | null;
      shared_by_avatar_color: string | null;
      shared_by_avatar_url: string | null;
    }>(
      `SELECT
         m.id,
         m.title,
         m.meeting_date,
         m.duration_minutes,
         COALESCE(m.template, 'general') AS template,
         (a.id IS NOT NULL) AS has_analysis,
         (rev.id IS NOT NULL) AS has_review,
         COALESCE((SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id), 0) AS action_items_count,
         COALESCE((SELECT COUNT(*) FROM decisions WHERE meeting_id = m.id), 0) AS decisions_count,
         TRUE AS is_owner,
         NULL::text AS shared_by_id,
         NULL::text AS shared_by_name,
         NULL::text AS shared_by_email,
         NULL::text AS shared_by_avatar_color,
         NULL::text AS shared_by_avatar_url
       FROM meetings m
       LEFT JOIN analyses a ON a.meeting_id = m.id
       LEFT JOIN ai_reviews rev ON rev.meeting_id = m.id
       WHERE m.user_id = $1
       UNION ALL
       SELECT
         m.id,
         m.title,
         m.meeting_date,
         m.duration_minutes,
         COALESCE(m.template, 'general') AS template,
         (a.id IS NOT NULL) AS has_analysis,
         (rev.id IS NOT NULL) AS has_review,
         COALESCE((SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id), 0) AS action_items_count,
         COALESCE((SELECT COUNT(*) FROM decisions WHERE meeting_id = m.id), 0) AS decisions_count,
         FALSE AS is_owner,
         u.id AS shared_by_id,
         u.name AS shared_by_name,
         u.email AS shared_by_email,
         u.avatar_color AS shared_by_avatar_color,
         u.avatar_url AS shared_by_avatar_url
       FROM meeting_user_shares mus
       JOIN meetings m ON m.id = mus.meeting_id
       LEFT JOIN analyses a ON a.meeting_id = m.id
       LEFT JOIN ai_reviews rev ON rev.meeting_id = m.id
       JOIN users u ON u.id = mus.shared_by_user_id
       WHERE mus.shared_with_user_id = $1
       ORDER BY meeting_date DESC, id ASC`,
      [userId]
    );

    if (meetingRows.length === 0) return [];

    const meetingIds = meetingRows.map((m) => m.id);
    // Fetch participants for all meetings in one query
    const participantRows = await query<{
      meeting_id: string;
      name: string;
      email: string | null;
      role: string | null;
      avatar_color: string | null;
    }>(
      `SELECT meeting_id, name, email, role, avatar_color
       FROM participants
       WHERE meeting_id = ANY($1::text[])
       ORDER BY id ASC`,
      [meetingIds]
    );

    const participantsByMeeting: Record<string, Participant[]> = {};
    for (const p of participantRows) {
      if (!participantsByMeeting[p.meeting_id]) {
        participantsByMeeting[p.meeting_id] = [];
      }
      participantsByMeeting[p.meeting_id].push({
        name: p.name,
        email: p.email || undefined,
        role: p.role || undefined,
        avatarColor: p.avatar_color || undefined,
      });
    }

    return meetingRows.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.meeting_date,
      durationMinutes: Number(m.duration_minutes),
      template: m.template || 'general',
      participants: participantsByMeeting[m.id] || [],
      hasAnalysis: Boolean(m.has_analysis),
      hasReview: Boolean(m.has_review),
      actionItemsCount: Number(m.action_items_count),
      decisionsCount: Number(m.decisions_count),
      isShared: !m.is_owner,
      sharedBy: m.shared_by_id
        ? {
            id: m.shared_by_id,
            name: m.shared_by_name!,
            email: m.shared_by_email!,
            avatarColor: m.shared_by_avatar_color || undefined,
            avatarUrl: m.shared_by_avatar_url || undefined,
          }
        : undefined,
    }));
  }

  async getDashboardData(userId: string): Promise<DashboardData> {
    const meetings = await this.listMeetingsForUser(userId);
    const totalMeetings = meetings.length;
    const analyzedCount = meetings.filter((m) => m.hasAnalysis).length;
    const reviewCount = meetings.filter((m) => m.hasReview).length;
    const totalActionItems = meetings.reduce((sum, m) => sum + m.actionItemsCount, 0);

    const completedRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM action_items a
       JOIN meetings m ON m.id = a.meeting_id
       WHERE (m.user_id = $1 OR m.id IN (SELECT meeting_id FROM meeting_user_shares WHERE shared_with_user_id = $1))
         AND a.completed = TRUE`,
      [userId]
    );
    const completedActionItems = Number(completedRows[0]?.count || 0);

    return {
      stats: {
        totalMeetings,
        analyzedCount,
        reviewCount,
        totalActionItems,
        completedActionItems,
      },
      meetings,
    };
  }

  async getActionItemsForUser(userId: string): Promise<ActionItemWithMeeting[]> {
    const rows = await query<{
      id: string;
      task: string;
      assignee: string | null;
      due_date: string | null;
      context: string | null;
      completed: boolean;
      meeting_id: string;
      meeting_title: string;
      meeting_date: string;
    }>(
      `SELECT
         a.id,
         a.task,
         a.assignee,
         a.due_date,
         a.context,
         a.completed,
         m.id AS meeting_id,
         m.title AS meeting_title,
         m.meeting_date
       FROM action_items a
       JOIN meetings m ON m.id = a.meeting_id
       WHERE m.user_id = $1
          OR m.id IN (SELECT meeting_id FROM meeting_user_shares WHERE shared_with_user_id = $1)
       ORDER BY m.meeting_date DESC, a.id ASC`,
      [userId]
    );

    return rows.map((r) => ({
      id: r.id,
      task: r.task,
      assignee: r.assignee || undefined,
      dueDate: r.due_date || undefined,
      context: r.context || undefined,
      completed: Boolean(r.completed),
      status: r.completed ? 'done' : 'pending',
      meetingId: r.meeting_id,
      meetingTitle: r.meeting_title,
      meetingDate: r.meeting_date,
    }));
  }

  async getDecisionsForUser(userId: string): Promise<DecisionWithMeeting[]> {
    const rows = await query<{
      id: string;
      decision: string;
      rationale: string | null;
      made_by: string | null;
      impact: string | null;
      timestamp: string | null;
      timestamp_seconds: number | null;
      meeting_id: string;
      meeting_title: string;
      meeting_date: string;
    }>(
      `SELECT
         d.id,
         d.decision,
         d.rationale,
         d.made_by,
         d.impact,
         d.timestamp,
         d.timestamp_seconds,
         m.id AS meeting_id,
         m.title AS meeting_title,
         m.meeting_date
       FROM decisions d
       JOIN meetings m ON m.id = d.meeting_id
       WHERE m.user_id = $1
          OR m.id IN (SELECT meeting_id FROM meeting_user_shares WHERE shared_with_user_id = $1)
       ORDER BY m.meeting_date DESC, d.id ASC`,
      [userId]
    );

    if (rows.length === 0) return [];

    const meetingIds = Array.from(new Set(rows.map((r) => r.meeting_id)));
    const participantRows = await query<{ meeting_id: string; name: string }>(
      `SELECT meeting_id, name FROM participants WHERE meeting_id = ANY($1::text[])`,
      [meetingIds]
    );

    const participantsMap: Record<string, string[]> = {};
    for (const p of participantRows) {
      if (!participantsMap[p.meeting_id]) participantsMap[p.meeting_id] = [];
      participantsMap[p.meeting_id].push(p.name);
    }

    return rows.map((r) => ({
      id: r.id,
      decision: r.decision,
      rationale: r.rationale || undefined,
      madeBy: r.made_by || undefined,
      impact: r.impact || undefined,
      timestamp: r.timestamp || undefined,
      timestampSeconds: r.timestamp_seconds !== null ? Number(r.timestamp_seconds) : undefined,
      meetingId: r.meeting_id,
      meetingTitle: r.meeting_title,
      meetingDate: r.meeting_date,
      participants: participantsMap[r.meeting_id] || [],
    }));
  }

  async importMeeting(userId: string, input: ImportMeetingInput): Promise<Meeting> {
    const rawId = input.id?.trim();
    const cleanId = rawId
      ? (rawId.startsWith('mtg-') ? rawId : `mtg-${rawId}`)
      : `mtg-imp-${crypto.randomUUID().slice(0, 8)}`;

    // Ensure uniqueness: check if meeting ID already exists
    const existing = await query<{ id: string }>(`SELECT id FROM meetings WHERE id = $1`, [cleanId]);
    const finalMeetingId = existing.length > 0 ? `${cleanId}-${crypto.randomUUID().slice(0, 4)}` : cleanId;

    const durationMinutes = Number(input.durationMinutes) || 30;
    const template = input.template || 'general';

    await withTransaction(async (client) => {
      // 1. Insert Meeting
      await queryClient(
        client,
        `INSERT INTO meetings (id, user_id, title, meeting_date, duration_minutes, video_url, template)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          finalMeetingId,
          userId,
          input.title.trim(),
          input.date.trim(),
          durationMinutes,
          input.videoUrl || null,
          template,
        ]
      );

      // 2. Insert Participants
      for (let i = 0; i < (input.participants || []).length; i++) {
        const p = input.participants[i];
        const participantId = `${finalMeetingId}-part-${i + 1}`;
        await queryClient(
          client,
          `INSERT INTO participants (id, meeting_id, name, email, role, avatar_color)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            participantId,
            finalMeetingId,
            p.name.trim(),
            p.email?.trim() || null,
            p.role?.trim() || null,
            p.avatarColor?.trim() || null,
          ]
        );
      }

      // 3. Insert Transcript Utterances
      for (let i = 0; i < (input.transcript || []).length; i++) {
        const u = input.transcript[i];
        const seconds = u.timestampSeconds ?? timestampToSeconds(u.timestamp);
        const utteranceId = `${finalMeetingId}-utt-${i + 1}`;
        await queryClient(
          client,
          `INSERT INTO transcript_utterances (id, meeting_id, speaker, speaker_role, timestamp, timestamp_seconds, text, sequence_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            utteranceId,
            finalMeetingId,
            u.speaker.trim(),
            u.speakerRole?.trim() || null,
            u.timestamp.trim(),
            seconds,
            u.text.trim(),
            i,
          ]
        );
      }

      // 4. Insert Analysis if present
      if (input.analysis) {
        const analysisId = `ans-${finalMeetingId}`;
        await queryClient(
          client,
          `INSERT INTO analyses (id, meeting_id, executive_summary, key_takeaways, analyzed_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            analysisId,
            finalMeetingId,
            input.analysis.executiveSummary.trim(),
            JSON.stringify(input.analysis.keyTakeaways || []),
            input.analysis.analyzedAt || new Date().toISOString(),
          ]
        );

        // Action items
        for (let i = 0; i < (input.analysis.actionItems || []).length; i++) {
          const a = input.analysis.actionItems[i];
          const actionId = `${finalMeetingId}-act-${i + 1}`;
          await queryClient(
            client,
            `INSERT INTO action_items (id, meeting_id, task, assignee, due_date, context, completed)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              actionId,
              finalMeetingId,
              a.task.trim(),
              a.assignee?.trim() || null,
              a.dueDate?.trim() || null,
              a.context?.trim() || null,
              Boolean(a.completed),
            ]
          );
        }

        // Decisions
        for (let i = 0; i < (input.analysis.decisions || []).length; i++) {
          const d = input.analysis.decisions[i];
          const decisionId = `${finalMeetingId}-dec-${i + 1}`;
          const ts = d.timestamp || '00:00';
          const tsSecs = d.timestampSeconds ?? timestampToSeconds(ts);

          await queryClient(
            client,
            `INSERT INTO decisions (id, meeting_id, decision, rationale, made_by, timestamp, timestamp_seconds)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              decisionId,
              finalMeetingId,
              d.decision.trim(),
              d.rationale?.trim() || null,
              d.madeBy?.trim() || null,
              ts,
              tsSecs,
            ]
          );
        }

        // Highlights
        for (let i = 0; i < (input.analysis.highlights || []).length; i++) {
          const h = input.analysis.highlights[i];
          const hSecs = h.timestampSeconds ?? timestampToSeconds(h.timestamp);
          const highlightId = `${finalMeetingId}-hl-${i + 1}`;
          await queryClient(
            client,
            `INSERT INTO highlights (id, meeting_id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              highlightId,
              finalMeetingId,
              h.quote.trim(),
              h.speaker.trim(),
              h.timestamp.trim(),
              hSecs,
              h.significance?.trim() || null,
              h.category || 'key_moment',
              Boolean(h.isUserSaved),
            ]
          );
        }
      }

      // 5. Insert AI Review if present
      if (input.review) {
        const rev = input.review;
        const reviewId = `rev-${finalMeetingId}`;
        await queryClient(
          client,
          `INSERT INTO ai_reviews (
             id, meeting_id, overall_score, summary, unresolved_questions,
             unassigned_responsibilities, missing_deadlines, missing_dependencies,
             contradictions, potential_risks, reviewed_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            reviewId,
            finalMeetingId,
            rev.overallScore ?? 85,
            rev.summary || '',
            JSON.stringify(rev.unresolvedQuestions || []),
            JSON.stringify(rev.unassignedResponsibilities || []),
            JSON.stringify(rev.missingDeadlines || []),
            JSON.stringify(rev.missingDependencies || []),
            JSON.stringify(rev.contradictions || []),
            JSON.stringify(rev.potentialRisks || []),
            rev.reviewedAt || new Date().toISOString(),
          ]
        );
      }
    });

    const created = await this.getMeetingById(userId, finalMeetingId);
    if (!created) {
      throw new Error(`Failed to retrieve imported meeting ${finalMeetingId}`);
    }
    return created;
  }

  async getMeetingById(userId: string, meetingId: string): Promise<Meeting | null> {
    const meetingRows = await query<{
      id: string;
      user_id: string;
      title: string;
      meeting_date: string;
      duration_minutes: number;
      video_url: string | null;
      template: string | null;
      is_owner: boolean;
      shared_by_id: string | null;
      shared_by_name: string | null;
      shared_by_email: string | null;
      shared_by_avatar_color: string | null;
      shared_by_avatar_url: string | null;
    }>(
      `SELECT m.id, m.user_id, m.title, m.meeting_date, m.duration_minutes, m.video_url,
              COALESCE(m.template, 'general') AS template,
              (m.user_id = $2) AS is_owner,
              NULL::text AS shared_by_id, NULL::text AS shared_by_name,
              NULL::text AS shared_by_email, NULL::text AS shared_by_avatar_color, NULL::text AS shared_by_avatar_url
       FROM meetings m
       WHERE m.id = $1 AND m.user_id = $2
       UNION ALL
       SELECT m.id, m.user_id, m.title, m.meeting_date, m.duration_minutes, m.video_url,
              COALESCE(m.template, 'general') AS template,
              FALSE AS is_owner,
              u.id AS shared_by_id, u.name AS shared_by_name,
              u.email AS shared_by_email, u.avatar_color AS shared_by_avatar_color, u.avatar_url AS shared_by_avatar_url
       FROM meeting_user_shares mus
       JOIN meetings m ON m.id = mus.meeting_id
       JOIN users u ON u.id = mus.shared_by_user_id
       WHERE mus.meeting_id = $1 AND mus.shared_with_user_id = $2
       LIMIT 1`,
      [meetingId, userId]
    );

    if (meetingRows.length === 0) return null;
    const m = meetingRows[0];

    // 1. Participants
    const participantRows = await query<{
      name: string;
      email: string | null;
      role: string | null;
      avatar_color: string | null;
    }>(
      `SELECT name, email, role, avatar_color
       FROM participants
       WHERE meeting_id = $1
       ORDER BY id ASC`,
      [meetingId]
    );

    const participants: Participant[] = participantRows.map((p) => ({
      name: p.name,
      email: p.email || undefined,
      role: p.role || undefined,
      avatarColor: p.avatar_color || undefined,
    }));

    // 2. Transcript Utterances
    const utteranceRows = await query<{
      id: string;
      speaker: string;
      speaker_role: string | null;
      timestamp: string;
      timestamp_seconds: number;
      text: string;
    }>(
      `SELECT id, speaker, speaker_role, timestamp, timestamp_seconds, text
       FROM transcript_utterances
       WHERE meeting_id = $1
       ORDER BY sequence_order ASC, timestamp_seconds ASC`,
      [meetingId]
    );

    const transcript: TranscriptUtterance[] = utteranceRows.map((u) => ({
      id: u.id,
      speaker: u.speaker,
      speakerRole: u.speaker_role || undefined,
      timestamp: u.timestamp,
      timestampSeconds: Number(u.timestamp_seconds),
      text: u.text,
    }));

    // 3. Analysis
    const analysisRows = await query<{
      executive_summary: string;
      key_takeaways: unknown;
      analyzed_at: Date | string;
    }>(
      `SELECT executive_summary, key_takeaways, analyzed_at
       FROM analyses
       WHERE meeting_id = $1`,
      [meetingId]
    );

    let analysis: StoredMeetingAnalysis | null = null;

    if (analysisRows.length > 0) {
      const a = analysisRows[0];

      // Action items
      const actionRows = await query<{
        id: string;
        task: string;
        assignee: string | null;
        due_date: string | null;
        context: string | null;
        completed: boolean;
      }>(
        `SELECT id, task, assignee, due_date, context, completed
         FROM action_items
         WHERE meeting_id = $1
         ORDER BY created_at ASC`,
        [meetingId]
      );

      // Decisions
      const decisionRows = await query<{
        id: string;
        decision: string;
        rationale: string | null;
        made_by: string | null;
        timestamp: string | null;
        timestamp_seconds: number | null;
      }>(
        `SELECT id, decision, rationale, made_by, timestamp, timestamp_seconds
         FROM decisions
         WHERE meeting_id = $1
         ORDER BY created_at ASC`,
        [meetingId]
      );

      // Highlights
      const highlightRows = await query<{
        id: string;
        quote: string;
        speaker: string;
        timestamp: string;
        timestamp_seconds: number;
        significance: string | null;
        category: string | null;
        is_user_saved: boolean;
        created_at: Date | string;
      }>(
        `SELECT id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved, created_at
         FROM highlights
         WHERE meeting_id = $1
         ORDER BY timestamp_seconds ASC, created_at ASC`,
        [meetingId]
      );

      const keyTakeaways = parseJsonField<string[]>(a.key_takeaways, []);

      analysis = {
        executiveSummary: a.executive_summary,
        keyTakeaways,
        analyzedAt:
          a.analyzed_at instanceof Date
            ? a.analyzed_at.toISOString()
            : String(a.analyzed_at),
        actionItems: actionRows.map((act) => ({
          id: act.id,
          task: act.task,
          assignee: act.assignee || null,
          dueDate: act.due_date || null,
          context: act.context || undefined,
          completed: Boolean(act.completed),
        })),
        decisions: decisionRows.map((d) => ({
          id: d.id,
          decision: d.decision,
          rationale: d.rationale || undefined,
          madeBy: d.made_by || undefined,
          timestamp: d.timestamp || undefined,
          timestampSeconds: d.timestamp_seconds ?? undefined,
        })),
        highlights: highlightRows.map((h) => ({
          id: h.id,
          quote: h.quote,
          speaker: h.speaker,
          timestamp: h.timestamp,
          significance: h.significance || '',
          category: h.category || 'key_moment',
          isUserSaved: Boolean(h.is_user_saved),
          createdAt:
            h.created_at instanceof Date
              ? h.created_at.toISOString()
              : String(h.created_at),
        })),
      };
    }

    // 4. AI Review (if exists)
    const reviewRows = await query<{
      overall_score: number;
      summary: string;
      unresolved_questions: unknown;
      unassigned_responsibilities: unknown;
      missing_deadlines: unknown;
      missing_dependencies: unknown;
      contradictions: unknown;
      potential_risks: unknown;
      reviewed_at: Date | string;
    }>(
      `SELECT overall_score, summary, unresolved_questions, unassigned_responsibilities,
              missing_deadlines, missing_dependencies, contradictions, potential_risks, reviewed_at
       FROM ai_reviews
       WHERE meeting_id = $1`,
      [meetingId]
    );

    let review: AIReview | null = null;
    if (reviewRows.length > 0) {
      const rev = reviewRows[0];
      review = {
        overallScore: Number(rev.overall_score),
        summary: rev.summary,
        unresolvedQuestions: parseJsonField(rev.unresolved_questions, []),
        unassignedResponsibilities: parseJsonField(rev.unassigned_responsibilities, []),
        missingDeadlines: parseJsonField(rev.missing_deadlines, []),
        missingDependencies: parseJsonField(rev.missing_dependencies, []),
        contradictions: parseJsonField(rev.contradictions, []),
        potentialRisks: parseJsonField(rev.potential_risks, []),
        reviewedAt:
          rev.reviewed_at instanceof Date
            ? rev.reviewed_at.toISOString()
            : String(rev.reviewed_at),
      };
    }

    return {
      id: m.id,
      title: m.title,
      date: m.meeting_date,
      durationMinutes: Number(m.duration_minutes),
      videoUrl: m.video_url || undefined,
      template: m.template || 'general',
      participants,
      transcript,
      analysis,
      review,
      isOwner: Boolean(m.is_owner),
      isShared: !m.is_owner,
      sharedBy: m.shared_by_id
        ? {
            id: m.shared_by_id,
            name: m.shared_by_name!,
            email: m.shared_by_email!,
            avatarColor: m.shared_by_avatar_color || undefined,
            avatarUrl: m.shared_by_avatar_url || undefined,
          }
        : undefined,
    };
  }

  async saveMeetingAnalysis(
    userId: string,
    meetingId: string,
    analysis: MeetingAnalysis
  ): Promise<Meeting> {
    // Verify meeting ownership
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found for user ${userId}`);
    }

    const analyzedAt = new Date().toISOString();
    const analysisId = `ans-${meetingId}`;

    // Execute all updates inside an atomic transaction
    await withTransaction(async (client) => {
      // 1. Upsert analysis record
      await queryClient(
        client,
        `INSERT INTO analyses (id, meeting_id, executive_summary, key_takeaways, analyzed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (meeting_id) DO UPDATE SET
           executive_summary = EXCLUDED.executive_summary,
           key_takeaways = EXCLUDED.key_takeaways,
           analyzed_at = EXCLUDED.analyzed_at`,
        [
          analysisId,
          meetingId,
          analysis.executiveSummary,
          JSON.stringify(analysis.keyTakeaways || []),
          analyzedAt,
        ]
      );

      // 2. Delete existing AI action items and decisions (preserve user saved highlights)
      await queryClient(client, `DELETE FROM action_items WHERE meeting_id = $1`, [meetingId]);
      await queryClient(client, `DELETE FROM decisions WHERE meeting_id = $1`, [meetingId]);
      await queryClient(
        client,
        `DELETE FROM highlights WHERE meeting_id = $1 AND is_user_saved = FALSE`,
        [meetingId]
      );

      // 3. Insert action items with globally safe scoped IDs
      for (let i = 0; i < (analysis.actionItems || []).length; i++) {
        const a = analysis.actionItems[i];
        const uniqueActId = `${meetingId}-act-${i + 1}-${crypto.randomUUID().slice(0, 8)}`;
        await queryClient(
          client,
          `INSERT INTO action_items (id, meeting_id, task, assignee, due_date, context, completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uniqueActId,
            meetingId,
            a.task,
            a.assignee || null,
            a.dueDate || null,
            a.context || null,
            Boolean(a.completed),
          ]
        );
      }

      // 4. Insert decisions with globally safe scoped IDs
      for (let i = 0; i < (analysis.decisions || []).length; i++) {
        const d = analysis.decisions[i];
        const uniqueDecId = `${meetingId}-dec-${i + 1}-${crypto.randomUUID().slice(0, 8)}`;
        const dSecs = d.timestampSeconds ?? (d.timestamp ? timestampToSeconds(d.timestamp) : 0);
        await queryClient(
          client,
          `INSERT INTO decisions (id, meeting_id, decision, rationale, made_by, timestamp, timestamp_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uniqueDecId,
            meetingId,
            d.decision,
            d.rationale || null,
            d.madeBy || null,
            d.timestamp || null,
            dSecs,
          ]
        );
      }

      // 5. Insert AI highlights with globally safe scoped IDs
      for (let i = 0; i < (analysis.highlights || []).length; i++) {
        const h = analysis.highlights[i];
        const hSecs = timestampToSeconds(h.timestamp);
        const uniqueHlId = `${meetingId}-hl-${i + 1}-${crypto.randomUUID().slice(0, 8)}`;
        await queryClient(
          client,
          `INSERT INTO highlights (id, meeting_id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            uniqueHlId,
            meetingId,
            h.quote,
            h.speaker,
            h.timestamp,
            hSecs,
            h.significance || null,
            'key_moment',
            false,
          ]
        );
      }
    });

    const updated = await this.getMeetingById(userId, meetingId);
    if (!updated) {
      throw new Error('Failed to retrieve updated meeting after save');
    }
    return updated;
  }

  async addHighlight(
    userId: string,
    meetingId: string,
    highlight: MeetingHighlight
  ): Promise<MeetingHighlight> {
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const hSecs = timestampToSeconds(highlight.timestamp);
    const id = `${meetingId}-hl-user-${crypto.randomUUID()}`;
    const category = highlight.category || 'user_saved';
    const createdAt = new Date().toISOString();

    await query(
      `INSERT INTO highlights (id, meeting_id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        meetingId,
        highlight.quote,
        highlight.speaker,
        highlight.timestamp,
        hSecs,
        highlight.significance || null,
        category,
        true,
        createdAt,
      ]
    );

    return {
      ...highlight,
      id,
      category,
      isUserSaved: true,
      createdAt,
    };
  }

  async deleteHighlight(
    userId: string,
    meetingId: string,
    highlightId: string
  ): Promise<boolean> {
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) return false;

    await query(
      `DELETE FROM highlights WHERE id = $1 AND meeting_id = $2`,
      [highlightId, meetingId]
    );
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
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) return false;

    const setClauses: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (updates.completed !== undefined) {
      setClauses.push(`completed = $${paramIndex++}`);
      values.push(updates.completed);
    }
    if (updates.assignee !== undefined) {
      setClauses.push(`assignee = $${paramIndex++}`);
      values.push(updates.assignee);
    }
    if (updates.dueDate !== undefined) {
      setClauses.push(`due_date = $${paramIndex++}`);
      values.push(updates.dueDate);
    }

    if (setClauses.length === 0) return true;

    values.push(actionItemId);
    values.push(meetingId);

    await query(
      `UPDATE action_items
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND meeting_id = $${paramIndex++}`,
      values
    );
    return true;
  }

  async saveMeetingReview(
    userId: string,
    meetingId: string,
    review: AIReview
  ): Promise<AIReview> {
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) throw new Error('Meeting not found or access denied');
    if (!meeting.isOwner) throw new Error('Forbidden: Only meeting owner can save AI review');

    const reviewId = `rev-${meetingId}`;
    const reviewedAt = new Date().toISOString();

    await query(
      `INSERT INTO ai_reviews (
         id, meeting_id, overall_score, summary, unresolved_questions,
         unassigned_responsibilities, missing_deadlines, missing_dependencies,
         contradictions, potential_risks, reviewed_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (meeting_id) DO UPDATE SET
         overall_score = EXCLUDED.overall_score,
         summary = EXCLUDED.summary,
         unresolved_questions = EXCLUDED.unresolved_questions,
         unassigned_responsibilities = EXCLUDED.unassigned_responsibilities,
         missing_deadlines = EXCLUDED.missing_deadlines,
         missing_dependencies = EXCLUDED.missing_dependencies,
         contradictions = EXCLUDED.contradictions,
         potential_risks = EXCLUDED.potential_risks,
         reviewed_at = EXCLUDED.reviewed_at`,
      [
        reviewId,
        meetingId,
        review.overallScore ?? 85,
        review.summary,
        JSON.stringify(review.unresolvedQuestions || []),
        JSON.stringify(review.unassignedResponsibilities || []),
        JSON.stringify(review.missingDeadlines || []),
        JSON.stringify(review.missingDependencies || []),
        JSON.stringify(review.contradictions || []),
        JSON.stringify(review.potentialRisks || []),
        reviewedAt,
      ]
    );

    return {
      ...review,
      reviewedAt,
    };
  }

  async getMeetingReview(userId: string, meetingId: string): Promise<AIReview | null> {
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) return null;
    return meeting.review || null;
  }

  async updateMeetingTemplate(
    userId: string,
    meetingId: string,
    template: string
  ): Promise<boolean> {
    const rows = await query<{ id: string }>(
      `UPDATE meetings SET template = $1 WHERE id = $2 AND user_id = $3 RETURNING id`,
      [template, meetingId, userId]
    );
    return rows.length > 0;
  }
}

// -------------------------------------------------------
// Postgres Search Repository
// -------------------------------------------------------

export class PostgresSearchRepository implements ISearchRepository {
  async search(userId: string, searchQuery: string): Promise<SearchResultItem[]> {
    const q = searchQuery.trim();
    if (!q) return [];
    const pattern = `%${q}%`;

    const results: SearchResultItem[] = [];

    // 1. Search Meetings (title)
    const meetingRows = await query<{
      id: string;
      title: string;
      meeting_date: string;
    }>(
      `SELECT id, title, meeting_date
       FROM meetings
       WHERE user_id = $1 AND title ILIKE $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, pattern]
    );

    for (const m of meetingRows) {
      results.push({
        id: `sr-mtg-${m.id}`,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.meeting_date,
        type: 'meeting',
        title: m.title,
        snippet: `Meeting recorded on ${m.meeting_date}`,
        badgeText: 'Meeting Title',
      });
    }

    // 2. Search Transcripts (spoken text)
    const utteranceRows = await query<{
      id: string;
      meeting_id: string;
      meeting_title: string;
      meeting_date: string;
      speaker: string;
      timestamp: string;
      timestamp_seconds: number;
      text: string;
    }>(
      `SELECT u.id, u.meeting_id, m.title AS meeting_title, m.meeting_date,
              u.speaker, u.timestamp, u.timestamp_seconds, u.text
       FROM transcript_utterances u
       JOIN meetings m ON m.id = u.meeting_id
       WHERE m.user_id = $1 AND u.text ILIKE $2
       ORDER BY m.created_at DESC, u.timestamp_seconds ASC
       LIMIT 25`,
      [userId, pattern]
    );

    for (const u of utteranceRows) {
      results.push({
        id: `sr-utt-${u.id}`,
        meetingId: u.meeting_id,
        meetingTitle: u.meeting_title,
        meetingDate: u.meeting_date,
        type: 'transcript',
        title: `${u.speaker} at ${u.timestamp}`,
        snippet: u.text,
        speaker: u.speaker,
        timestamp: u.timestamp,
        timestampSeconds: u.timestamp_seconds,
        badgeText: 'Transcript',
      });
    }

    // 3. Search Action Items (task, assignee, context)
    const actionRows = await query<{
      id: string;
      meeting_id: string;
      meeting_title: string;
      meeting_date: string;
      task: string;
      assignee: string | null;
      due_date: string | null;
      context: string | null;
      completed: boolean;
    }>(
      `SELECT a.id, a.meeting_id, m.title AS meeting_title, m.meeting_date,
              a.task, a.assignee, a.due_date, a.context, a.completed
       FROM action_items a
       JOIN meetings m ON m.id = a.meeting_id
       WHERE m.user_id = $1 AND (a.task ILIKE $2 OR COALESCE(a.assignee, '') ILIKE $2 OR COALESCE(a.context, '') ILIKE $2)
       ORDER BY m.created_at DESC
       LIMIT 15`,
      [userId, pattern]
    );

    for (const act of actionRows) {
      const details = [
        act.assignee ? `Assignee: @${act.assignee}` : null,
        act.due_date ? `Due: ${act.due_date}` : null,
        act.completed ? 'Completed' : 'Pending',
      ]
        .filter(Boolean)
        .join(' • ');

      results.push({
        id: `sr-act-${act.id}`,
        meetingId: act.meeting_id,
        meetingTitle: act.meeting_title,
        meetingDate: act.meeting_date,
        type: 'action_item',
        title: act.task,
        snippet: act.context ? `${details} — ${act.context}` : details,
        badgeText: 'Action Item',
      });
    }

    // 4. Search Decisions
    const decisionRows = await query<{
      id: string;
      meeting_id: string;
      meeting_title: string;
      meeting_date: string;
      decision: string;
      rationale: string | null;
      made_by: string | null;
      timestamp: string | null;
      timestamp_seconds: number;
    }>(
      `SELECT d.id, d.meeting_id, m.title AS meeting_title, m.meeting_date,
              d.decision, d.rationale, d.made_by, d.timestamp, d.timestamp_seconds
       FROM decisions d
       JOIN meetings m ON m.id = d.meeting_id
       WHERE m.user_id = $1 AND (d.decision ILIKE $2 OR COALESCE(d.rationale, '') ILIKE $2)
       ORDER BY m.created_at DESC
       LIMIT 15`,
      [userId, pattern]
    );

    for (const dec of decisionRows) {
      results.push({
        id: `sr-dec-${dec.id}`,
        meetingId: dec.meeting_id,
        meetingTitle: dec.meeting_title,
        meetingDate: dec.meeting_date,
        type: 'decision',
        title: dec.decision,
        snippet: dec.rationale || (dec.made_by ? `Decided by ${dec.made_by}` : 'Key Decision'),
        timestamp: dec.timestamp || undefined,
        timestampSeconds: dec.timestamp_seconds || undefined,
        badgeText: 'Decision',
      });
    }

    // 5. Search Highlights
    const highlightRows = await query<{
      id: string;
      meeting_id: string;
      meeting_title: string;
      meeting_date: string;
      quote: string;
      speaker: string;
      timestamp: string;
      timestamp_seconds: number;
      significance: string | null;
    }>(
      `SELECT h.id, h.meeting_id, m.title AS meeting_title, m.meeting_date,
              h.quote, h.speaker, h.timestamp, h.timestamp_seconds, h.significance
       FROM highlights h
       JOIN meetings m ON m.id = h.meeting_id
       WHERE m.user_id = $1 AND (h.quote ILIKE $2 OR COALESCE(h.significance, '') ILIKE $2)
       ORDER BY m.created_at DESC
       LIMIT 15`,
      [userId, pattern]
    );

    for (const h of highlightRows) {
      results.push({
        id: `sr-hl-${h.id}`,
        meetingId: h.meeting_id,
        meetingTitle: h.meeting_title,
        meetingDate: h.meeting_date,
        type: 'highlight',
        title: `"${h.quote}"`,
        snippet: h.significance || `${h.speaker} at ${h.timestamp}`,
        speaker: h.speaker,
        timestamp: h.timestamp,
        timestampSeconds: h.timestamp_seconds,
        badgeText: 'Highlight',
      });
    }

    return results;
  }
}


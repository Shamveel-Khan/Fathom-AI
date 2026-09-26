import crypto from 'crypto';
import { query, withTransaction, queryClient } from '@/lib/db/client';
import { User, UserAccount } from '@/lib/auth/types';
import {
  Meeting,
  MeetingSummary,
  Participant,
  TranscriptUtterance,
  MeetingHighlight,
  StoredMeetingAnalysis,
} from '@/lib/schemas/meeting';
import { MeetingAnalysis, ActionItem, Decision } from '@/lib/schemas/analysis';
import { timestampToSeconds } from '@/lib/utils/time';
import { IUserRepository, IMeetingRepository } from './types';

// -------------------------------------------------------
// Postgres User Repository
// -------------------------------------------------------

export class PostgresUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserAccount | null> {
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      password: string;
      role: string | null;
      avatar_color: string | null;
    }>(
      `SELECT id, name, email, password, role, avatar_color
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
      password: r.password,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
      dataFile: `${r.id}.json`,
    };
  }

  async findById(id: string): Promise<User | null> {
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
    }>(
      `SELECT id, name, email, role, avatar_color
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
    };
  }

  async listAll(): Promise<User[]> {
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string | null;
      avatar_color: string | null;
    }>(`SELECT id, name, email, role, avatar_color FROM users ORDER BY name ASC`);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || undefined,
      avatarColor: r.avatar_color || undefined,
    }));
  }
}

// -------------------------------------------------------
// Postgres Meeting Repository
// -------------------------------------------------------

export class PostgresMeetingRepository implements IMeetingRepository {
  async listMeetingsForUser(userId: string): Promise<MeetingSummary[]> {
    const meetingRows = await query<{
      id: string;
      title: string;
      meeting_date: string;
      duration_minutes: number;
      has_analysis: boolean;
      action_items_count: string | number;
      decisions_count: string | number;
    }>(
      `SELECT
         m.id,
         m.title,
         m.meeting_date,
         m.duration_minutes,
         (a.id IS NOT NULL) AS has_analysis,
         COALESCE((SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id), 0) AS action_items_count,
         COALESCE((SELECT COUNT(*) FROM decisions WHERE meeting_id = m.id), 0) AS decisions_count
       FROM meetings m
       LEFT JOIN analyses a ON a.meeting_id = m.id
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC, m.id ASC`,
      [userId]
    );

    if (meetingRows.length === 0) return [];

    // Fetch participants for all user's meetings in one query
    const participantRows = await query<{
      meeting_id: string;
      name: string;
      email: string | null;
      role: string | null;
      avatar_color: string | null;
    }>(
      `SELECT meeting_id, name, email, role, avatar_color
       FROM participants
       WHERE meeting_id IN (SELECT id FROM meetings WHERE user_id = $1)
       ORDER BY id ASC`,
      [userId]
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
      participants: participantsByMeeting[m.id] || [],
      hasAnalysis: Boolean(m.has_analysis),
      actionItemsCount: Number(m.action_items_count),
      decisionsCount: Number(m.decisions_count),
    }));
  }

  async getMeetingById(userId: string, meetingId: string): Promise<Meeting | null> {
    const meetingRows = await query<{
      id: string;
      user_id: string;
      title: string;
      meeting_date: string;
      duration_minutes: number;
      video_url: string | null;
    }>(
      `SELECT id, user_id, title, meeting_date, duration_minutes, video_url
       FROM meetings
       WHERE id = $1 AND user_id = $2`,
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
        context: string | null;
        completed: boolean;
      }>(
        `SELECT id, task, assignee, context, completed
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
      }>(
        `SELECT id, decision, rationale, made_by
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

      let keyTakeaways: string[] = [];
      if (Array.isArray(a.key_takeaways)) {
        keyTakeaways = a.key_takeaways as string[];
      } else if (typeof a.key_takeaways === 'string') {
        try {
          keyTakeaways = JSON.parse(a.key_takeaways);
        } catch {}
      }

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
          context: act.context || undefined,
          completed: Boolean(act.completed),
        })),
        decisions: decisionRows.map((d) => ({
          id: d.id,
          decision: d.decision,
          rationale: d.rationale || undefined,
          madeBy: d.made_by || undefined,
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

    return {
      id: m.id,
      title: m.title,
      date: m.meeting_date,
      durationMinutes: Number(m.duration_minutes),
      videoUrl: m.video_url || undefined,
      participants,
      transcript,
      analysis,
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
          `INSERT INTO action_items (id, meeting_id, task, assignee, context, completed)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uniqueActId,
            meetingId,
            a.task,
            a.assignee || null,
            a.context || null,
            Boolean(a.completed),
          ]
        );
      }

      // 4. Insert decisions with globally safe scoped IDs
      for (let i = 0; i < (analysis.decisions || []).length; i++) {
        const d = analysis.decisions[i];
        const uniqueDecId = `${meetingId}-dec-${i + 1}-${crypto.randomUUID().slice(0, 8)}`;
        await queryClient(
          client,
          `INSERT INTO decisions (id, meeting_id, decision, rationale, made_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [uniqueDecId, meetingId, d.decision, d.rationale || null, d.madeBy || null]
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
    const meeting = await this.getMeetingById(userId, meetingId);
    if (!meeting) return false;

    await query(
      `UPDATE action_items SET completed = $1 WHERE id = $2 AND meeting_id = $3`,
      [completed, actionItemId, meetingId]
    );
    return true;
  }
}

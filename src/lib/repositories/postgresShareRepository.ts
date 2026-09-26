import crypto from 'crypto';
import { query } from '@/lib/db/client';
import { IShareRepository, PublicShareRecord, SharedUserRecord } from './types';
import { Meeting } from '@/lib/schemas/meeting';

// -------------------------------------------------------
// Postgres Share Repository
// -------------------------------------------------------

export class PostgresShareRepository implements IShareRepository {
  async getPublicShare(meetingId: string): Promise<PublicShareRecord | null> {
    const rows = await query<{
      id: string; token: string; meeting_id: string; created_at: string; revoked_at: string | null;
    }>(
      `SELECT id, token, meeting_id, created_at, revoked_at
       FROM meeting_public_shares
       WHERE meeting_id = $1 AND revoked_at IS NULL
       LIMIT 1`,
      [meetingId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return { id: r.id, token: r.token, meetingId: r.meeting_id, createdAt: String(r.created_at), revokedAt: r.revoked_at };
  }

  async createPublicShare(userId: string, meetingId: string): Promise<PublicShareRecord> {
    await query(
      `UPDATE meeting_public_shares SET revoked_at = NOW() WHERE meeting_id = $1 AND revoked_at IS NULL`,
      [meetingId]
    );
    const id = `pshare-${crypto.randomUUID()}`;
    const token = crypto.randomBytes(24).toString('base64url');
    const rows = await query<{
      id: string; token: string; meeting_id: string; created_at: string;
    }>(
      `INSERT INTO meeting_public_shares (id, token, meeting_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, token, meeting_id, created_at`,
      [id, token, meetingId, userId]
    );
    const r = rows[0];
    return { id: r.id, token: r.token, meetingId: r.meeting_id, createdAt: String(r.created_at) };
  }

  async revokePublicShare(userId: string, meetingId: string): Promise<boolean> {
    const rows = await query<{ id: string }>(
      `UPDATE meeting_public_shares SET revoked_at = NOW()
       WHERE meeting_id = $1 AND created_by = $2 AND revoked_at IS NULL
       RETURNING id`,
      [meetingId, userId]
    );
    return rows.length > 0;
  }

  async getMeetingByPublicToken(token: string): Promise<Meeting | null> {
    const rows = await query<{ meeting_id: string }>(
      `SELECT meeting_id FROM meeting_public_shares WHERE token = $1 AND revoked_at IS NULL`,
      [token]
    );
    if (rows.length === 0) return null;
    const meetingId = rows[0].meeting_id;

    const meetingRows = await query<{
      id: string; user_id: string; title: string; meeting_date: string; duration_minutes: number; video_url: string | null;
    }>(
      `SELECT id, user_id, title, meeting_date, duration_minutes, video_url FROM meetings WHERE id = $1`,
      [meetingId]
    );
    if (meetingRows.length === 0) return null;
    const m = meetingRows[0];

    const participantRows = await query<{ name: string; email: string | null; role: string | null; avatar_color: string | null }>(
      `SELECT name, email, role, avatar_color FROM participants WHERE meeting_id = $1 ORDER BY id ASC`,
      [meetingId]
    );
    const utteranceRows = await query<{ id: string; speaker: string; speaker_role: string | null; timestamp: string; timestamp_seconds: number; text: string }>(
      `SELECT id, speaker, speaker_role, timestamp, timestamp_seconds, text FROM transcript_utterances WHERE meeting_id = $1 ORDER BY sequence_order ASC, timestamp_seconds ASC`,
      [meetingId]
    );
    const analysisRows = await query<{ executive_summary: string; key_takeaways: unknown; analyzed_at: Date | string }>(
      `SELECT executive_summary, key_takeaways, analyzed_at FROM analyses WHERE meeting_id = $1`,
      [meetingId]
    );

    let analysis = null;
    if (analysisRows.length > 0) {
      const a = analysisRows[0];
      const actionRows = await query<{ id: string; task: string; assignee: string | null; due_date: string | null; context: string | null; completed: boolean }>(
        `SELECT id, task, assignee, due_date, context, completed FROM action_items WHERE meeting_id = $1 ORDER BY created_at ASC`,
        [meetingId]
      );
      const decisionRows = await query<{ id: string; decision: string; rationale: string | null; made_by: string | null; timestamp: string | null; timestamp_seconds: number | null }>(
        `SELECT id, decision, rationale, made_by, timestamp, timestamp_seconds FROM decisions WHERE meeting_id = $1 ORDER BY created_at ASC`,
        [meetingId]
      );
      const highlightRows = await query<{ id: string; quote: string; speaker: string; timestamp: string; timestamp_seconds: number; significance: string | null; category: string | null; is_user_saved: boolean; created_at: Date | string }>(
        `SELECT id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved, created_at FROM highlights WHERE meeting_id = $1 ORDER BY timestamp_seconds ASC`,
        [meetingId]
      );
      let keyTakeaways: string[] = [];
      if (Array.isArray(a.key_takeaways)) keyTakeaways = a.key_takeaways as string[];
      else if (typeof a.key_takeaways === 'string') { try { keyTakeaways = JSON.parse(a.key_takeaways); } catch {} }
      analysis = {
        executiveSummary: a.executive_summary,
        keyTakeaways,
        analyzedAt: a.analyzed_at instanceof Date ? a.analyzed_at.toISOString() : String(a.analyzed_at),
        actionItems: actionRows.map((act) => ({ id: act.id, task: act.task, assignee: act.assignee || null, dueDate: act.due_date || null, context: act.context || undefined, completed: Boolean(act.completed) })),
        decisions: decisionRows.map((d) => ({ id: d.id, decision: d.decision, rationale: d.rationale || undefined, madeBy: d.made_by || undefined, timestamp: d.timestamp || undefined, timestampSeconds: d.timestamp_seconds ?? undefined })),
        highlights: highlightRows.map((h) => ({ id: h.id, quote: h.quote, speaker: h.speaker, timestamp: h.timestamp, significance: h.significance || '', category: h.category || 'key_moment', isUserSaved: Boolean(h.is_user_saved), createdAt: h.created_at instanceof Date ? h.created_at.toISOString() : String(h.created_at) })),
      };
    }

    return {
      id: m.id,
      title: m.title,
      date: m.meeting_date,
      durationMinutes: Number(m.duration_minutes),
      videoUrl: m.video_url || undefined,
      participants: participantRows.map((p) => ({ name: p.name, email: p.email || undefined, role: p.role || undefined, avatarColor: p.avatar_color || undefined })),
      transcript: utteranceRows.map((u) => ({ id: u.id, speaker: u.speaker, speakerRole: u.speaker_role || undefined, timestamp: u.timestamp, timestampSeconds: Number(u.timestamp_seconds), text: u.text })),
      analysis,
      isOwner: false,
      isShared: true,
    };
  }

  async listSharedUsers(meetingId: string): Promise<SharedUserRecord[]> {
    const rows = await query<{
      id: string; user_id: string; name: string; email: string; avatar_color: string | null; avatar_url: string | null; created_at: string;
    }>(
      `SELECT mus.id, u.id AS user_id, u.name, u.email, u.avatar_color, u.avatar_url, mus.created_at
       FROM meeting_user_shares mus
       JOIN users u ON u.id = mus.shared_with_user_id
       WHERE mus.meeting_id = $1
       ORDER BY mus.created_at ASC`,
      [meetingId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      avatarColor: r.avatar_color || undefined,
      avatarUrl: r.avatar_url || undefined,
      sharedAt: String(r.created_at),
    }));
  }

  async shareWithUser(sharedByUserId: string, meetingId: string, sharedWithUserId: string): Promise<void> {
    const id = `ushare-${crypto.randomUUID()}`;
    await query(
      `INSERT INTO meeting_user_shares (id, meeting_id, shared_with_user_id, shared_by_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (meeting_id, shared_with_user_id) DO NOTHING`,
      [id, meetingId, sharedWithUserId, sharedByUserId]
    );
  }

  async removeUserShare(sharedByUserId: string, meetingId: string, sharedWithUserId: string): Promise<boolean> {
    const rows = await query<{ id: string }>(
      `DELETE FROM meeting_user_shares
       WHERE meeting_id = $1 AND shared_with_user_id = $2 AND shared_by_user_id = $3
       RETURNING id`,
      [meetingId, sharedWithUserId, sharedByUserId]
    );
    return rows.length > 0;
  }
}

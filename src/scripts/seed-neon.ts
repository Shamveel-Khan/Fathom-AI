import fs from 'fs/promises';
import path from 'path';
import { runMigrations } from '../lib/db/migrate';
import { query } from '../lib/db/client';
import { timestampToSeconds } from '../lib/utils/time';
import { UserAccount } from '../lib/auth/types';
import { Meeting } from '../lib/schemas/meeting';

interface UserDataFile {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatarColor?: string;
  };
  meetings: Meeting[];
}

export async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  console.log('Starting Neon database seed...');
  await runMigrations();

  const dataDir = path.join(process.cwd(), 'data');
  const usersPath = path.join(dataDir, 'users.json');
  const rawUsers = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(rawUsers) as UserAccount[];

  for (const userAccount of users) {
    console.log(`Seeding user: ${userAccount.name} (${userAccount.email})`);

    // Insert user
    await query(
      `INSERT INTO users (id, name, email, password, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         avatar_color = EXCLUDED.avatar_color`,
      [
        userAccount.id,
        userAccount.name,
        userAccount.email,
        userAccount.password,
        userAccount.role || null,
        userAccount.avatarColor || null,
      ]
    );

    // Read user meetings
    const userFilePath = path.join(dataDir, userAccount.dataFile);
    try {
      const rawUserData = await fs.readFile(userFilePath, 'utf-8');
      const userData = JSON.parse(rawUserData) as UserDataFile;

      for (const meeting of userData.meetings) {
        console.log(`  Seeding meeting: ${meeting.title}`);

        // Insert meeting
        await query(
          `INSERT INTO meetings (id, user_id, title, meeting_date, duration_minutes)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             meeting_date = EXCLUDED.meeting_date,
             duration_minutes = EXCLUDED.duration_minutes`,
          [
            meeting.id,
            userAccount.id,
            meeting.title,
            meeting.date,
            meeting.durationMinutes || 30,
          ]
        );

        // Clear existing children for clean re-seed
        await query(`DELETE FROM participants WHERE meeting_id = $1`, [meeting.id]);
        await query(`DELETE FROM transcript_utterances WHERE meeting_id = $1`, [meeting.id]);
        await query(`DELETE FROM analyses WHERE meeting_id = $1`, [meeting.id]);
        await query(`DELETE FROM action_items WHERE meeting_id = $1`, [meeting.id]);
        await query(`DELETE FROM decisions WHERE meeting_id = $1`, [meeting.id]);
        await query(`DELETE FROM highlights WHERE meeting_id = $1`, [meeting.id]);

        // Insert participants
        for (let i = 0; i < meeting.participants.length; i++) {
          const p = meeting.participants[i];
          const participantId = `part-${meeting.id}-${i + 1}`;
          await query(
            `INSERT INTO participants (id, meeting_id, name, email, role, avatar_color)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              participantId,
              meeting.id,
              p.name,
              p.email || null,
              p.role || null,
              p.avatarColor || null,
            ]
          );
        }

        // Insert transcript utterances
        for (let i = 0; i < meeting.transcript.length; i++) {
          const u = meeting.transcript[i];
          const seconds = timestampToSeconds(u.timestamp);
          await query(
            `INSERT INTO transcript_utterances (id, meeting_id, speaker, speaker_role, timestamp, timestamp_seconds, text, sequence_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              u.id,
              meeting.id,
              u.speaker,
              u.speakerRole || null,
              u.timestamp,
              seconds,
              u.text,
              i,
            ]
          );
        }

        // Insert analysis if present
        if (meeting.analysis) {
          const analysisId = `ans-${meeting.id}`;
          await query(
            `INSERT INTO analyses (id, meeting_id, executive_summary, key_takeaways, analyzed_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              analysisId,
              meeting.id,
              meeting.analysis.executiveSummary,
              JSON.stringify(meeting.analysis.keyTakeaways || []),
              meeting.analysis.analyzedAt || new Date().toISOString(),
            ]
          );

          // Action items
          for (const a of meeting.analysis.actionItems || []) {
            await query(
              `INSERT INTO action_items (id, meeting_id, task, assignee, context, completed)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                a.id,
                meeting.id,
                a.task,
                a.assignee || null,
                a.context || null,
                Boolean(a.completed),
              ]
            );
          }

          // Decisions
          for (const d of meeting.analysis.decisions || []) {
            await query(
              `INSERT INTO decisions (id, meeting_id, decision, rationale, made_by)
               VALUES ($1, $2, $3, $4, $5)`,
              [d.id, meeting.id, d.decision, d.rationale || null, d.madeBy || null]
            );
          }

          // Highlights
          for (const h of meeting.analysis.highlights || []) {
            const hSecs = timestampToSeconds(h.timestamp);
            await query(
              `INSERT INTO highlights (id, meeting_id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                h.id,
                meeting.id,
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
        }
      }
    } catch (err) {
      console.warn(`Could not read meeting file for user ${userAccount.id}:`, err);
    }
  }

  console.log('Neon database seed completed successfully!');
}

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.includes('seed-neon')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

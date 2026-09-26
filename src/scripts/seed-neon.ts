import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { runMigrations } from '../lib/db/migrate';
import { withTransaction, queryClient } from '../lib/db/client';
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
    console.error('FATAL: DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  console.log('--- Initializing Neon PostgreSQL Seeding ---');
  await runMigrations();

  const dataDir = path.join(process.cwd(), 'data');
  const usersPath = path.join(dataDir, 'users.json');

  let rawUsers: string;
  try {
    rawUsers = await fs.readFile(usersPath, 'utf-8');
  } catch (err) {
    console.error(`FATAL: Failed to read users registry at ${usersPath}:`, err);
    process.exit(1);
  }

  const users = JSON.parse(rawUsers) as UserAccount[];
  if (!Array.isArray(users) || users.length === 0) {
    console.error('FATAL: No users found in users.json seed fixture.');
    process.exit(1);
  }

  // Pre-load and validate all user meeting files before database writes
  const userFiles: { account: UserAccount; data: UserDataFile }[] = [];
  for (const userAccount of users) {
    if (!userAccount.id || !userAccount.email || !userAccount.dataFile) {
      throw new Error(`Invalid user record in users.json: ${JSON.stringify(userAccount)}`);
    }

    const userFilePath = path.join(dataDir, userAccount.dataFile);
    const rawUserData = await fs.readFile(userFilePath, 'utf-8');
    const userData = JSON.parse(rawUserData) as UserDataFile;

    if (!userData.user || !Array.isArray(userData.meetings)) {
      throw new Error(`Invalid data structure in ${userAccount.dataFile}`);
    }

    userFiles.push({ account: userAccount, data: userData });
  }

  console.log(`Verified ${users.length} user files. Writing to Neon PostgreSQL inside atomic transaction...`);

  // Execute all operations inside an atomic transaction
  await withTransaction(async (client) => {
    for (const { account: userAccount, data: userData } of userFiles) {
      console.log(`Seeding user: ${userAccount.name} (${userAccount.email})`);

      // 1. Upsert User
      await queryClient(
        client,
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

      // 2. Process Meetings
      for (const meeting of userData.meetings) {
        console.log(`  Seeding meeting [${meeting.id}]: "${meeting.title}"`);

        // Upsert Meeting
        await queryClient(
          client,
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

        // Clean existing children for this specific meeting to prevent duplicates
        await queryClient(client, `DELETE FROM participants WHERE meeting_id = $1`, [meeting.id]);
        await queryClient(client, `DELETE FROM transcript_utterances WHERE meeting_id = $1`, [meeting.id]);
        await queryClient(client, `DELETE FROM analyses WHERE meeting_id = $1`, [meeting.id]);
        await queryClient(client, `DELETE FROM action_items WHERE meeting_id = $1`, [meeting.id]);
        await queryClient(client, `DELETE FROM decisions WHERE meeting_id = $1`, [meeting.id]);
        await queryClient(client, `DELETE FROM highlights WHERE meeting_id = $1`, [meeting.id]);

        // Insert Participants with meeting-scoped IDs
        for (let i = 0; i < (meeting.participants || []).length; i++) {
          const p = meeting.participants[i];
          const participantId = `${meeting.id}-part-${i + 1}`;
          await queryClient(
            client,
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

        // Insert Transcript Utterances with meeting-scoped IDs
        for (let i = 0; i < (meeting.transcript || []).length; i++) {
          const u = meeting.transcript[i];
          const seconds = timestampToSeconds(u.timestamp);
          const utteranceId = `${meeting.id}-utt-${u.id || i + 1}`;
          await queryClient(
            client,
            `INSERT INTO transcript_utterances (id, meeting_id, speaker, speaker_role, timestamp, timestamp_seconds, text, sequence_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              utteranceId,
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

        // Insert Analysis, Action Items, Decisions, Highlights if present
        if (meeting.analysis) {
          const analysisId = `ans-${meeting.id}`;
          await queryClient(
            client,
            `INSERT INTO analyses (id, meeting_id, executive_summary, key_takeaways, analyzed_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              analysisId,
              meeting.id,
              meeting.analysis.executiveSummary || '',
              JSON.stringify(meeting.analysis.keyTakeaways || []),
              meeting.analysis.analyzedAt || new Date().toISOString(),
            ]
          );

          // Action items with meeting-scoped IDs
          for (let i = 0; i < (meeting.analysis.actionItems || []).length; i++) {
            const a = meeting.analysis.actionItems[i];
            const actionId = `${meeting.id}-act-${a.id || i + 1}`;
            await queryClient(
              client,
              `INSERT INTO action_items (id, meeting_id, task, assignee, context, completed)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                actionId,
                meeting.id,
                a.task,
                a.assignee || null,
                a.context || null,
                Boolean(a.completed),
              ]
            );
          }

          // Decisions with meeting-scoped IDs
          for (let i = 0; i < (meeting.analysis.decisions || []).length; i++) {
            const d = meeting.analysis.decisions[i];
            const decisionId = `${meeting.id}-dec-${d.id || i + 1}`;
            await queryClient(
              client,
              `INSERT INTO decisions (id, meeting_id, decision, rationale, made_by)
               VALUES ($1, $2, $3, $4, $5)`,
              [decisionId, meeting.id, d.decision, d.rationale || null, d.madeBy || null]
            );
          }

          // Highlights with meeting-scoped IDs
          for (let i = 0; i < (meeting.analysis.highlights || []).length; i++) {
            const h = meeting.analysis.highlights[i];
            const hSecs = timestampToSeconds(h.timestamp);
            const highlightId = `${meeting.id}-hl-${h.id || i + 1}`;
            await queryClient(
              client,
              `INSERT INTO highlights (id, meeting_id, quote, speaker, timestamp, timestamp_seconds, significance, category, is_user_saved)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                highlightId,
                meeting.id,
                h.quote,
                h.speaker,
                h.timestamp,
                hSecs,
                h.significance || null,
                h.category || 'key_moment',
                Boolean(h.isUserSaved),
              ]
            );
          }
        }
      }
    }
  });

  console.log('✅ Neon PostgreSQL seed transaction committed successfully with zero errors.');
}

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.includes('seed-neon')) {
  seedDatabase()
    .then(() => {
      console.log('Database seed finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('FATAL Database seed error:', err);
      process.exit(1);
    });
}

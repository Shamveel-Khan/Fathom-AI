import { query } from './client';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(500),
    role VARCHAR(255),
    avatar_color VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    meeting_date VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    video_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(255),
    avatar_color VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS transcript_utterances (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    speaker VARCHAR(255) NOT NULL,
    speaker_role VARCHAR(255),
    timestamp VARCHAR(32) NOT NULL,
    timestamp_seconds INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    sequence_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_items (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    assignee VARCHAR(255),
    context TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    rationale TEXT,
    made_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS highlights (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    speaker VARCHAR(255) NOT NULL,
    timestamp VARCHAR(32) NOT NULL,
    timestamp_seconds INTEGER NOT NULL DEFAULT 0,
    significance TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'key_moment',
    is_user_saved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter existing columns if table was created with smaller size
ALTER TABLE transcript_utterances ALTER COLUMN id TYPE VARCHAR(128);
ALTER TABLE action_items ALTER COLUMN id TYPE VARCHAR(128);
ALTER TABLE decisions ALTER COLUMN id TYPE VARCHAR(128);
ALTER TABLE highlights ALTER COLUMN id TYPE VARCHAR(128);
ALTER TABLE analyses ALTER COLUMN id TYPE VARCHAR(128);
ALTER TABLE participants ALTER COLUMN id TYPE VARCHAR(128);

-- Add new auth columns to existing users table (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add new Commit 5 columns (idempotent)
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS due_date VARCHAR(64);
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS timestamp VARCHAR(32);
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS timestamp_seconds INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_utterances_meeting_id ON transcript_utterances(meeting_id);
CREATE INDEX IF NOT EXISTS idx_utterances_meeting_seq ON transcript_utterances(meeting_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_highlights_meeting_id ON highlights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_highlights_meeting_time ON highlights(meeting_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_utterances_text_search ON transcript_utterances USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_meetings_title_search ON meetings USING gin(to_tsvector('english', title));
`;

export async function runMigrations(): Promise<void> {
  console.log('Running Neon PostgreSQL schema migrations...');
  await query(SCHEMA_SQL);
  console.log('PostgreSQL schema migrations verified successfully.');
}

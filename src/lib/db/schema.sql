-- ============================================================
-- FATHOM AI CLONE — PostgreSQL Database Schema
-- Single Source of Truth for Application State
-- ============================================================

-- Users table
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

-- OAuth accounts (links OAuth providers to local users)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_account_id)
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    meeting_date VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    video_url VARCHAR(500),
    template VARCHAR(64) NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meeting participants table
CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(255),
    avatar_color VARCHAR(64)
);

-- Transcript utterances table (Globally unique scoped IDs)
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

-- Meeting AI Analyses table (1:1 with meetings)
CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Action items table (Globally unique scoped IDs)
CREATE TABLE IF NOT EXISTS action_items (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    assignee VARCHAR(255),
    due_date VARCHAR(64),
    context TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decisions table (Globally unique scoped IDs)
CREATE TABLE IF NOT EXISTS decisions (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    rationale TEXT,
    made_by VARCHAR(255),
    timestamp VARCHAR(32),
    timestamp_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Highlights table (Globally unique scoped IDs for both AI & User highlights)
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

-- AI Reviews table (Deep gap analysis & risk assessment, 1:1 with meetings)
CREATE TABLE IF NOT EXISTS ai_reviews (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL DEFAULT 85,
    summary TEXT NOT NULL,
    unresolved_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    unassigned_responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_deadlines JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    contradictions JSONB NOT NULL DEFAULT '[]'::jsonb,
    potential_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public Shares table (Maps unpredictable public tokens to real meetings)
CREATE TABLE IF NOT EXISTS meeting_public_shares (
    id VARCHAR(128) PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- User-to-User Shares table (Person-to-person meeting sharing)
CREATE TABLE IF NOT EXISTS meeting_user_shares (
    id VARCHAR(128) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    shared_with_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (meeting_id, shared_with_user_id)
);

-- Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_utterances_meeting_id ON transcript_utterances(meeting_id);
CREATE INDEX IF NOT EXISTS idx_utterances_meeting_seq ON transcript_utterances(meeting_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_highlights_meeting_id ON highlights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_highlights_meeting_time ON highlights(meeting_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_meeting_id ON ai_reviews(meeting_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_utterances_text_search ON transcript_utterances USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_meetings_title_search ON meetings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_meeting_public_shares_token ON meeting_public_shares(token);
CREATE INDEX IF NOT EXISTS idx_meeting_public_shares_meeting ON meeting_public_shares(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_user_shares_shared_with ON meeting_user_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_user_shares_meeting ON meeting_user_shares(meeting_id);



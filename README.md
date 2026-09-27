
# Fathom AI Clone

Fathom AI Clone is a meeting intelligence workspace built with Next.js, React, TypeScript, and PostgreSQL. It turns meeting imports into summaries, decisions, action items, reviews, and shareable read-only meeting views.

## Functional Overview

### Landing Page

The landing page introduces the product, explains the core value proposition, and drives users toward sign up. It is designed to show the product preview immediately so the app feels like a real workspace rather than a static marketing page.

### Authentication

The app supports sign in and sign up flows backed by local credentials and OAuth account linking. Authentication gates the workspace routes so personal meetings, reviews, and share links are scoped to the current user.

### Dashboard

The dashboard is the main workspace entry point. It summarizes meeting volume, analyzed meetings, reviewed meetings, and open action items, then exposes import actions and a searchable meeting overview so users can quickly jump back into active work.

### Meetings Library

The meetings page is the primary catalog of imported meetings. It supports search, template filtering, and alternate layouts so users can browse meetings by topic or scan them quickly in a denser list.

### Meeting Workspace

Each meeting detail page combines the transcript, timeline, AI analysis, highlights, and export controls in one place. This is where the application turns raw meeting content into structured intelligence that can be reviewed, shared, and acted on.

### Action Items

Action items capture concrete follow-up tasks extracted from a meeting or added during review. They store assignee, due date, context, and completion state so the app can show what still needs attention.

### Decisions

The decisions view is a record of the important choices made in meetings. It stores the decision text, rationale, author, and timestamp information, then makes those decisions searchable across the workspace.

### AI Review

The AI review layer is a quality-control pass on the meeting. It identifies unresolved questions, missing deadlines, missing dependencies, contradictions, and risk signals so users can see where a meeting was ambiguous or incomplete.

### Settings

The settings page lets users manage their profile, choose an avatar color, and configure AI behavior. It also stores the selected model, base URL, and default meeting template in local storage so the experience stays personalized between sessions.

### Sharing

The app supports both private user-to-user sharing and public share links. Public shares provide a read-only meeting view through a tokenized URL, while user shares grant another logged-in user access to a meeting inside the app.

## Screenshots

The screenshots below come from the captured assets in `pics/`.

| Landing Page | Dashboard |
| --- | --- |
| ![Landing page](pics/landingPage.png) | ![Dashboard](pics/dashboard.png) |

| Login | Meeting Workspace |
| --- | --- |
| ![Login](pics/login.png) | ![Meeting workspace](pics/meeting.png) |

| Settings | Share View 1 |
| --- | --- |
| ![Settings](pics/settings.png) | ![Share view 1](pics/share1.png) |

| Share View 2 |
| --- |
| ![Share view 2](pics/share2.png) |

The `/pics` folder currently contains all available screenshots for the landing page, login, dashboard, meeting workspace, settings, and two share views.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL via Neon
- OpenAI-compatible AI providers
- Zod schema validation

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database
- Optional: OpenAI API key or another OpenAI-compatible endpoint

### Environment Variables

Create a `.env.local` file from `.env.example` and fill in the values below:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Database

Run migrations and optional seed data with:

```bash
npm run db:migrate
npm run db:seed
```

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - build the production app
- `npm run start` - run the production build
- `npm run lint` - run ESLint
- `npm run db:migrate` - run database migrations
- `npm run db:seed` - seed sample data

## Main Routes

- `/` - landing page
- `/login` and `/signup` - authentication pages
- `/dashboard` - workspace overview
- `/meetings` - meetings library
- `/meetings/[id]` - meeting workspace
- `/action-items` - action items view
- `/decisions` - decision log
- `/settings` - profile and AI settings
- `/share/[token]` - public shared meeting view

## Database Schema

The database is organized around a meeting-centric model. `src/lib/db/schema.sql` defines the canonical structure, and `src/lib/db/migrate.ts` applies the same tables plus compatibility updates for older databases.

| Table | Purpose | Key fields and relationships |
| --- | --- | --- |
| `users` | Stores app accounts and profile data. | `id`, `name`, `email`, `password`, optional `password_hash`, `avatar_url`, `role`, `avatar_color`, timestamps. |
| `oauth_accounts` | Links OAuth identities to a user. | References `users(id)` through `user_id`; unique by provider and provider account id. |
| `meetings` | Parent record for every imported or analyzed meeting. | References `users(id)` through `user_id`; stores `title`, `meeting_date`, `duration_minutes`, `video_url`, `template`. |
| `participants` | Meeting attendee list. | References `meetings(id)` through `meeting_id`; stores `name`, optional `email`, `role`, and avatar color. |
| `transcript_utterances` | Transcript lines for playback and analysis. | References `meetings(id)`; stores `speaker`, `speaker_role`, `timestamp`, `timestamp_seconds`, `text`, and `sequence_order`. |
| `analyses` | The main AI-generated meeting summary. | One row per meeting via unique `meeting_id`; stores `executive_summary`, `key_takeaways`, and `analyzed_at`. |
| `action_items` | Follow-up tasks extracted from a meeting. | References `meetings(id)`; stores `task`, `assignee`, `due_date`, `context`, `completed`. |
| `decisions` | Important decisions made during a meeting. | References `meetings(id)`; stores `decision`, `rationale`, `made_by`, and timestamp data. |
| `highlights` | Key excerpts or user-saved moments. | References `meetings(id)`; stores the quote, speaker, timestamps, category, and whether the highlight was user-saved. |
| `ai_reviews` | Gap analysis and risk assessment for a meeting. | One row per meeting via unique `meeting_id`; stores `overall_score`, `summary`, and JSON arrays for unresolved questions, unassigned responsibilities, missing deadlines, missing dependencies, contradictions, and risks. |
| `meeting_public_shares` | Token-based public sharing. | Stores a unique `token`, references the source meeting and creator, and supports revocation via `revoked_at`. |
| `meeting_user_shares` | Internal sharing between users. | References the meeting, the recipient user, and the sharing user; unique per meeting and recipient pair. |

### Schema Notes

- `meetings` is the parent record for almost every other table in the product.
- `analyses` and `ai_reviews` are both one-to-one with `meetings`.
- `participants`, `transcript_utterances`, `action_items`, `decisions`, and `highlights` are all one-to-many children of `meetings`.
- The migration script adds compatibility columns such as `password_hash`, `avatar_url`, `updated_at`, `template`, `due_date`, and decision timestamps for older databases.
- Indexes are added for the common workspace queries, including meeting lookup, participant lookup, transcript search, highlight lookup, share-token lookup, and OAuth account lookup.

## Notes

- The product supports both imported meetings and shared meetings.
- AI settings can be configured per user in the app UI.
- The public share view is read-only and does not require authentication.


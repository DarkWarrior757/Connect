/*
# Connect — Video Conferencing App Schema

## Overview
Creates the full database schema for "Connect", a video-conferencing application.
Supports user profiles, meetings, meeting participants, meeting history, and in-meeting chat messages.

## 1. New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per authenticated user
- `display_name` (text, not null) — name shown in meetings and UI
- `avatar_url` (text, nullable) — optional avatar image URL
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### meetings
- `id` (uuid, PK) — meeting row ID
- `meeting_code` (text, unique, not null) — short shareable code (e.g. "abc-1234")
- `name` (text, nullable) — optional meeting name
- `host_id` (uuid, not null, references profiles) — meeting host
- `password` (text, nullable) — optional meeting password (hashed by app)
- `status` (text, default 'scheduled') — 'scheduled' | 'active' | 'ended'
- `started_at` (timestamptz, nullable) — when meeting went active
- `ended_at` (timestamptz, nullable) — when meeting ended
- `created_at` (timestamptz, default now)

### meeting_participants
- `id` (uuid, PK)
- `meeting_id` (uuid, not null, references meetings, cascade delete)
- `user_id` (uuid, not null, references profiles)
- `display_name` (text, not null) — name at time of join
- `is_host` (boolean, default false)
- `joined_at` (timestamptz, default now)
- `left_at` (timestamptz, nullable)
- `audio_enabled` (boolean, default true)
- `video_enabled` (boolean, default true)

### meeting_history
- `id` (uuid, PK)
- `meeting_id` (uuid, not null, references meetings)
- `user_id` (uuid, not null, references profiles) — user who has this history entry
- `meeting_name` (text, nullable)
- `meeting_code` (text, not null)
- `host_name` (text, nullable) — denormalized host display name
- `joined_at` (timestamptz, not null)
- `left_at` (timestamptz, nullable)
- `duration_seconds` (integer, nullable) — computed when meeting ends
- `created_at` (timestamptz, default now)

### chat_messages
- `id` (uuid, PK)
- `meeting_id` (uuid, not null, references meetings, cascade delete)
- `user_id` (uuid, nullable, references profiles) — nullable for guest messages
- `sender_name` (text, not null) — denormalized for display
- `message` (text, not null)
- `created_at` (timestamptz, default now)

## 2. Security — Row Level Security

All tables have RLS enabled. Policies:

### profiles
- Users can read and update their own profile only.

### meetings
- Hosts can do full CRUD on their own meetings.
- Any authenticated user can SELECT meetings (to join by code), but only the host can modify/delete.
- This allows users to look up a meeting by code to join it.

### meeting_participants
- Participants can read participants of meetings they've joined.
- Participants can insert their own participation row.
- Participants can update their own row (audio/video toggles, left_at).
- Hosts can update/delete any participant in their meeting.

### meeting_history
- Users can read, insert, and update only their own history entries.

### chat_messages
- Any authenticated user who is a meeting participant can read messages for that meeting.
- Any authenticated user who is a meeting participant can send messages to that meeting.

## 3. Indexes
- meetings.meeting_code (unique)
- meeting_participants.meeting_id
- meeting_history.user_id, meeting_history.meeting_id
- chat_messages.meeting_id, chat_messages.created_at

## 4. Important Notes
1. The `profiles` table is created with a trigger to auto-insert a row when a new auth.users row is created.
2. `meeting_participants` uses a composite policy that checks meeting membership.
3. Chat messages check that the sender is a participant of the meeting.
4. All owner columns default to auth.uid() where applicable.
*/

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create a profile row when a new auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MEETINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_code text UNIQUE NOT NULL,
  name text,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_meeting_code ON meetings(meeting_code);
CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Hosts can read their own meetings; any authenticated user can read (to join by code)
DROP POLICY IF EXISTS "select_meetings" ON meetings;
CREATE POLICY "select_meetings" ON meetings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_meetings" ON meetings;
CREATE POLICY "insert_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "update_meetings" ON meetings;
CREATE POLICY "update_meetings" ON meetings FOR UPDATE
  TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "delete_meetings" ON meetings;
CREATE POLICY "delete_meetings" ON meetings FOR DELETE
  TO authenticated USING (auth.uid() = host_id);

-- ============================================================================
-- MEETING_PARTICIPANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  audio_enabled boolean NOT NULL DEFAULT true,
  video_enabled boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON meeting_participants(user_id);

ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- A user can read participants of meetings they have joined (or host)
DROP POLICY IF EXISTS "select_participants" ON meeting_participants;
CREATE POLICY "select_participants" ON meeting_participants FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM meeting_participants mp2
      WHERE mp2.meeting_id = meeting_participants.meeting_id AND mp2.user_id = auth.uid()
    )
  );

-- A user can insert their own participation row
DROP POLICY IF EXISTS "insert_participants" ON meeting_participants;
CREATE POLICY "insert_participants" ON meeting_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- A user can update their own row; host can update any in their meeting
DROP POLICY IF EXISTS "update_participants" ON meeting_participants;
CREATE POLICY "update_participants" ON meeting_participants FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()
    )
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()
    )
  );

-- A user can delete their own row; host can delete any in their meeting
DROP POLICY IF EXISTS "delete_participants" ON meeting_participants;
CREATE POLICY "delete_participants" ON meeting_participants FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.host_id = auth.uid()
    )
  );

-- ============================================================================
-- MEETING_HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_name text,
  meeting_code text NOT NULL,
  host_name text,
  joined_at timestamptz NOT NULL,
  left_at timestamptz,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_history_user_id ON meeting_history(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_history_meeting_id ON meeting_history(meeting_id);

ALTER TABLE meeting_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_history" ON meeting_history;
CREATE POLICY "select_own_history" ON meeting_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_history" ON meeting_history;
CREATE POLICY "insert_own_history" ON meeting_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_history" ON meeting_history;
CREATE POLICY "update_own_history" ON meeting_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_history" ON meeting_history;
CREATE POLICY "delete_own_history" ON meeting_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- CHAT_MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting_id ON chat_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- A user can read chat messages for meetings they are a participant of
DROP POLICY IF EXISTS "select_chat_messages" ON chat_messages;
CREATE POLICY "select_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM meeting_participants mp
      WHERE mp.meeting_id = chat_messages.meeting_id
        AND mp.user_id = auth.uid()
        AND mp.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = chat_messages.meeting_id AND m.host_id = auth.uid()
    )
  );

-- A user can send chat messages to meetings they are a participant of
DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM meeting_participants mp
      WHERE mp.meeting_id = chat_messages.meeting_id
        AND mp.user_id = auth.uid()
        AND mp.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = chat_messages.meeting_id AND m.host_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER FOR PROFILES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
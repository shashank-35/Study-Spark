-- ══════════════════════════════════════════════════════════════════════════
-- StudySpark: notifications table — v2
-- Run this in the Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,                              -- NULL = broadcast to all users
  title       TEXT NOT NULL,
  message     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'system'
              CHECK (type IN ('material','quiz','announcement','achievement','system','coding')),
  link        TEXT,                              -- optional route, e.g. /subjects/1
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  role_target TEXT NOT NULL DEFAULT 'all'
              CHECK (role_target IN ('student','admin','all')),
  metadata    JSONB DEFAULT '{}'::jsonb,         -- extensible payload (achievement data, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created     ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_role_target ON notifications (role_target);

-- ── Enable Realtime (full replica so UPDATE/DELETE payloads include old row) ──
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── RLS Policies ──────────────────────────────────────────────────────────
-- NOTE: Auth is handled by Clerk (not Supabase Auth), so JWT claims are not
-- available. We use permissive policies and rely on client-side filtering.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON notifications FOR DELETE USING (true);

-- ══════════════════════════════════════════════════════════════════════════
-- Migration helper — run this on an existing table to add the new columns
-- (safe to run multiple times)
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='role_target') THEN
    ALTER TABLE notifications ADD COLUMN role_target TEXT NOT NULL DEFAULT 'all' CHECK (role_target IN ('student','admin','all'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='metadata') THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ensure REPLICA IDENTITY FULL for realtime UPDATE/DELETE support
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ══════════════════════════════════════════════════════════════════════════
-- Sample seed data (optional — remove in production)
-- ══════════════════════════════════════════════════════════════════════════

-- Broadcast announcement
INSERT INTO notifications (user_id, title, message, type, link, role_target) VALUES
  (NULL, 'Welcome to StudySpark!', 'Your one-stop platform for BCA studies. Explore subjects, quizzes, and coding labs.', 'announcement', NULL, 'all'),
  (NULL, 'New: Coding Lab Available', 'Practice coding problems in C, Java, Python and more.', 'coding', '/coding', 'all'),
  (NULL, 'Semester 5 Materials Updated', 'New notes and PDFs have been uploaded for Semester 5 subjects.', 'material', '/subjects', 'all');

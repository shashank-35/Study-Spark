-- ============================================================
-- Study Spark - Study Planner Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,                    -- Clerk user_id
  subject     text NOT NULL,
  duration    integer NOT NULL DEFAULT 30,      -- planned minutes
  actual_duration integer,                      -- actual minutes spent (null if not yet completed)
  date        date NOT NULL DEFAULT CURRENT_DATE,
  start_time  time,
  notes       text,
  completed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ss_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS ss_user_date ON study_sessions(user_id, date DESC);

-- 2. Study Goals
CREATE TABLE IF NOT EXISTS study_goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  title       text NOT NULL,
  description text,
  due_date    date NOT NULL,
  progress    smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed   boolean NOT NULL DEFAULT false,
  category    text,                              -- e.g. 'exam', 'project', 'revision', etc.
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sg_user_id ON study_goals(user_id);
CREATE INDEX IF NOT EXISTS sg_user_due ON study_goals(user_id, due_date);

-- 3. Study Todos
CREATE TABLE IF NOT EXISTS study_todos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  task        text NOT NULL,
  due_date    date NOT NULL DEFAULT CURRENT_DATE,
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed   boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order  integer NOT NULL DEFAULT 0,        -- for drag-and-drop reordering
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS st_user_id ON study_todos(user_id);
CREATE INDEX IF NOT EXISTS st_user_date ON study_todos(user_id, due_date);

-- ── Row Level Security ──────────────────────────────────────────────────────

-- study_sessions: users own their own rows
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ss_select" ON study_sessions;
DROP POLICY IF EXISTS "ss_insert" ON study_sessions;
DROP POLICY IF EXISTS "ss_update" ON study_sessions;
DROP POLICY IF EXISTS "ss_delete" ON study_sessions;
CREATE POLICY "ss_select" ON study_sessions FOR SELECT USING (true);
CREATE POLICY "ss_insert" ON study_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "ss_update" ON study_sessions FOR UPDATE USING (true);
CREATE POLICY "ss_delete" ON study_sessions FOR DELETE USING (true);

-- study_goals: users own their own rows
ALTER TABLE study_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sg_select" ON study_goals;
DROP POLICY IF EXISTS "sg_insert" ON study_goals;
DROP POLICY IF EXISTS "sg_update" ON study_goals;
DROP POLICY IF EXISTS "sg_delete" ON study_goals;
CREATE POLICY "sg_select" ON study_goals FOR SELECT USING (true);
CREATE POLICY "sg_insert" ON study_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "sg_update" ON study_goals FOR UPDATE USING (true);
CREATE POLICY "sg_delete" ON study_goals FOR DELETE USING (true);

-- study_todos: users own their own rows
ALTER TABLE study_todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "st_select" ON study_todos;
DROP POLICY IF EXISTS "st_insert" ON study_todos;
DROP POLICY IF EXISTS "st_update" ON study_todos;
DROP POLICY IF EXISTS "st_delete" ON study_todos;
CREATE POLICY "st_select" ON study_todos FOR SELECT USING (true);
CREATE POLICY "st_insert" ON study_todos FOR INSERT WITH CHECK (true);
CREATE POLICY "st_update" ON study_todos FOR UPDATE USING (true);
CREATE POLICY "st_delete" ON study_todos FOR DELETE USING (true);

-- ── Enable Realtime ────────────────────────────────────────────────────────
-- Run in Supabase Dashboard > Database > Replication or:
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_goals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_todos;

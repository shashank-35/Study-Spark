-- ============================================================
-- Study Spark — BCA Subject Section Schema Upgrade
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. subjects (upgraded) ────────────────────────────────────────────────────
-- If subjects table already exists from legacy schema, run the ALTER statements
-- at the bottom instead of CREATE.

CREATE TABLE IF NOT EXISTS subjects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  semester    smallint NOT NULL CHECK (semester BETWEEN 1 AND 6),
  difficulty  text NOT NULL DEFAULT 'Beginner'
                CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  credits     smallint NOT NULL DEFAULT 4,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- If you have an existing subjects table with legacy columns, add the new ones:
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS name        text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester    smallint DEFAULT 1;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS difficulty  text DEFAULT 'Beginner';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS credits     smallint DEFAULT 4;

-- Migrate legacy subject_name → name only if that column actually exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'subject_name'
  ) THEN
    UPDATE subjects SET name = subject_name WHERE name IS NULL AND subject_name IS NOT NULL;
  END IF;
END $$;

-- ── 2. units ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  order_no    smallint NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS units_subject_order ON units(subject_id, order_no);
CREATE INDEX IF NOT EXISTS units_subject_id ON units(subject_id);

-- ── 3. study_materials (add unit_id + subject_id if not present) ──────────────
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS unit_id    uuid REFERENCES units(id)    ON DELETE SET NULL;

-- ── 4. student_progress ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL,            -- Clerk user_id (text, not uuid)
  subject_id        uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  progress_percent  smallint NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  last_resource_id  uuid REFERENCES study_materials(id) ON DELETE SET NULL,
  last_accessed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id)       -- upsert target
);

CREATE INDEX IF NOT EXISTS sp_user_id   ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS sp_subject   ON student_progress(user_id, subject_id);

-- ── 5. bookmarks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  subject_id  uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id)
);

CREATE INDEX IF NOT EXISTS bk_user_id ON bookmarks(user_id);

-- ── 6. Row Level Security (RLS) ───────────────────────────────────────────────
-- subjects: anyone can read, only service_role can write
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (true);

-- units: same
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "units_select" ON units;
CREATE POLICY "units_select" ON units FOR SELECT USING (true);

-- study_materials: anyone can read
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sm_select" ON study_materials;
CREATE POLICY "sm_select" ON study_materials FOR SELECT USING (true);

-- student_progress: each user owns their own rows
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sp_select" ON student_progress;
DROP POLICY IF EXISTS "sp_insert" ON student_progress;
DROP POLICY IF EXISTS "sp_update" ON student_progress;
CREATE POLICY "sp_select" ON student_progress FOR SELECT USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
CREATE POLICY "sp_insert" ON student_progress FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.role() = 'service_role');
CREATE POLICY "sp_update" ON student_progress FOR UPDATE USING  (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- bookmarks: each user owns their own rows
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bk_select" ON bookmarks;
DROP POLICY IF EXISTS "bk_insert" ON bookmarks;
DROP POLICY IF EXISTS "bk_delete" ON bookmarks;
CREATE POLICY "bk_select" ON bookmarks FOR SELECT USING (user_id = auth.uid()::text OR auth.role() = 'service_role');
CREATE POLICY "bk_insert" ON bookmarks FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.role() = 'service_role');
CREATE POLICY "bk_delete" ON bookmarks FOR DELETE USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- ── 7. Enable Realtime ────────────────────────────────────────────────────────
-- Run these in Supabase Dashboard → Database → Replication → Tables
-- (or via SQL with the extension if available):
-- ALTER PUBLICATION supabase_realtime ADD TABLE student_progress;
-- ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

-- ── 8. Sample seed data ───────────────────────────────────────────────────────
INSERT INTO subjects (name, semester, difficulty, credits) VALUES
  ('Programming in C',        1, 'Beginner',     4),
  ('Mathematics I',           1, 'Intermediate', 4),
  ('Computer Fundamentals',   1, 'Beginner',     3),
  ('Data Structures',         2, 'Intermediate', 4),
  ('OOP with Java',           2, 'Intermediate', 4),
  ('Mathematics II',          2, 'Intermediate', 4),
  ('DBMS',                    3, 'Intermediate', 4),
  ('Computer Networks',       3, 'Intermediate', 4),
  ('Operating Systems',       4, 'Advanced',     4),
  ('Software Engineering',    4, 'Intermediate', 4),
  ('Web Development',         4, 'Beginner',     3),
  ('Compiler Design',         5, 'Advanced',     4),
  ('Mobile App Development',  5, 'Intermediate', 4),
  ('Cloud Computing',         6, 'Intermediate', 4),
  ('Machine Learning Basics', 6, 'Advanced',     4)
ON CONFLICT DO NOTHING;

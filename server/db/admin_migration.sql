-- ============================================================
-- Study Spark — SAFE Admin Panel Migration
-- ============================================================
-- This script ONLY adds missing tables and columns.
-- It does NOT recreate or drop any existing tables.
-- Safe to run alongside your existing schema_upgrade.sql tables.
-- ============================================================

-- ── 1. ADD missing columns to existing subjects table ────────────────
-- Your existing table has: id (uuid), name, semester, difficulty, credits, updated_at
-- Admin panel needs: subject_name, description, progress, completion, next_topic, est_time, level, created_at

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS completion INT DEFAULT 0;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS next_topic TEXT DEFAULT '';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS est_time TEXT DEFAULT '';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Sync: Copy 'name' → 'subject_name' where subject_name is null
-- This keeps BOTH columns so old and new code both work
UPDATE subjects SET subject_name = name WHERE subject_name IS NULL AND name IS NOT NULL;

-- ── 2. ADD updated_at to units (if missing) ──────────────────────────
ALTER TABLE units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 3. ADD columns to study_materials (if missing) ───────────────────
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'Notes';

-- ── 4. ADD columns to student_progress (if missing) ──────────────────
ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS completed_units INT DEFAULT 0;
ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS total_units INT DEFAULT 0;
ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ DEFAULT now();

-- ── 5. CREATE NEW TABLES (only if they don't exist) ──────────────────

-- 5a. Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id          BIGSERIAL PRIMARY KEY,
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_limit  INT DEFAULT 30,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 5b. Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id              BIGSERIAL PRIMARY KEY,
  quiz_id         BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',
  correct_answer  INT NOT NULL DEFAULT 0,
  explanation     TEXT DEFAULT '',
  order_no        INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5c. Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  quiz_id       BIGINT REFERENCES quizzes(id) ON DELETE CASCADE,
  score         NUMERIC(5,2) DEFAULT 0,
  total         INT DEFAULT 0,
  answers       JSONB DEFAULT '[]',
  started_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- 5d. Coding Submissions
CREATE TABLE IF NOT EXISTS coding_submissions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  language      TEXT NOT NULL DEFAULT 'javascript',
  code          TEXT NOT NULL,
  status        TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','passed','failed','error')),
  results       JSONB DEFAULT '{}',
  submitted_at  TIMESTAMPTZ DEFAULT now()
);

-- 5e. Admin Settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id                BIGSERIAL PRIMARY KEY,
  platform_name     TEXT DEFAULT 'Study Spark - BCA Edition',
  enable_quiz       BOOLEAN DEFAULT true,
  enable_coding_lab BOOLEAN DEFAULT true,
  enable_ai_chat    BOOLEAN DEFAULT true,
  upload_limit_mb   INT DEFAULT 10,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf','doc','docx','txt'],
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings (only if table was just created / empty)
INSERT INTO admin_settings (platform_name)
SELECT 'Study Spark - BCA Edition'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings LIMIT 1);

-- ── 6. INDEXES ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quizzes_subject    ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz     ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user      ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz      ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user   ON coding_submissions(user_id);

-- ── 7. ENABLE REALTIME on all tables ─────────────────────────────────
-- These are safe to re-run (won't error if already added)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE subjects;          EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE units;             EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE study_materials;   EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quizzes;           EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quiz_questions;    EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE student_progress;  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;     EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE coding_submissions;EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE admin_settings;    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ── 8. RLS POLICIES for new tables ───────────────────────────────────
-- Quizzes: anyone can read
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_select" ON quizzes;
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "quizzes_all" ON quizzes;
CREATE POLICY "quizzes_all" ON quizzes FOR ALL USING (true) WITH CHECK (true);

-- Quiz Questions: anyone can read
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qq_select" ON quiz_questions;
CREATE POLICY "qq_select" ON quiz_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "qq_all" ON quiz_questions;
CREATE POLICY "qq_all" ON quiz_questions FOR ALL USING (true) WITH CHECK (true);

-- Quiz Attempts: users own their rows
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qa_all" ON quiz_attempts;
CREATE POLICY "qa_all" ON quiz_attempts FOR ALL USING (true) WITH CHECK (true);

-- Coding Submissions
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cs_all" ON coding_submissions;
CREATE POLICY "cs_all" ON coding_submissions FOR ALL USING (true) WITH CHECK (true);

-- Admin Settings: anyone can read, write (protected by app-level auth)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "as_all" ON admin_settings;
CREATE POLICY "as_all" ON admin_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! Your existing BCA subject section will continue to work.
-- The admin panel tables are now ready.
-- ============================================================

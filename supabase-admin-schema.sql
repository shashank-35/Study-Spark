-- ============================================================
-- STUDY SPARK – ADMIN PANEL SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id            BIGSERIAL PRIMARY KEY,
  subject_name  TEXT NOT NULL,
  semester      INT NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 6),
  credits       INT NOT NULL DEFAULT 3,
  difficulty    TEXT NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  description   TEXT DEFAULT '',
  progress      INT DEFAULT 0,
  completion    INT DEFAULT 0,
  next_topic    TEXT DEFAULT '',
  est_time      TEXT DEFAULT '',
  level         TEXT DEFAULT 'Beginner',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. UNITS
CREATE TABLE IF NOT EXISTS units (
  id          BIGSERIAL PRIMARY KEY,
  subject_id  BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  order_no    INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. STUDY MATERIALS
CREATE TABLE IF NOT EXISTS study_materials (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id    BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
  unit_id       BIGINT REFERENCES units(id) ON DELETE SET NULL,
  subject_name  TEXT DEFAULT '',
  title         TEXT NOT NULL DEFAULT '',
  file_name     TEXT NOT NULL,
  file_size     BIGINT DEFAULT 0,
  file_url      TEXT DEFAULT '',
  file_data     TEXT DEFAULT '',
  file_type     TEXT DEFAULT 'pdf',
  material_type TEXT DEFAULT 'Notes' CHECK (material_type IN ('Notes','Assignment','Important')),
  uploaded_at   TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id          BIGSERIAL PRIMARY KEY,
  subject_id  BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id     BIGINT REFERENCES units(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_limit  INT DEFAULT 30, -- minutes
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
  id              BIGSERIAL PRIMARY KEY,
  quiz_id         BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',  -- ["A","B","C","D"]
  correct_answer  INT NOT NULL DEFAULT 0,       -- index into options
  explanation     TEXT DEFAULT '',
  order_no        INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. STUDENT PROGRESS
CREATE TABLE IF NOT EXISTS student_progress (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL, -- Clerk user id
  subject_id      BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  completed_units INT DEFAULT 0,
  total_units     INT DEFAULT 0,
  score           NUMERIC(5,2) DEFAULT 0,
  last_accessed   TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. CODING SUBMISSIONS
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

-- 8. QUIZ ATTEMPTS
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

-- 9. ADMIN SETTINGS
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

-- Insert default settings row
INSERT INTO admin_settings (platform_name) VALUES ('Study Spark - BCA Edition')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ENABLE REALTIME on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE study_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE student_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE coding_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_settings;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_units_subject   ON units(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_unit   ON study_materials(unit_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject  ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz   ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_progress_user    ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user    ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz    ON quiz_attempts(quiz_id);

-- ============================================================
-- STORAGE BUCKET for study materials
-- ============================================================
-- Run this in Supabase Dashboard > Storage > New bucket
-- Bucket name: study-materials
-- Public: true (or set policies as needed)

-- ============================================================
-- FIX: Row Level Security Policies for Admin CRUD
-- ============================================================
-- Problem: Only SELECT policies exist. INSERT/UPDATE/DELETE are blocked.
-- Solution: Add full CRUD policies for tables that the admin panel manages.
--
-- Since this app uses Clerk for auth (not Supabase Auth),
-- we cannot rely on auth.uid(). Admin access is enforced at
-- the application level via Clerk role checks.
-- ============================================================

-- ── SUBJECTS ─────────────────────────────────────────────────
-- Keep existing SELECT policy, add INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "subjects_insert" ON subjects;
CREATE POLICY "subjects_insert" ON subjects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE USING (true);

-- ── UNITS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "units_insert" ON units;
CREATE POLICY "units_insert" ON units FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "units_update" ON units;
CREATE POLICY "units_update" ON units FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "units_delete" ON units;
CREATE POLICY "units_delete" ON units FOR DELETE USING (true);

-- ── STUDY MATERIALS ──────────────────────────────────────────
DROP POLICY IF EXISTS "sm_insert" ON study_materials;
CREATE POLICY "sm_insert" ON study_materials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "sm_update" ON study_materials;
CREATE POLICY "sm_update" ON study_materials FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sm_delete" ON study_materials;
CREATE POLICY "sm_delete" ON study_materials FOR DELETE USING (true);

-- ── STUDENT PROGRESS ─────────────────────────────────────────
-- Already has policies from schema_upgrade, but add open ones for admin
DROP POLICY IF EXISTS "sp_admin_all" ON student_progress;
CREATE POLICY "sp_admin_all" ON student_progress FOR ALL USING (true) WITH CHECK (true);

-- ── BOOKMARKS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "bk_admin_all" ON bookmarks;
CREATE POLICY "bk_admin_all" ON bookmarks FOR ALL USING (true) WITH CHECK (true);

-- ── QUIZZES ──────────────────────────────────────────────────
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_all" ON quizzes;
CREATE POLICY "quizzes_all" ON quizzes FOR ALL USING (true) WITH CHECK (true);

-- ── QUIZ QUESTIONS ───────────────────────────────────────────
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qq_all" ON quiz_questions;
CREATE POLICY "qq_all" ON quiz_questions FOR ALL USING (true) WITH CHECK (true);

-- ── QUIZ ATTEMPTS ────────────────────────────────────────────
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qa_all" ON quiz_attempts;
CREATE POLICY "qa_all" ON quiz_attempts FOR ALL USING (true) WITH CHECK (true);

-- ── CODING SUBMISSIONS ──────────────────────────────────────
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cs_all" ON coding_submissions;
CREATE POLICY "cs_all" ON coding_submissions FOR ALL USING (true) WITH CHECK (true);

-- ── ADMIN SETTINGS ───────────────────────────────────────────
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "as_all" ON admin_settings;
CREATE POLICY "as_all" ON admin_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! Admin can now INSERT/UPDATE/DELETE subjects, units,
-- materials, quizzes, etc. without RLS errors.
-- ============================================================

-- ============================================================
-- FIX: study_materials columns too short (varchar → TEXT)
-- ============================================================
-- Error: "value too long for type character varying(500)"
-- Cause: file_url, file_data, file_name etc. exceed varchar(500)
-- Fix: Change all string columns to TEXT (no length limit)
-- ============================================================

ALTER TABLE study_materials ALTER COLUMN file_url      TYPE TEXT;
ALTER TABLE study_materials ALTER COLUMN file_data     TYPE TEXT;
ALTER TABLE study_materials ALTER COLUMN file_name     TYPE TEXT;
ALTER TABLE study_materials ALTER COLUMN file_type     TYPE TEXT;
ALTER TABLE study_materials ALTER COLUMN subject_name  TYPE TEXT;
ALTER TABLE study_materials ALTER COLUMN title         TYPE TEXT;
ALTER TABLE study_materials ALTER COLUMN material_type TYPE TEXT;

-- Also fix subjects columns if they have varchar limits
ALTER TABLE subjects ALTER COLUMN name         TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN subject_name TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN description  TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN difficulty   TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN next_topic   TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN est_time     TYPE TEXT;
ALTER TABLE subjects ALTER COLUMN level        TYPE TEXT;

-- Fix units
ALTER TABLE units ALTER COLUMN title TYPE TEXT;

-- ============================================================
-- DONE! Upload will now work without length errors.
-- ============================================================

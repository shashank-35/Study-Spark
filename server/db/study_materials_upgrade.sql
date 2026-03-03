-- ============================================================================
-- study_materials_upgrade.sql
-- Adds unit_name column for denormalized display and ensures all needed indexes
-- ============================================================================

-- Add unit_name column if it doesn't exist (denormalized for faster display)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_materials' AND column_name = 'unit_name'
  ) THEN
    ALTER TABLE study_materials ADD COLUMN unit_name TEXT;
  END IF;
END $$;

-- Ensure subject_id index exists for fast lookups
CREATE INDEX IF NOT EXISTS idx_study_materials_subject_id
  ON study_materials(subject_id);

-- Ensure unit_id index exists
CREATE INDEX IF NOT EXISTS idx_study_materials_unit_id
  ON study_materials(unit_id);

-- Composite index for subject + unit grouping
CREATE INDEX IF NOT EXISTS idx_study_materials_subject_unit
  ON study_materials(subject_id, unit_id);

-- Backfill unit_name from units table where unit_id is set
UPDATE study_materials sm
SET unit_name = u.title
FROM units u
WHERE sm.unit_id = u.id
  AND sm.unit_name IS NULL
  AND sm.unit_id IS NOT NULL;

-- Enable realtime for study_materials (safe if already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE study_materials;

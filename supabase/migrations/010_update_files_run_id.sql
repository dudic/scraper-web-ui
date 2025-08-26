-- Migration 010: Update files table to use UUID for run_id
-- This migration handles the files table after the runs table has been updated

-- Since we can't easily map the old TEXT run_id to the new UUID id,
-- we'll need to handle this carefully. For now, we'll:
-- 1. Add a new UUID column
-- 2. Leave the old TEXT column for reference
-- 3. Update the foreign key constraint

-- Add a new UUID column for the run reference
ALTER TABLE files ADD COLUMN run_uuid UUID;

-- For existing files, we can't automatically map them since we changed the runs.id
-- New files will be created with the correct UUID reference
-- We'll leave the old run_id column for now and handle it in a future migration

-- Add foreign key constraint for the new UUID column
ALTER TABLE files 
ADD CONSTRAINT files_run_uuid_fkey 
FOREIGN KEY (run_uuid) REFERENCES runs(id);

-- Create index for the new UUID column
CREATE INDEX idx_files_run_uuid ON files(run_uuid);

-- Add comment for documentation
COMMENT ON COLUMN files.run_uuid IS 'Reference to the run UUID (new format)';
COMMENT ON COLUMN files.run_id IS 'Reference to the run ID (old TEXT format - deprecated)';

-- Note: The old run_id column will be removed in a future migration
-- after we ensure all new files use the run_uuid column

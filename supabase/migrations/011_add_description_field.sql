-- Migration 011: Add description field to runs table
-- This field will store the text-based description of the current step the APIFY actor is performing

-- Add the description column
ALTER TABLE runs ADD COLUMN description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN runs.description IS 'Text description of the current step being performed by the APIFY actor (e.g., "Download Assessment-Report")';

-- Create index for better query performance when filtering by description
CREATE INDEX idx_runs_description ON runs(description);

-- Update existing records to have a default description
UPDATE runs SET description = 'Initializing...' WHERE description IS NULL AND status = 'RUNNING';
UPDATE runs SET description = 'Completed' WHERE description IS NULL AND status = 'SUCCEEDED';
UPDATE runs SET description = 'Failed' WHERE description IS NULL AND status = 'FAILED';

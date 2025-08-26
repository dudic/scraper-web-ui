-- Add apify_run_id column to store the actual Apify run ID
ALTER TABLE runs 
ADD COLUMN apify_run_id TEXT;

COMMENT ON COLUMN runs.apify_run_id IS 'The actual run ID from Apify API, separate from the internal primary key';

-- Create index for efficient lookups by Apify run ID
CREATE INDEX idx_runs_apify_run_id ON runs(apify_run_id);

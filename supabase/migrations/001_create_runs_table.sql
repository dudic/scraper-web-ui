-- Create runs table
CREATE TABLE runs (
  id         TEXT PRIMARY KEY,      -- Apify runId
  pct        INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'RUNNING',
  done       INTEGER DEFAULT 0,     -- Number of completed items
  total      INTEGER DEFAULT 0,     -- Total number of items
  error      TEXT,                  -- Error message if failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_runs_started_at ON runs(started_at DESC);
CREATE INDEX idx_runs_status ON runs(status);

-- Enable Row Level Security (RLS)
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on runs" ON runs
  FOR ALL USING (true);

-- Enable Realtime for the runs table
-- Note: This needs to be done in the Supabase dashboard
-- Go to Database > Replication > Enable realtime for the 'runs' table 
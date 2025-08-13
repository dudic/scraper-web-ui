-- Migration: Create files table for file storage features
-- Date: January 2025
-- Description: Adds file storage capabilities to track downloaded files from APIFY

-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  apify_key TEXT NOT NULL,           -- Original APIFY key
  filename TEXT NOT NULL,            -- Display name
  content_type TEXT NOT NULL,        -- MIME type
  file_size BIGINT,                  -- File size in bytes
  supabase_path TEXT,                -- Path in Supabase storage
  download_url TEXT,                 -- Signed download URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_files_run_id ON files(run_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_content_type ON files(content_type);
CREATE INDEX idx_files_apify_key ON files(apify_key);

-- Enable Row Level Security (RLS)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies for file access
CREATE POLICY "Allow read access to files" ON files
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access" ON files
  FOR ALL USING (auth.role() = 'service_role');

-- Add file_count column to runs table
ALTER TABLE runs ADD COLUMN file_count INTEGER DEFAULT 0;

-- Create index for file_count queries
CREATE INDEX idx_runs_file_count ON runs(file_count);

-- Enable Realtime for the files table
-- Note: This needs to be done in the Supabase dashboard
-- Go to Database > Replication > Enable realtime for the 'files' table

-- Add comments for documentation
COMMENT ON TABLE files IS 'Stores metadata for files downloaded from APIFY and stored in Supabase Storage';
COMMENT ON COLUMN files.run_id IS 'Reference to the APIFY run that generated this file';
COMMENT ON COLUMN files.apify_key IS 'Original key used in APIFY Key-Value Store';
COMMENT ON COLUMN files.filename IS 'Human-readable filename for display';
COMMENT ON COLUMN files.content_type IS 'MIME type of the file';
COMMENT ON COLUMN files.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN files.supabase_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN files.download_url IS 'Signed URL for secure file download';
COMMENT ON COLUMN runs.file_count IS 'Number of files associated with this run';

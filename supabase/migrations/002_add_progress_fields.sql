-- Add missing progress fields to runs table
ALTER TABLE runs 
ADD COLUMN IF NOT EXISTS done INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error TEXT;

-- Update existing records to have proper defaults
UPDATE runs 
SET done = 0, total = 0 
WHERE done IS NULL OR total IS NULL;

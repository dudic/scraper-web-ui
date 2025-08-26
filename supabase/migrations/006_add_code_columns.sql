-- Migration: Add code and code_type columns to runs table
-- Date: January 2025
-- Description: Add code and code_type fields to track APIFY input parameters

-- Add code and code_type columns to runs table
ALTER TABLE runs 
ADD COLUMN code TEXT,
ADD COLUMN code_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN runs.code IS 'The code parameter passed to APIFY for the scraper run';
COMMENT ON COLUMN runs.code_type IS 'The type/category of the code (e.g., HR Cockpit, Profiling Values, etc.)';

-- Create indexes for better query performance
CREATE INDEX idx_runs_code ON runs(code);
CREATE INDEX idx_runs_code_type ON runs(code_type);

-- Update existing records to have default values (optional)
-- UPDATE runs SET code = 'unknown', code_type = 'unknown' WHERE code IS NULL OR code_type IS NULL;



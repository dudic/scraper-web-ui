-- Direct Database Test
-- Run this in your Supabase SQL Editor to see what's actually in the database

-- 1. Check the most recent runs with all their data
SELECT 
    id,
    code,
    code_type,
    status,
    pct,
    done,
    total,
    started_at,
    updated_at
FROM runs 
ORDER BY started_at DESC 
LIMIT 10;

-- 2. Check if there are any runs with actual code values (not null, not 'unknown')
SELECT 
    COUNT(*) as total_runs,
    COUNT(CASE WHEN code IS NOT NULL AND code != 'unknown' AND code != '' THEN 1 END) as runs_with_real_code,
    COUNT(CASE WHEN code_type IS NOT NULL AND code_type != 'unknown' AND code_type != '' THEN 1 END) as runs_with_real_code_type
FROM runs;

-- 3. Show runs that have actual code values
SELECT 
    id,
    code,
    code_type,
    status,
    started_at
FROM runs 
WHERE code IS NOT NULL 
  AND code != 'unknown' 
  AND code != ''
ORDER BY started_at DESC;

-- 4. Check the table structure to make sure columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'runs' 
  AND column_name IN ('code', 'code_type')
ORDER BY ordinal_position;

-- 5. Test inserting a dummy record to see if the columns work
-- (This will help us verify the columns are working correctly)
INSERT INTO runs (id, code, code_type, pct, status, started_at, updated_at)
VALUES ('test-run-' || EXTRACT(EPOCH FROM NOW())::text, 'TEST123', 'TEST_TYPE', 0, 'RUNNING', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Check if the test record was inserted
SELECT 
    id,
    code,
    code_type,
    status,
    started_at
FROM runs 
WHERE id LIKE 'test-run-%'
ORDER BY started_at DESC;

-- 7. Clean up the test record
DELETE FROM runs WHERE id LIKE 'test-run-%';


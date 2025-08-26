-- Test Script: Verify Code and Code Type Storage
-- Run this in your Supabase SQL Editor to test the fix

-- 1. Check current data in runs table
SELECT 
    id,
    code,
    code_type,
    status,
    started_at,
    updated_at
FROM runs 
ORDER BY started_at DESC 
LIMIT 10;

-- 2. Check if there are any runs with non-null code values
SELECT 
    COUNT(*) as total_runs,
    COUNT(code) as runs_with_code,
    COUNT(code_type) as runs_with_code_type,
    COUNT(CASE WHEN code IS NOT NULL AND code != 'unknown' THEN 1 END) as runs_with_actual_code,
    COUNT(CASE WHEN code_type IS NOT NULL AND code_type != 'unknown' THEN 1 END) as runs_with_actual_code_type
FROM runs;

-- 3. Show runs that have actual code values (not null or 'unknown')
SELECT 
    id,
    code,
    code_type,
    status,
    started_at
FROM runs 
WHERE code IS NOT NULL 
  AND code != 'unknown'
ORDER BY started_at DESC;

-- 4. Show the most recent runs with their code values
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
LIMIT 5;

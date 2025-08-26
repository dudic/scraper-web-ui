-- Verification Script: Check if code and code_type columns exist
-- Run this in your Supabase SQL Editor to confirm the migration was applied

-- Check if the columns exist
SELECT 
    'code column exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'runs' 
        AND column_name = 'code'
    ) as result
UNION ALL
SELECT 
    'code_type column exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'runs' 
        AND column_name = 'code_type'
    ) as result;

-- Show the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'runs' 
ORDER BY ordinal_position;

-- Show sample data with the new columns
SELECT 
    id,
    code,
    code_type,
    status,
    started_at
FROM runs 
ORDER BY started_at DESC 
LIMIT 5;

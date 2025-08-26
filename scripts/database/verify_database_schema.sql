-- Database Schema Verification Script
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check if the runs table exists
SELECT 
    'runs table exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'runs'
    ) as result;

-- 2. Check current runs table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'runs' 
ORDER BY ordinal_position;

-- 3. Check specifically for code and code_type columns
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

-- 4. Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'runs' 
AND indexname LIKE '%code%';

-- 5. Sample data from runs table (if it exists)
SELECT 
    id,
    code,
    code_type,
    status,
    started_at
FROM runs 
ORDER BY started_at DESC 
LIMIT 5;

-- 6. Count total runs
SELECT 
    'total runs count' as check_type,
    COUNT(*) as result
FROM runs;

# 🔧 Database Schema Fix Guide

## 🎯 Issue Summary

The "Code" and "Code Type" columns are not showing correctly in the frontend because the database migration `006_add_code_columns.sql` has not been applied to the database.

## 🔍 Root Cause

1. **Missing Database Columns**: The `code` and `code_type` columns don't exist in the `runs` table
2. **Migration Not Applied**: Migration `006_add_code_columns.sql` needs to be executed
3. **Frontend Expects Columns**: The UI code expects these columns to exist

## 🛠️ Solution Steps

### Step 1: Apply the Database Migration

Go to your Supabase dashboard and run the following SQL in the SQL Editor:

```sql
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
UPDATE runs SET code = 'unknown', code_type = 'unknown' WHERE code IS NULL OR code_type IS NULL;
```

### Step 2: Verify the Migration

Run this SQL to verify the columns were added successfully:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'runs' 
AND column_name IN ('code', 'code_type')
ORDER BY ordinal_position;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'runs' 
ORDER BY ordinal_position;
```

### Step 3: Test the Fix

1. **Start a new import/scraping process** from the frontend
2. **Verify the Code and Code Type columns** now show the correct values
3. **Check existing runs** to see if they display properly

## 🔍 Verification Commands

### Check Current Database Schema

```sql
-- View current runs table structure
\d runs

-- Or use this SQL query
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'runs' 
ORDER BY ordinal_position;
```

### Check Existing Data

```sql
-- View existing runs with code columns
SELECT id, code, code_type, status, started_at 
FROM runs 
ORDER BY started_at DESC 
LIMIT 10;
```

## 🚨 Troubleshooting

### If Migration Fails

If you get an error saying the columns already exist:

```sql
-- Check if columns already exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'runs' 
AND column_name IN ('code', 'code_type');

-- If they exist, you can skip the ALTER TABLE commands
-- Just run the index creation and comments
```

### If Indexes Already Exist

If you get an error about indexes already existing:

```sql
-- Drop existing indexes first (if needed)
DROP INDEX IF EXISTS idx_runs_code;
DROP INDEX IF EXISTS idx_runs_code_type;

-- Then recreate them
CREATE INDEX idx_runs_code ON runs(code);
CREATE INDEX idx_runs_code_type ON runs(code_type);
```

## 📊 Expected Results

After applying the migration:

1. **Frontend Display**: The "Code" and "Code Type" columns should show the values entered in the import form
2. **New Runs**: New scraping processes should display the correct code and code type
3. **Existing Runs**: Existing runs should show "unknown" for code and code type (unless updated)

## 🔄 Alternative: Manual Column Addition

If the migration approach doesn't work, you can manually add the columns:

```sql
-- Add columns one by one
ALTER TABLE runs ADD COLUMN code TEXT;
ALTER TABLE runs ADD COLUMN code_type TEXT;

-- Add indexes
CREATE INDEX idx_runs_code ON runs(code);
CREATE INDEX idx_runs_code_type ON runs(code_type);

-- Update existing records
UPDATE runs SET code = 'unknown', code_type = 'unknown' WHERE code IS NULL OR code_type IS NULL;
```

## 📝 Notes

- The frontend code is already correctly implemented
- The API code correctly extracts and stores the values
- This is purely a database schema issue
- After applying the migration, the columns should appear immediately

## 🎯 Success Criteria

✅ Code and Code Type columns appear in the frontend table  
✅ New imports show the correct values in these columns  
✅ Existing runs display properly (with "unknown" or actual values)  
✅ No errors in browser console related to missing columns  
✅ Database queries return the expected data structure  

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation

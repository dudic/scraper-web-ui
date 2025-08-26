# 🚀 Supabase CLI Migration Guide

## 🎯 Overview

This guide shows you how to use the Supabase CLI to apply the database migration that adds the `code` and `code_type` columns to the `runs` table.

## 📋 Prerequisites

1. **Supabase CLI installed** (you already have it configured)
2. **Supabase project linked** to your local project
3. **Access to your Supabase project** (project reference)

## 🔧 Step-by-Step Instructions

### Step 1: Verify Supabase CLI Setup

First, let's check your current Supabase CLI setup:

```bash
# Check if Supabase CLI is installed and working
supabase --version

# Check if you're linked to a project
supabase status

# List your projects (if not linked)
supabase projects list
```

### Step 2: Link to Your Supabase Project (if not already linked)

If you're not linked to a project, you'll need to link it:

```bash
# Link to your existing Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Replace YOUR_PROJECT_REF with your actual project reference
# You can find this in your Supabase dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

### Step 3: Check Current Migration Status

```bash
# Check which migrations have been applied
supabase migration list

# Check the current database schema
supabase db diff
```

### Step 4: Apply the Migration

Since the migration file `006_add_code_columns.sql` already exists, you can apply it using:

```bash
# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db push --include-all
```

### Step 5: Verify the Migration

```bash
# Check if the migration was applied successfully
supabase migration list

# Verify the schema changes
supabase db diff
```

## 🔍 Alternative: Manual Migration Application

If the CLI approach doesn't work, you can manually apply the migration:

### Option A: Using Supabase CLI to run SQL

```bash
# Run the migration SQL directly
supabase db reset --linked

# Or apply just the specific migration
supabase db push --include-all
```

### Option B: Using the Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration SQL:

```sql
-- Migration: Add code and code_type columns to runs table
ALTER TABLE runs 
ADD COLUMN code TEXT,
ADD COLUMN code_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN runs.code IS 'The code parameter passed to APIFY for the scraper run';
COMMENT ON COLUMN runs.code_type IS 'The type/category of the code (e.g., HR Cockpit, Profiling Values, etc.)';

-- Create indexes for better query performance
CREATE INDEX idx_runs_code ON runs(code);
CREATE INDEX idx_runs_code_type ON runs(code_type);

-- Update existing records to have default values
UPDATE runs SET code = 'unknown', code_type = 'unknown' WHERE code IS NULL OR code_type IS NULL;
```

## 🛠️ Troubleshooting

### If `supabase db push` fails:

```bash
# Check the current status
supabase status

# Reset and reapply all migrations
supabase db reset --linked

# Or try applying migrations one by one
supabase db push --include-all
```

### If you get authentication errors:

```bash
# Login to Supabase
supabase login

# Then try linking again
supabase link --project-ref YOUR_PROJECT_REF
```

### If migrations are out of sync:

```bash
# Check what migrations exist locally vs remotely
supabase migration list

# Reset the database and apply all migrations
supabase db reset --linked
```

## 🔍 Verification Commands

After applying the migration, verify it worked:

```bash
# Check the database schema
supabase db diff

# Or run the verification SQL
supabase db reset --linked
```

You can also run the verification SQL I created earlier:

```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'runs' 
AND column_name IN ('code', 'code_type')
ORDER BY ordinal_position;
```

## 📊 Expected Results

After successful migration:

1. ✅ The `code` and `code_type` columns exist in the `runs` table
2. ✅ Indexes are created for better performance
3. ✅ Existing records have default values
4. ✅ Frontend displays the columns correctly

## 🚨 Common Issues and Solutions

### Issue: "Migration already applied"
**Solution**: This is fine - it means the migration was already applied.

### Issue: "Permission denied"
**Solution**: Make sure you're logged in and have the correct project access.

### Issue: "Connection failed"
**Solution**: Check your internet connection and Supabase project status.

### Issue: "Migration conflicts"
**Solution**: Reset the database and reapply all migrations.

## 🎯 Success Checklist

- [ ] Supabase CLI is installed and working
- [ ] Project is linked successfully
- [ ] Migration is applied without errors
- [ ] Database schema shows the new columns
- [ ] Frontend displays Code and Code Type columns
- [ ] New imports show correct values in these columns

## 📝 Notes

- The Supabase CLI approach is more reliable than manual SQL execution
- It keeps track of which migrations have been applied
- It can handle rollbacks if needed
- It's the recommended approach for production environments

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation

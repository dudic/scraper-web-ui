# 🗄️ Current Database Schema

## 📋 Overview

This document describes the current database schema for the Scraper Dashboard, reflecting the latest UUID-based implementation with all migrations applied.

## 🏗️ Database Tables

### Runs Table

**Table Name**: `runs`  
**Primary Key**: `id` (UUID, auto-generated)

```sql
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apify_run_id TEXT,
  code TEXT,
  code_type TEXT,
  pct INTEGER DEFAULT 0,
  status TEXT DEFAULT 'STARTING',
  done INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  error TEXT,
  description TEXT,
  file_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Column Descriptions**:
- `id`: **Primary Key** - Auto-generated UUID by Supabase
- `apify_run_id`: Apify-generated run ID (for reference only)
- `code`: The code parameter passed to APIFY for the scraper run
- `code_type`: The type/category of the code (e.g., HR_COCKPIT, PROFILING_VALUES)
- `pct`: Progress percentage (0-100)
- `status`: Current status (STARTING, RUNNING, SUCCEEDED, FAILED)
- `done`: Number of completed items
- `total`: Total number of items to process
- `error`: Error message if the run failed
- `description`: Text description of the current step being performed
- `file_count`: Number of files associated with this run
- `started_at`: Timestamp when the run started
- `updated_at`: Timestamp when the run was last updated

### Files Table

**Table Name**: `files`  
**Primary Key**: `id` (UUID, auto-generated)

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT,                    -- Legacy column (deprecated)
  run_uuid UUID,                  -- New UUID reference
  apify_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT,
  supabase_path TEXT,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Column Descriptions**:
- `id`: **Primary Key** - Auto-generated UUID by Supabase
- `run_id`: **Deprecated** - Legacy TEXT reference to run (will be removed)
- `run_uuid`: **Current** - UUID reference to the runs table
- `apify_key`: Original APIFY key for the file
- `filename`: Display name of the file
- `content_type`: MIME type of the file (e.g., application/pdf)
- `file_size`: File size in bytes
- `supabase_path`: Path in Supabase storage bucket
- `download_url`: Signed download URL (temporary)
- `created_at`: Timestamp when the file was created
- `updated_at`: Timestamp when the file was last updated

## 🔗 Relationships

### Foreign Key Constraints

```sql
-- Files table references runs table via UUID
ALTER TABLE files 
ADD CONSTRAINT files_run_uuid_fkey 
FOREIGN KEY (run_uuid) REFERENCES runs(id) ON DELETE CASCADE;
```

### Indexes

```sql
-- Runs table indexes
CREATE INDEX idx_runs_started_at ON runs(started_at DESC);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_code ON runs(code);
CREATE INDEX idx_runs_code_type ON runs(code_type);
CREATE INDEX idx_runs_description ON runs(description);

-- Files table indexes
CREATE INDEX idx_files_run_id ON files(run_id);
CREATE INDEX idx_files_run_uuid ON files(run_uuid);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_content_type ON files(content_type);
```

## 🔐 Row Level Security (RLS)

### Runs Table Policies

```sql
-- Enable RLS
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Allow all operations on runs (public access)
CREATE POLICY "Allow all operations on runs" ON runs FOR ALL USING (true);
```

### Files Table Policies

```sql
-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Allow read access to files
CREATE POLICY "Allow read access to files" ON files FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access" ON files FOR ALL USING (auth.role() = 'service_role');
```

## 🗂️ Storage Configuration

### Supabase Storage Bucket

**Bucket Name**: `scraper-files`  
**Access**: Private (requires signed URLs)  
**File Size Limit**: 100MB  
**Allowed MIME Types**:
- `application/pdf`
- `text/csv`
- `application/json`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `text/plain`
- `application/xml`
- `text/html`

### Storage Policies

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scraper-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'scraper-files' AND auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL USING (bucket_id = 'scraper-files' AND auth.role() = 'service_role');
```

## 🔄 Realtime Configuration

### Enabled Tables

```sql
-- Enable realtime for runs table
ALTER PUBLICATION supabase_realtime ADD TABLE runs;

-- Enable realtime for files table
ALTER PUBLICATION supabase_realtime ADD TABLE files;
```

## 📊 Data Flow

### 1. Run Creation
1. **Import API** creates run record with auto-generated UUID
2. **Apify Actor** receives UUID as `internalRunId`
3. **Actor Update API** uses UUID for all database operations

### 2. File Processing
1. **File Processing API** downloads files from APIFY
2. **Files** are uploaded to Supabase Storage
3. **File metadata** is stored in files table with UUID reference

### 3. Data Retrieval
1. **Frontend** queries runs table by UUID
2. **File lists** are retrieved using UUID reference
3. **Signed URLs** are generated for file downloads

## 🚨 Important Notes

### UUID-Based Identification
- **All database operations** use the Supabase-generated UUID (`id` field)
- **Apify run ID** is stored for reference only in `apify_run_id` column
- **Never use Apify run ID** for database lookups or updates

### Migration Status
- ✅ Migration 009: Simplify ID structure (UUID-based runs table)
- ✅ Migration 010: Update files table to use UUID
- ✅ Migration 011: Add description field to runs table
- 🔄 Migration 012: Remove legacy run_id column from files table (planned)

### Data Integrity
- **Foreign key constraints** ensure referential integrity
- **Cascade deletes** remove associated files when runs are deleted
- **Indexes** optimize query performance for common operations

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Current Implementation

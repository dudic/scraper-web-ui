# 📁 File Storage & Download Features

## 🎯 Overview

This document outlines the implementation of file storage and download features that transform the scraper dashboard into a complete file management solution. These features bridge the gap between APIFY's file storage and user accessibility through the web UI.

## 🏗️ Architecture

### Current State vs. Target State

**Before (Current):**
```
APIFY Actor → APIFY Key-Value Store → ❌ No Web UI Access
```

**After (Target):**
```
APIFY Actor → APIFY Key-Value Store → Web UI API → Supabase Storage → Download Links
```

### System Components

1. **APIFY Integration Layer**
   - Fetches files from APIFY Key-Value Store
   - Downloads file content and metadata
   - Handles APIFY API authentication

2. **File Processing Service**
   - Downloads files from APIFY
   - Uploads to Supabase Storage
   - Manages file metadata

3. **Storage Layer**
   - Supabase Storage bucket for file storage
   - Database tables for file metadata
   - Signed URL generation for secure access

4. **Web UI Layer**
   - File listing and management
   - Download functionality
   - Real-time status updates

## 📊 Database Schema

### Files Table
```sql
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
```

### Enhanced Runs Table
```sql
-- Add file count to existing runs table
ALTER TABLE runs ADD COLUMN file_count INTEGER DEFAULT 0;
```

### Indexes for Performance
```sql
CREATE INDEX idx_files_run_id ON files(run_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_content_type ON files(content_type);
```

## 🔧 API Endpoints

### File Processing

#### POST `/api/files/process/{runId}`
Processes files from APIFY for a completed run.

**Request:**
```json
{
  "force": false  // Optional: force reprocessing
}
```

**Response:**
```json
{
  "success": true,
  "processedFiles": 5,
  "totalFiles": 5,
  "errors": []
}
```

### File Management

#### GET `/api/files/{runId}`
Lists all files for a specific run.

**Response:**
```json
{
  "files": [
    {
      "id": "uuid",
      "filename": "report.pdf",
      "contentType": "application/pdf",
      "fileSize": 1024000,
      "downloadUrl": "https://...",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### GET `/api/files/{fileId}/download`
Generates a signed download URL for a specific file.

**Response:**
```json
{
  "downloadUrl": "https://...",
  "expiresAt": "2025-01-15T11:30:00Z"
}
```

#### DELETE `/api/files/{fileId}`
Deletes a file (admin only).

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 🗂️ File Storage Configuration

### Supabase Storage Bucket
- **Name**: `scraper-files`
- **Access**: Private (requires signed URLs)
- **File Size Limit**: 100MB
- **Allowed MIME Types**:
  - `application/pdf`
  - `text/csv`
  - `application/json`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### File Organization
```
scraper-files/
├── {runId}/
│   ├── {filename1}
│   ├── {filename2}
│   └── ...
```

## 🔄 Processing Flow

### 1. Run Completion Trigger
When an APIFY run completes:
```typescript
// Enhanced actor-update endpoint
if (status === 'SUCCEEDED') {
  // Trigger file processing
  await processFilesForRun(runId);
}
```

### 2. File Processing Steps
1. **Fetch APIFY Dataset**: Get all items from the run's dataset
2. **Extract File URLs**: Parse file references from dataset items
3. **Download from APIFY**: Download each file from Key-Value Store
4. **Upload to Supabase**: Store files in Supabase Storage bucket
5. **Create Metadata**: Store file information in database
6. **Generate URLs**: Create signed download URLs
7. **Update Run**: Update file count in runs table

### 3. Error Handling
- **Retry Logic**: Retry failed downloads/uploads (3 attempts)
- **Partial Success**: Continue processing if some files fail
- **Cleanup**: Remove orphaned files on failure
- **Logging**: Comprehensive error logging and monitoring

## 🎨 User Interface Features

### Enhanced Run List
- **File Count Column**: Shows number of files per run
- **Download Button**: Quick access to file downloads
- **Status Indicators**: Visual indicators for file processing status

### File Management Modal
- **File List**: Complete list of files for a run
- **File Preview**: Preview supported file types
- **Download Options**: Individual file downloads
- **Bulk Download**: Download all files as ZIP

### File Information Display
- **File Name**: Original filename
- **File Type**: MIME type and icon
- **File Size**: Human-readable size
- **Download Date**: When file was processed
- **Download Link**: Direct download URL

## 🔐 Security & Access Control

### Row Level Security (RLS)
```sql
-- Allow read access to files
CREATE POLICY "Allow read access to files" ON files
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access" ON files
  FOR ALL USING (auth.role() = 'service_role');
```

### Storage Security
- **Private Bucket**: Files not publicly accessible
- **Signed URLs**: Time-limited access (1 hour)
- **Content Validation**: MIME type verification
- **Size Limits**: Prevent abuse through file size restrictions

### API Security
- **Authentication**: Bearer token for file processing
- **Rate Limiting**: Prevent abuse of download endpoints
- **Audit Logging**: Track file access and downloads

## 📈 Performance Optimizations

### Batch Processing
- **Concurrent Downloads**: Process multiple files simultaneously
- **Streaming**: Stream large files instead of loading in memory
- **Background Jobs**: Process files asynchronously

### Caching Strategy
- **Signed URL Caching**: Cache URLs for 30 minutes
- **File Metadata Caching**: Cache file lists
- **CDN Integration**: Use Supabase CDN for global distribution

### Monitoring & Metrics
- **Processing Time**: Track file processing duration
- **Success Rates**: Monitor processing success rates
- **Storage Usage**: Track storage consumption
- **Download Analytics**: Monitor file download patterns

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema creation
- [ ] Supabase storage bucket setup
- [ ] Basic file processing service
- [ ] APIFY integration utilities

### Phase 2: Core Features (Week 2)
- [ ] File processing API endpoints
- [ ] File management APIs
- [ ] Basic frontend components
- [ ] Error handling and retry logic

### Phase 3: User Interface (Week 3)
- [ ] Enhanced RunList component
- [ ] File management modal
- [ ] Download functionality
- [ ] Real-time status updates

### Phase 4: Polish & Testing (Week 4)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Comprehensive testing
- [ ] Documentation updates

## 🔧 Configuration

### Environment Variables
```bash
# Existing variables
APIFY_TOKEN=your_apify_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# New variables for file processing
FILE_PROCESSING_TIMEOUT=300000  # 5 minutes
MAX_CONCURRENT_DOWNLOADS=5
SIGNED_URL_EXPIRY=3600  # 1 hour
```

### Supabase Configuration
```sql
-- Enable storage
-- Create bucket: scraper-files
-- Set bucket policies
-- Configure RLS for files table
```

## 📋 Testing Checklist

### File Processing
- [ ] Process files from successful APIFY runs
- [ ] Handle failed APIFY runs gracefully
- [ ] Test with various file types (PDF, CSV, JSON)
- [ ] Verify file size limits
- [ ] Test concurrent processing

### Download Functionality
- [ ] Generate valid signed URLs
- [ ] Test URL expiration
- [ ] Verify file integrity after download
- [ ] Test bulk download functionality
- [ ] Handle download errors gracefully

### Security
- [ ] Verify private bucket access
- [ ] Test signed URL security
- [ ] Validate file type restrictions
- [ ] Test rate limiting
- [ ] Verify audit logging

### Performance
- [ ] Test with large files
- [ ] Monitor processing time
- [ ] Test concurrent users
- [ ] Verify caching effectiveness
- [ ] Monitor storage usage

## 🐛 Troubleshooting

### Common Issues

#### File Processing Fails
- Check APIFY token validity
- Verify run completion status
- Check Supabase storage permissions
- Review error logs for specific failures

#### Download Links Expire
- Links expire after 1 hour
- Generate new links as needed
- Implement automatic refresh for active sessions

#### Large File Processing
- Files over 100MB are rejected
- Consider chunked processing for large files
- Monitor memory usage during processing

### Debug Commands
```bash
# Check file processing status
curl -X GET "https://your-app.vercel.app/api/files/{runId}"

# Force reprocess files
curl -X POST "https://your-app.vercel.app/api/files/process/{runId}" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# Check storage usage
# Use Supabase dashboard to monitor bucket usage
```

## 📚 Related Documentation

- [README.md](./README.md) - Main project documentation
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Complete API reference
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [SUPABASE_LEGACY_NOTES.md](./SUPABASE_LEGACY_NOTES.md) - Supabase configuration notes

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Planning Phase

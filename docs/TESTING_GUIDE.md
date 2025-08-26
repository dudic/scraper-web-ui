# 🧪 Testing Guide

## 📋 Overview

This guide provides comprehensive testing procedures for the Scraper Dashboard, covering all components and integration points of the current UUID-based implementation.

## 🎯 Testing Objectives

- **Functionality**: Verify all features work as expected
- **Integration**: Test component interactions and data flow
- **Performance**: Ensure system meets performance requirements
- **Security**: Validate security measures and data protection
- **User Experience**: Confirm intuitive and responsive interface

## 🏗️ Testing Environment Setup

### Prerequisites
- **Local Development**: Next.js dev server running
- **Database**: Supabase project with current schema
- **APIFY**: Actor deployed and configured
- **Environment Variables**: All required variables set

### Test Data
```bash
# Sample test codes for different platforms
HR_COCKPIT: "TEST123"
PROFILING_VALUES: "TEST456"
HR_COCKPIT_SOLL: "TEST789"
PROFILING_VALUES_SOLL: "TEST012"
```

## 🔍 Component Testing

### 1. Frontend Components

#### ImportForm Component
**Test Cases:**
- [ ] Form validation (required fields)
- [ ] Code input handling
- [ ] Code type selection
- [ ] Submit functionality
- [ ] Error state display
- [ ] Loading state during submission

**Test Steps:**
```javascript
// Test form validation
1. Leave code field empty → Submit → Should show error
2. Enter invalid code → Submit → Should show error
3. Select code type → Enter valid code → Submit → Should work

// Test API integration
1. Submit valid form → Check network request
2. Verify request payload format
3. Check response handling
```

#### RunList Component
**Test Cases:**
- [ ] Data loading and display
- [ ] Real-time updates
- [ ] Progress bar functionality
- [ ] Status indicators
- [ ] Delete run functionality
- [ ] File count display

**Test Steps:**
```javascript
// Test data display
1. Load page → Verify runs are displayed
2. Check UUID format in run IDs
3. Verify code and code_type columns
4. Check description field display

// Test real-time updates
1. Start a new run → Watch for real-time updates
2. Verify progress percentage updates
3. Check status changes
4. Confirm description updates
```

#### FileList Component
**Test Cases:**
- [ ] File listing functionality
- [ ] File type icons
- [ ] Download functionality
- [ ] File size display
- [ ] Error handling

**Test Steps:**
```javascript
// Test file display
1. Complete a run with files → Check file list
2. Verify file type icons (PDF, CSV, etc.)
3. Check file size formatting
4. Test download links

// Test file processing
1. Trigger file processing → Monitor progress
2. Check file upload to Supabase
3. Verify signed URL generation
```

### 2. API Endpoints

#### Import API (`/api/import`)
**Test Cases:**
- [ ] Valid request handling
- [ ] Invalid request validation
- [ ] Database record creation
- [ ] UUID generation
- [ ] APIFY integration
- [ ] Error handling

**Test Commands:**
```bash
# Test valid import
curl -X POST "http://localhost:3000/api/import" \
  -H "Content-Type: application/json" \
  -d '{
    "actorId": "HceSv1pj0Y3PZTMvG",
    "input": {
      "code": "TEST123",
      "codeType": "HR_COCKPIT"
    }
  }'

# Test invalid request
curl -X POST "http://localhost:3000/api/import" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "code": "TEST123"
    }
  }'
```

#### Actor Update API (`/api/actor-update`)
**Test Cases:**
- [ ] Authentication validation
- [ ] UUID-based record lookup
- [ ] Progress update handling
- [ ] Description field updates
- [ ] Error status handling

**Test Commands:**
```bash
# Test progress update
curl -X POST "http://localhost:3000/api/actor-update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-actor-secret" \
  -d '{
    "runId": "550e8400-e29b-41d4-a716-446655440000",
    "done": 2,
    "total": 5,
    "status": "RUNNING",
    "description": "Download Assessment-Report"
  }'

# Test authentication failure
curl -X POST "http://localhost:3000/api/actor-update" \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "550e8400-e29b-41d4-a716-446655440000",
    "done": 2,
    "total": 5,
    "status": "RUNNING"
  }'
```

#### File Processing API (`/api/files/process/{runId}`)
**Test Cases:**
- [ ] File processing initiation
- [ ] APIFY file retrieval
- [ ] Supabase storage upload
- [ ] Database metadata creation
- [ ] Error handling

**Test Commands:**
```bash
# Test file processing
curl -X POST "http://localhost:3000/api/files/process/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-actor-secret" \
  -d '{"force": false}'
```

#### Delete Run API (`/api/runs/{runId}`)
**Test Cases:**
- [ ] Run deletion
- [ ] Associated file cleanup
- [ ] Storage cleanup
- [ ] Database cascade deletion

**Test Commands:**
```bash
# Test run deletion
curl -X DELETE "http://localhost:3000/api/runs/550e8400-e29b-41d4-a716-446655440000"
```

### 3. Database Operations

#### Schema Validation
**Test Cases:**
- [ ] Table structure verification
- [ ] Index functionality
- [ ] Foreign key constraints
- [ ] RLS policies

**Test Queries:**
```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'runs' 
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'runs';

-- Test foreign key constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='files';
```

#### Data Integrity
**Test Cases:**
- [ ] UUID generation and uniqueness
- [ ] Code and code_type preservation
- [ ] Progress update accuracy
- [ ] File association integrity

**Test Queries:**
```sql
-- Check UUID format
SELECT id, apify_run_id, code, code_type 
FROM runs 
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 5;

-- Verify code preservation
SELECT id, code, code_type, status, description 
FROM runs 
WHERE code IS NOT NULL 
ORDER BY started_at DESC 
LIMIT 10;

-- Check file associations
SELECT r.id, r.code, COUNT(f.id) as file_count 
FROM runs r 
LEFT JOIN files f ON r.id = f.run_uuid 
GROUP BY r.id, r.code 
ORDER BY r.started_at DESC;
```

### 4. APIFY Actor Testing

#### Actor Deployment
**Test Cases:**
- [ ] Actor deployment success
- [ ] Environment variable configuration
- [ ] GitHub integration
- [ ] Auto-deployment functionality

**Test Steps:**
```bash
# Check actor deployment
1. Push changes to GitHub main branch
2. Verify Apify detects changes
3. Check actor deployment status
4. Verify environment variables are set

# Test actor execution
1. Start a test run from web UI
2. Monitor actor logs in Apify dashboard
3. Check progress updates to web UI
4. Verify file generation and upload
```

#### Actor Functionality
**Test Cases:**
- [ ] Platform-specific scraping
- [ ] Progress update sending
- [ ] File upload to APIFY
- [ ] Error handling and reporting

**Test Scenarios:**
```javascript
// Test HR Cockpit scraping
1. Use code type: "HR_COCKPIT"
2. Monitor login process
3. Check report downloads
4. Verify progress descriptions

// Test Profiling Values scraping
1. Use code type: "PROFILING_VALUES"
2. Monitor navigation flow
3. Check report generation
4. Verify file uploads
```

## 🔄 Integration Testing

### 1. End-to-End Workflow

#### Complete Run Workflow
**Test Scenario:**
1. **User Input**: Enter code and select type
2. **Import**: Submit form and verify database record
3. **Actor Execution**: Monitor APIFY actor progress
4. **Progress Updates**: Verify real-time updates
5. **File Processing**: Check automatic file processing
6. **File Access**: Test file download functionality

**Expected Results:**
- [ ] Database record created with UUID
- [ ] Real-time progress updates work
- [ ] Files are processed and stored
- [ ] Download links are functional
- [ ] All UI components update correctly

### 2. Error Scenarios

#### Network Failures
**Test Cases:**
- [ ] APIFY API timeout
- [ ] Database connection failure
- [ ] Storage upload failure
- [ ] Frontend-backend communication failure

#### Data Validation
**Test Cases:**
- [ ] Invalid UUID format
- [ ] Missing required fields
- [ ] Invalid file types
- [ ] Malformed requests

### 3. Performance Testing

#### Load Testing
**Test Cases:**
- [ ] Multiple concurrent runs
- [ ] Large file processing
- [ ] Database query performance
- [ ] Real-time update handling

**Test Commands:**
```bash
# Test concurrent imports
for i in {1..5}; do
  curl -X POST "http://localhost:3000/api/import" \
    -H "Content-Type: application/json" \
    -d "{\"actorId\": \"HceSv1pj0Y3PZTMvG\", \"input\": {\"code\": \"TEST$i\", \"codeType\": \"HR_COCKPIT\"}}" &
done
wait
```

## 🔐 Security Testing

### 1. Authentication & Authorization
**Test Cases:**
- [ ] Actor secret validation
- [ ] API endpoint protection
- [ ] Database access control
- [ ] File access security

### 2. Data Protection
**Test Cases:**
- [ ] Environment variable security
- [ ] Sensitive data exposure
- [ ] Input sanitization
- [ ] SQL injection prevention

## 📊 Monitoring & Debugging

### 1. Log Analysis
**Key Log Sources:**
- **Vercel Function Logs**: API endpoint execution
- **Supabase Logs**: Database operations
- **APIFY Logs**: Actor execution
- **Browser Console**: Frontend errors

### 2. Debug Tools
**Development Tools:**
- **Browser DevTools**: Network, console, performance
- **Supabase Dashboard**: Database queries and logs
- **APIFY Dashboard**: Actor execution monitoring
- **Vercel Dashboard**: Function logs and analytics

### 3. Common Issues & Solutions

#### UUID Issues
**Problem**: Invalid UUID format in requests
**Solution**: Verify UUID generation and validation

#### Progress Update Failures
**Problem**: Updates not appearing in frontend
**Solution**: Check real-time subscriptions and database queries

#### File Processing Errors
**Problem**: Files not being processed
**Solution**: Verify APIFY integration and storage permissions

## 📋 Test Checklist

### Pre-Testing Setup
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] APIFY actor deployed
- [ ] Local development server running
- [ ] Test data prepared

### Core Functionality
- [ ] Import form works correctly
- [ ] Run history displays properly
- [ ] Real-time updates function
- [ ] File processing works
- [ ] Download functionality operational

### Error Handling
- [ ] Invalid inputs handled gracefully
- [ ] Network errors managed properly
- [ ] Database errors logged correctly
- [ ] User feedback provided appropriately

### Performance
- [ ] Page load times acceptable
- [ ] Real-time updates responsive
- [ ] File processing efficient
- [ ] Database queries optimized

### Security
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Data protected appropriately
- [ ] No sensitive data exposed

## 🚀 Production Testing

### Deployment Verification
1. **Environment Check**: Verify all environment variables
2. **Database Migration**: Confirm schema is current
3. **APIFY Integration**: Test actor deployment
4. **File Storage**: Verify bucket configuration

### Smoke Testing
1. **Basic Functionality**: Test core features
2. **Integration Points**: Verify external services
3. **Error Handling**: Test error scenarios
4. **Performance**: Check response times

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Current Implementation

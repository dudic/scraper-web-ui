# 🔧 File Processing Fix Plan

## 🚨 Issues Identified

### 1. APIFY Runs Missing Actor ID
**Problem**: All runs show `Actor: undefined`, preventing proper data storage
**Root Cause**: APIFY actors not properly configured or deployed
**Impact**: No datasets/key-value stores created

### 2. API Endpoint Not Found
**Problem**: 405/404 errors when calling file processing endpoint
**Root Cause**: Double slash in URL, possible deployment issue
**Impact**: File processing never triggered

### 3. Actor Configuration Issues
**Problem**: Actors not sending proper progress updates
**Root Cause**: Missing environment variables or incorrect configuration
**Impact**: No real-time updates to web UI

## 🔧 Step-by-Step Fixes

### Phase 1: Fix APIFY Actor Configuration

#### 1.1 Update Actor Environment Variables
```bash
# In APIFY actor settings, ensure these are set:
ACTOR_SECRET=your_shared_secret
FRONT_URL=https://scraper-web-ui.vercel.app
```

#### 1.2 Fix Actor Code
The actor needs to properly identify itself. Update the main.js:

```javascript
// Add this at the beginning of main.js
const runId = process.env.APIFY_ACTOR_RUN_ID;
const actorId = process.env.APIFY_ACTOR_ID;

console.log(`Actor ID: ${actorId}`);
console.log(`Run ID: ${runId}`);

// Ensure proper progress updates
await sendProgressUpdate({
  runId,
  actorId, // Add this
  done: 0,
  total: 1,
  status: 'STARTING'
});
```

#### 1.3 Verify Actor Deployment
- Ensure actor is properly deployed to APIFY
- Check that actor has correct environment variables
- Verify actor can access the web UI

### Phase 2: Fix API Endpoint Issues

#### 2.1 Fix URL Construction
In the actor-update route, fix the URL construction:

```typescript
// In app/api/actor-update/route.ts
const baseUrl = process.env.FRONT_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const fileProcessingUrl = `${baseUrl}/api/files/process/${runId}`;

fetch(fileProcessingUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

#### 2.2 Add Error Handling
Add better error handling to the file processing endpoint:

```typescript
// In app/api/files/process/[runId]/route.ts
export async function POST(request: NextRequest, { params }: { params: { runId: string } }) {
  try {
    console.log(`Processing files for run: ${params.runId}`);
    
    // Add validation
    if (!params.runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }
    
    // Rest of the code...
  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

### Phase 3: Database Schema Verification

#### 3.1 Verify Files Table
Run this SQL in Supabase:

```sql
-- Check if files table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'files'
);

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;

-- Check if storage bucket exists
SELECT name FROM storage.buckets WHERE name = 'scraper-files';
```

#### 3.2 Fix Migration Issues
The duplicate migration files (002) might cause issues. Rename them:

```bash
# Rename migrations to avoid conflicts
mv supabase/migrations/002_add_progress_fields.sql supabase/migrations/003_add_progress_fields.sql
```

### Phase 4: Testing and Verification

#### 4.1 Test Actor Deployment
1. Deploy updated actor to APIFY
2. Run a test execution
3. Verify run has proper actor ID
4. Check if dataset/key-value store are created

#### 4.2 Test API Endpoints
1. Test actor-update endpoint manually
2. Test file processing endpoint manually
3. Verify database updates
4. Check file storage

#### 4.3 Monitor Logs
1. Check Vercel function logs
2. Monitor APIFY run logs
3. Check Supabase logs

## 🧪 Testing Checklist

### Actor Testing
- [ ] Actor deploys successfully
- [ ] Actor has correct environment variables
- [ ] Actor can send progress updates
- [ ] Actor creates datasets/key-value stores
- [ ] Actor stores files properly

### API Testing
- [ ] actor-update endpoint receives requests
- [ ] File processing endpoint is triggered
- [ ] File processing completes successfully
- [ ] Files are stored in Supabase
- [ ] Database records are created

### Database Testing
- [ ] Files table exists and has correct structure
- [ ] Storage bucket exists and is accessible
- [ ] RLS policies are configured correctly
- [ ] File metadata is stored properly

## 🚀 Deployment Steps

1. **Update Actor Code**
   - Fix actor identification
   - Add proper error handling
   - Deploy to APIFY

2. **Update Web App**
   - Fix API endpoint issues
   - Add better error handling
   - Deploy to Vercel

3. **Verify Database**
   - Run schema verification
   - Check storage bucket
   - Test file operations

4. **Test End-to-End**
   - Run complete test execution
   - Verify file processing
   - Check user interface

## 📊 Success Metrics

- [ ] APIFY runs have proper actor ID
- [ ] Datasets and key-value stores are created
- [ ] File processing endpoint responds correctly
- [ ] Files are stored in Supabase storage
- [ ] Database records are created
- [ ] User can download files through UI

## 🔍 Monitoring

After fixes are deployed:
1. Monitor APIFY run logs
2. Check Vercel function logs
3. Monitor database operations
4. Track file processing success rates
5. Monitor storage usage

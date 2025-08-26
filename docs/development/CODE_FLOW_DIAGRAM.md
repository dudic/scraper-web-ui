# 🔄 Complete Code Flow: Frontend → Database

## 📋 **Step-by-Step Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND INPUT                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User Types in Input Field                                                │
│                                                                             │
│    <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} />
│                                                                             │
│    User types: "ABC123" → code state = "ABC123"                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Form Submission (ImportForm.tsx)                                         │
│                                                                             │
│    handleSubmit() function:                                                 │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // Prepare input object                                             │ │
│    │ let input = {}                                                      │ │
│    │ if (!useCustomInput) {                                              │ │
│    │   input = { code, codeType }  // code = "ABC123"                   │ │
│    │ }                                                                   │ │
│    │                                                                     │ │
│    │ // Send to API                                                      │ │
│    │ fetch('/api/import', {                                              │ │
│    │   method: 'POST',                                                   │ │
│    │   body: JSON.stringify({                                            │ │
│    │     actorId: 'HceSv1pj0Y3PZTMvG',                                  │ │
│    │     input: { code: "ABC123", codeType: "HR_COCKPIT" }              │ │
│    │   })                                                               │ │
│    │ })                                                                  │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. API Route Handler (app/api/import/route.ts)                             │
│                                                                             │
│    POST /api/import                                                        │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // 1. Parse request body                                            │ │
│    │ const { actorId, input } = await request.json()                     │ │
│    │ // input = { code: "ABC123", codeType: "HR_COCKPIT" }              │ │
│    │                                                                     │ │
│    │ // 2. Extract code values                                          │ │
│    │ const code = input?.code || null        // "ABC123"                │ │
│    │ const code_type = input?.codeType || null // "HR_COCKPIT"          │ │
│    │                                                                     │ │
│    │ // 3. Create database record with auto-generated UUID              │ │
│    │ const runData = {                                                   │ │
│    │   // id: NOT specified - Supabase auto-generates UUID              │ │
│    │   apify_run_id: null,              // Will be updated after Apify  │ │
│    │   code: code,                      // "ABC123"                     │ │
│    │   code_type: code_type,            // "HR_COCKPIT"                 │ │
│    │   pct: 0,                                                          │ │
│    │   status: 'STARTING',                                              │ │
│    │   description: 'Initializing...',                                  │ │
│    │   // ... other fields                                              │ │
│    │ }                                                                  │ │
│    │                                                                     │ │
│    │ const { data: insertedData } = await supabase                      │ │
│    │   .from('runs')                                                    │ │
│    │   .insert(runData)                                                 │ │
│    │   .select('id')  // Get the auto-generated UUID                    │ │
│    │                                                                     │ │
│    │ const runId = insertedData[0].id  // UUID like "550e8400-e29b..."  │ │
│    │                                                                     │ │
│    │ // 4. Start Apify run with UUID                                    │ │
│    │ const apifyInput = {                                               │ │
│    │   ...input,                                                        │ │
│    │   internalRunId: runId  // Pass UUID to Apify                     │ │
│    │ }                                                                  │ │
│    │                                                                     │ │
│    │ run = await client.actor(actorId).call(apifyInput)                │ │
│    │ // run.id = "abc123def456" (Apify run ID)                         │ │
│    │                                                                     │ │
│    │ // 5. Update record with Apify run ID                              │ │
│    │ await supabase                                                     │ │
│    │   .from('runs')                                                    │ │
│    │   .update({ apify_run_id: run.id })                               │ │
│    │   .eq('id', runId)  // Use UUID for identification                │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Database Storage (Supabase)                                             │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ INSERT INTO runs (id, apify_run_id, code, code_type, ...)         │ │
│    │ VALUES (gen_random_uuid(), NULL, 'ABC123', 'HR_COCKPIT', ...)     │ │
│    │                                                                     │ │
│    │ Result: New row in 'runs' table with:                              │ │
│    │ - id: '550e8400-e29b-41d4-a716-446655440000' (UUID)               │ │
│    │ - apify_run_id: NULL (initially)                                  │ │
│    │ - code: 'ABC123'                                                   │ │
│    │ - code_type: 'HR_COCKPIT'                                          │ │
│    │ - status: 'STARTING'                                               │ │
│    │                                                                     │ │
│    │ UPDATE runs SET apify_run_id = 'abc123def456'                     │ │
│    │ WHERE id = '550e8400-e29b-41d4-a716-446655440000'                 │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Apify Actor (unified-scraper-actor/src/main.js)                         │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // 1. Receive input with UUID                                       │ │
│    │ const { code, codeType, internalRunId } = input;                   │ │
│    │ const runId = internalRunId;  // UUID from web UI                  │ │
│    │                                                                     │ │
│    │ // 2. Send initial progress update                                 │ │
│    │ await sendProgressUpdate({                                          │ │
│    │   runId,  // UUID                                                   │ │
│    │   done: 0,                                                          │ │
│    │   total: 1,                                                         │ │
│    │   status: 'STARTING',                                               │ │
│    │   description: 'Initializing...'                                    │ │
│    │ });                                                                 │ │
│    │                                                                     │ │
│    │ // 3. Execute scraping logic                                        │ │
│    │ // ... scraping code ...                                           │ │
│    │                                                                     │ │
│    │ // 4. Send progress updates with UUID                              │ │
│    │ await sendProgressUpdate({                                          │ │
│    │   runId,  // UUID                                                   │ │
│    │   done: 2,                                                          │ │
│    │   total: 5,                                                         │ │
│    │   status: 'RUNNING',                                                │ │
│    │   description: 'Download Assessment-Report'                         │ │
│    │ });                                                                 │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. Progress Updates (app/api/actor-update/route.ts)                        │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // Apify sends progress updates                                    │ │
│    │ POST /api/actor-update                                             │ │
│    │ {                                                                   │ │
│    │   runId: "550e8400-e29b-41d4-a716-446655440000",  // UUID          │ │
│    │   done: 2,                                                          │ │
│    │   total: 5,                                                         │ │
│    │   status: "RUNNING",                                                │ │
│    │   description: "Download Assessment-Report"                         │ │
│    │ }                                                                   │ │
│    │                                                                     │ │
│    │ // CRITICAL: Look up by UUID only                                  │ │
│    │ const { data: currentRun } = await supabase                        │ │
│    │   .from('runs')                                                    │ │
│    │   .select('*')                                                     │ │
│    │   .eq('id', runId)  // Use UUID for lookup                         │ │
│    │   .single()                                                        │ │
│    │                                                                     │ │
│    │ // Update with new progress data                                   │ │
│    │ const runData = {                                                  │ │
│    │   id: runId,                                                       │ │
│    │   pct: 40,                                                         │ │
│    │   status: 'RUNNING',                                               │ │
│    │   done: 2,                                                         │ │
│    │   total: 5,                                                        │ │
│    │   description: 'Download Assessment-Report',                       │ │
│    │   // Preserve existing code and code_type                          │ │
│    │   code: currentRun.code,           // "ABC123"                     │ │
│    │   code_type: currentRun.code_type, // "HR_COCKPIT"                 │ │
│    │ }                                                                  │ │
│    │                                                                     │ │
│    │ await supabase.from('runs').upsert(runData, { onConflict: 'id' })  │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. Frontend Display (useRunList.ts + RunList.tsx)                          │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // 1. Fetch data from database                                      │ │
│    │ const { data } = await supabase                                      │ │
│    │   .from('runs')                                                      │ │
│    │   .select('*')  // Includes code, code_type, description           │ │
│    │   .order('started_at', { ascending: false })                        │ │
│    │                                                                     │ │
│    │ // 2. Data received:                                                │ │
│    │ data = [                                                            │ │
│    │   {                                                                 │ │
│    │     id: '550e8400-e29b-41d4-a716-446655440000',                    │ │
│    │     apify_run_id: 'abc123def456',                                  │ │
│    │     code: 'ABC123',                                                │ │
│    │     code_type: 'HR_COCKPIT',                                       │ │
│    │     status: 'RUNNING',                                             │ │
│    │     description: 'Download Assessment-Report',                     │ │
│    │     pct: 40,                                                       │ │
│    │     done: 2,                                                       │ │
│    │     total: 5,                                                      │ │
│    │     // ... other fields                                            │ │
│    │   }                                                                │ │
│    │ ]                                                                   │ │
│    │                                                                     │ │
│    │ // 3. Display in table                                              │ │
│    │ <td>{run.code || '-'}</td>         // Shows: "ABC123"              │ │
│    │ <td>{run.code_type || '-'}</td>    // Shows: "HR_COCKPIT"          │ │
│    │ <td>{run.description || '-'}</td>  // Shows: "Download Assessment-Report" │
│    │ <td>{run.pct}%</td>                // Shows: "40%"                 │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 **Debugging Points**

### **Point 1: Frontend Input**
```javascript
// Check if user input is captured
console.log('User entered code:', code);
console.log('User selected codeType:', codeType);
```

### **Point 2: API Request**
```javascript
// Check what's sent to API
console.log('Request body:', JSON.stringify({
  actorId,
  input: { code, codeType }
}));
```

### **Point 3: API Processing**
```javascript
// Check what API receives and processes
console.log('API received input:', input);
console.log('Extracted code:', code);
console.log('Extracted code_type:', code_type);
console.log('Auto-generated UUID:', runId);
```

### **Point 4: Database Insert**
```javascript
// Check what's inserted into database
console.log('Data to insert:', runData);
console.log('Insert result:', insertedData);
console.log('Generated UUID:', runId);
```

### **Point 5: Apify Integration**
```javascript
// Check what's sent to Apify
console.log('Apify input:', apifyInput);
console.log('UUID passed to Apify:', internalRunId);
```

### **Point 6: Progress Updates**
```javascript
// Check progress update data
console.log('Progress update received:', {
  runId, done, total, status, description
});
console.log('UUID used for lookup:', runId);
```

### **Point 7: Database Query**
```javascript
// Check what's retrieved from database
console.log('Database query result:', data);
```

### **Point 8: Frontend Display**
```javascript
// Check what frontend receives
console.log('Frontend received runs:', runs);
```

## 🚨 **Potential Failure Points**

1. **Frontend**: User doesn't enter code value
2. **API Request**: Network error or malformed request
3. **API Processing**: Code extraction fails
4. **Database Insert**: Database error or constraint violation
5. **UUID Generation**: Supabase UUID generation fails
6. **Apify Integration**: Apify API call fails
7. **Progress Updates**: UUID mismatch or database lookup fails
8. **Database Query**: Query doesn't include required columns
9. **Frontend Display**: Component doesn't render data correctly

## 🔧 **Quick Test**

To test the flow, add this temporary code to your ImportForm:

```javascript
// Add to handleSubmit before the fetch call
console.log('🔍 DEBUG - About to send:', {
  actorId,
  input: { code, codeType }
});
```

This will show you exactly what data is being sent to the API.

## 🚨 **Critical UUID Rules**

### ✅ **Correct Usage**
- **Always use Supabase UUID** (`id` field) for database operations
- **Pass UUID as `internalRunId`** to Apify actors
- **Use UUID for all progress updates**
- **Use UUID for file processing**

### ❌ **Forbidden Usage**
- **Never use Apify run ID** for database lookups
- **Never use Apify run ID** for database updates
- **Never mix UUID and Apify run ID** in the same operation
- **Never use `process.env.APIFY_ACTOR_RUN_ID`** for database operations

## 📊 **Data Flow Summary**

1. **Frontend** → User input captured
2. **Import API** → Creates record with auto-generated UUID
3. **Database** → Stores record with UUID and code values
4. **Apify** → Receives UUID and executes scraping
5. **Progress Updates** → Use UUID for all database operations
6. **Frontend** → Displays data using UUID-based queries

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Current Implementation


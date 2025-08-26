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
│    │ // 2. Start Apify run                                               │ │
│    │ run = await client.actor(actorId).call(input)                      │ │
│    │ // run.id = "abc123def456"                                         │ │
│    │                                                                     │ │
│    │ // 3. Extract code values                                          │ │
│    │ const code = input?.code || null        // "ABC123"                │ │
│    │ const code_type = input?.codeType || null // "HR_COCKPIT"          │ │
│    │                                                                     │ │
│    │ // 4. Insert into database                                          │ │
│    │ const runData = {                                                   │ │
│    │   id: run.id,                                                       │ │
│    │   code: code,                    // "ABC123"                       │ │
│    │   code_type: code_type,          // "HR_COCKPIT"                   │ │
│    │   pct: 0,                                                        │ │
│    │   status: 'RUNNING',                                             │ │
│    │   // ... other fields                                             │ │
│    │ }                                                                  │ │
│    │                                                                     │ │
│    │ await supabase.from('runs').insert(runData)                       │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Database Storage (Supabase)                                             │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ INSERT INTO runs (id, code, code_type, pct, status, ...)           │ │
│    │ VALUES ('abc123def456', 'ABC123', 'HR_COCKPIT', 0, 'RUNNING', ...) │ │
│    │                                                                     │ │
│    │ Result: New row in 'runs' table with:                              │ │
│    │ - id: 'abc123def456'                                               │ │
│    │ - code: 'ABC123'                                                   │ │
│    │ - code_type: 'HR_COCKPIT'                                          │ │
│    │ - status: 'RUNNING'                                                │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Progress Updates (app/api/actor-update/route.ts)                        │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // Apify sends progress updates                                    │ │
│    │ POST /api/actor-update                                             │ │
│    │ { runId: 'abc123def456', done: 5, total: 10, status: 'RUNNING' }   │ │
│    │                                                                     │ │
│    │ // CRITICAL: Preserve existing code values                          │ │
│    │ const currentRun = await supabase.from('runs').select('*').eq('id', runId).single()
│    │                                                                     │ │
│    │ const runData = {                                                   │ │
│    │   id: runId,                                                        │ │
│    │   pct: 50,                                                          │ │
│    │   status: 'RUNNING',                                                │ │
│    │   code: currentRun.code,           // PRESERVED: "ABC123"          │ │
│    │   code_type: currentRun.code_type, // PRESERVED: "HR_COCKPIT"      │ │
│    │   // ... other updated fields                                      │ │
│    │ }                                                                   │ │
│    │                                                                     │ │
│    │ await supabase.from('runs').upsert(runData, { onConflict: 'id' })  │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. Frontend Display (useRunList.ts + RunList.tsx)                          │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ // 1. Fetch data from database                                      │ │
│    │ const { data } = await supabase                                      │ │
│    │   .from('runs')                                                      │ │
│    │   .select('*')  // Includes code, code_type                         │ │
│    │   .order('started_at', { ascending: false })                        │ │
│    │                                                                     │ │
│    │ // 2. Data received:                                                │ │
│    │ data = [                                                            │ │
│    │   {                                                                 │ │
│    │     id: 'abc123def456',                                            │ │
│    │     code: 'ABC123',                                                │ │
│    │     code_type: 'HR_COCKPIT',                                       │ │
│    │     status: 'RUNNING',                                             │ │
│    │     // ... other fields                                            │ │
│    │   }                                                                │ │
│    │ ]                                                                   │ │
│    │                                                                     │ │
│    │ // 3. Display in table                                              │ │
│    │ <td>{run.code || '-'}</td>         // Shows: "ABC123"              │ │
│    │ <td>{run.code_type || '-'}</td>    // Shows: "HR_COCKPIT"          │ │
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
```

### **Point 4: Database Insert**
```javascript
// Check what's inserted into database
console.log('Data to insert:', runData);
console.log('Insert result:', insertedData);
```

### **Point 5: Database Query**
```javascript
// Check what's retrieved from database
console.log('Database query result:', data);
```

### **Point 6: Frontend Display**
```javascript
// Check what frontend receives
console.log('Frontend received runs:', runs);
```

## 🚨 **Potential Failure Points**

1. **Frontend**: User doesn't enter code value
2. **API Request**: Network error or malformed request
3. **API Processing**: Code extraction fails
4. **Database Insert**: Database error or constraint violation
5. **Progress Updates**: Code values overwritten during updates
6. **Database Query**: Query doesn't include code columns
7. **Frontend Display**: Component doesn't render code values

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


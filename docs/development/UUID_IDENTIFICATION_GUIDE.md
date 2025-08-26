# 🔑 UUID Identification Guide

## 🎯 Core Principle

**The Supabase UUID (auto-generated `id` field) is the ONLY identifier used for database operations. The Apify run ID is stored for reference but NEVER used to identify or update records.**

## 📊 Database Schema

### Runs Table Structure
```sql
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- ✅ PRIMARY KEY: Supabase UUID
  apify_run_id TEXT,                              -- 📝 REFERENCE ONLY: Apify run ID
  code TEXT,
  code_type TEXT,
  pct INTEGER DEFAULT 0,
  status TEXT DEFAULT 'STARTING',
  done INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Correct Data Flow

### 1. Import Route (`app/api/import/route.ts`)
```typescript
// ✅ Creates record with auto-generated UUID
const { data: insertedData } = await supabase
  .from('runs')
  .insert(runData)
  .select('id')

const runId = insertedData[0].id // Supabase UUID

// ✅ Passes UUID to Apify as internalRunId
const apifyInput = {
  ...input,
  internalRunId: runId // Supabase UUID
}

// ✅ Stores Apify run ID in apify_run_id column
await supabase
  .from('runs')
  .update({ apify_run_id: run.id })
  .eq('id', runId) // Uses UUID for identification
```

### 2. Apify Actor (`unified-scraper-actor/src/main.js`)
```javascript
// ✅ Receives and uses Supabase UUID
const { internalRunId } = input
const runId = internalRunId // Supabase UUID

// ✅ Passes UUID to all handlers
crawler.runId = runId

// ✅ Uses UUID for all progress updates
await sendProgressUpdate({
  runId, // Supabase UUID
  done: 0,
  total: 1,
  status: 'STARTING'
})
```

### 3. Actor Update Route (`app/api/actor-update/route.ts`)
```typescript
// ✅ ONLY uses UUID for database operations
const { data: currentRun } = await supabase
  .from('runs')
  .select('*')
  .eq('id', runId) // UUID lookup only
  .single()

// ✅ Updates using UUID
await supabase
  .from('runs')
  .update(runData)
  .eq('id', currentRun.id) // UUID identification
```

## ❌ Forbidden Operations

### Never Use Apify Run ID for Database Operations
```typescript
// ❌ WRONG - Don't do this
const { data } = await supabase
  .from('runs')
  .select('*')
  .eq('apify_run_id', runId) // Never use for lookups

// ❌ WRONG - Don't do this
await supabase
  .from('runs')
  .update(data)
  .eq('apify_run_id', runId) // Never use for updates
```

## 🔍 Verification Checklist

### ✅ Import Route
- [x] Creates records with auto-generated UUIDs
- [x] Passes UUID as `internalRunId` to Apify
- [x] Stores Apify run ID in `apify_run_id` column
- [x] Uses UUID for all database operations

### ✅ Apify Actor
- [x] Receives `internalRunId` (Supabase UUID)
- [x] Uses UUID for all progress updates
- [x] Passes UUID to all handlers
- [x] No references to `process.env.APIFY_ACTOR_RUN_ID`

### ✅ Actor Update Route
- [x] Only uses UUID (`id` field) for lookups
- [x] Only uses UUID for updates
- [x] Never uses `apify_run_id` for identification
- [x] Returns UUID in responses

### ✅ Handlers
- [x] Access `runId` from crawler context (UUID)
- [x] Use UUID for all progress updates
- [x] No direct database operations

## 🚨 Error Prevention

### Common Mistakes to Avoid
1. **Variable Shadowing**: Don't redefine `runId` in error handlers
2. **Dual Lookup**: Don't try to find records by both UUID and Apify run ID
3. **Environment Variables**: Don't use `process.env.APIFY_ACTOR_RUN_ID` for database operations
4. **Mixed Identifiers**: Don't mix UUID and Apify run ID in the same operation

### Correct Error Handling
```javascript
// ✅ CORRECT - Use original runId (UUID)
} catch (error) {
  if (runId) { // Original runId (Supabase UUID)
    await sendErrorUpdate({
      runId, // Supabase UUID
      error: error.message,
      log: console
    });
  }
}
```

## 📝 Summary

- **Supabase UUID**: Primary identifier for all database operations
- **Apify Run ID**: Reference only, stored in `apify_run_id` column
- **Progress Updates**: Always use Supabase UUID
- **Error Handling**: Never shadow the `runId` variable
- **Documentation**: Update examples to use correct approach

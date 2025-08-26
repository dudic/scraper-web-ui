# New Import Logic Implementation Summary

## Overview
We've implemented a new import logic that ensures the "Code" and "Code Type" values are immediately stored in the database and displayed in the frontend before any Apify actor updates occur.

## Key Changes

### 1. Database Schema Update
- **Migration**: `007_add_apify_run_id.sql`
- **New Column**: `apify_run_id TEXT` in the `runs` table
- **Purpose**: Separates internal primary key from Apify-generated run ID

### 2. Import Route Logic (`app/api/import/route.ts`)

#### New Flow:
1. **Extract Code Values**: Get `code` and `codeType` from user input
2. **Check Existing Records**: Look for existing record with same `code`/`code_type` combination
3. **Create Database Record**:
   - If existing record found: Use it
   - If no existing record: Create new record with temporary ID (`temp_${timestamp}_${random}`)
4. **Start Apify Actor**: Call Apify API to start the scraping process
5. **Update Record**: Update the database record with the actual Apify `runId` in `apify_run_id` field

#### Benefits:
- ✅ Code/Code Type values are stored immediately in database
- ✅ Frontend shows the run with correct values right away
- ✅ No race condition between import and actor updates
- ✅ Handles existing code/type combinations gracefully

### 3. Actor Update Route (`app/api/actor-update/route.ts`)

#### Updated Logic:
- **Lookup**: Find run record by `apify_run_id` (the ID sent by Apify)
- **Update**: Only update progress fields (`pct`, `status`, `done`, `total`, `error`)
- **Preserve**: Never touch `code` or `code_type` fields

#### Benefits:
- ✅ Code/Code Type values are never overwritten
- ✅ Progress updates work correctly with new schema
- ✅ Clean separation of concerns

## Database Migration Required

To apply the new schema, run this SQL in the Supabase dashboard:

```sql
-- Add apify_run_id column to store the actual Apify run ID
ALTER TABLE runs
ADD COLUMN apify_run_id TEXT;

COMMENT ON COLUMN runs.apify_run_id IS 'The actual run ID from Apify API, separate from the internal primary key';

-- Create index for efficient lookups by Apify run ID
CREATE INDEX idx_runs_apify_run_id ON runs(apify_run_id);
```

## Testing Steps

1. **Apply Migration**: Run the SQL above in Supabase dashboard
2. **Deploy Changes**: Push to Vercel (already done)
3. **Test Import**: Start a new import with code/type values
4. **Verify**: Check that code/type appear immediately in frontend
5. **Monitor**: Watch that progress updates work correctly

## Expected Behavior

### New Import:
- Code/Code Type appear immediately in frontend
- Database record created with temporary ID first
- Record updated with actual Apify run ID after actor starts
- Progress updates work normally

### Existing Code/Type Combination:
- If same code/type exists, reuse that record
- Update progress on existing record
- No duplicate records created

## Files Modified

- `app/api/import/route.ts` - New import logic
- `app/api/actor-update/route.ts` - Updated to work with apify_run_id
- `supabase/migrations/007_add_apify_run_id.sql` - Database migration
- `scripts/database/apply_apify_run_id_migration.sql` - Manual migration script

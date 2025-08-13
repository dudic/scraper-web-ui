# Supabase Legacy API Implementation Notes

## ⚠️ **Important: Legacy API Keys in Use**

**Date:** January 2025  
**Status:** Current implementation uses LEGACY Supabase API key handling

### **Current Setup:**
- **API Version:** Legacy Supabase API
- **Key Type:** Legacy anon public and service role keys
- **Implementation:** Based on older Supabase client patterns

### **Environment Variables Used:**
```bash
# Legacy Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Legacy anon public key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Legacy service role key
```

### **Supabase Client Usage:**
```javascript
// Current implementation (Legacy)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 🔄 **Future Migration Required:**

### **When Supabase Updates:**
- Supabase has announced new API key handling
- Current implementation will need migration
- New keys will have different format and handling

### **Migration Checklist (Future):**
- [ ] Update Supabase client library
- [ ] Generate new API keys from Supabase dashboard
- [ ] Update environment variables
- [ ] Test all database operations
- [ ] Update authentication patterns
- [ ] Verify real-time subscriptions still work

### **Files That Will Need Updates:**
- `app/api/import/route.ts` - Database writes
- `app/api/actor-update/route.ts` - Database updates
- `hooks/useRunProgress.ts` - Real-time subscriptions
- `hooks/useRunList.ts` - Database reads
- `components/*.tsx` - Any direct Supabase usage

## 📋 **Current Database Schema:**
```sql
-- Legacy implementation uses this schema
CREATE TABLE runs (
  id         TEXT PRIMARY KEY,      -- Apify runId
  pct        INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'RUNNING',
  done       INTEGER DEFAULT 0,     -- Number of completed items
  total      INTEGER DEFAULT 0,     -- Total number of items
  error      TEXT,                  -- Error message if failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚨 **Important Notes:**

1. **Do NOT update Supabase client library** until migration is planned
2. **Keep current API keys secure** - they're working with legacy system
3. **Document any new Supabase features** that require migration
4. **Test thoroughly** when migration is performed

## 🔗 **Related Documentation:**
- `DEBUGGING_GUIDE.md` - Current debugging procedures
- `README.md` - Main project documentation
- `env.example` - Environment variable template

---
**Last Updated:** January 2025  
**Maintained By:** Development Team  
**Priority:** Medium (Monitor for Supabase updates)

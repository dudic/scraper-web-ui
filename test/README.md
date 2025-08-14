# Test Files

This folder contains various test and debugging scripts used during development to troubleshoot the file processing system.

## Test Files Overview

### Database Tests
- **`verify-database.js`** - Verifies Supabase database schema, tables, and storage buckets
- **`check-runs.js`** - Lists all runs from the database with their status
- **`check-specific-run.js`** - Checks details of a specific run by ID
- **`check-run-data.js`** - Analyzes run data structure and relationships

### API Tests
- **`test-api-endpoint.js`** - Tests the file processing API endpoint on production
- **`test-preview-api.js`** - Tests the file processing API on preview deployment
- **`test-preview-deployment.js`** - Tests preview deployment accessibility
- **`test-local-api.js`** - Tests local API endpoint
- **`test-correct-run.js`** - Tests API with the specific working run ID
- **`test-real-run.js`** - Tests API with real run IDs from database

### Apify Integration Tests
- **`debug-apify-connection.js`** - Tests Apify API connection and authentication
- **`debug-apify-run.js`** - Analyzes Apify run details and associated resources
- **`test-apify-actor.js`** - Tests Apify actor functionality
- **`test-key-value-store.js`** - Tests access to Apify Key-Value Store and file retrieval
- **`test-completed-run.js`** - Tests completed run processing

### File Processing Tests
- **`debug-file-processing.js`** - Comprehensive test of the entire file processing pipeline

## Usage

To run any test file:

```bash
node test/[filename].js
```

## Environment Variables Required

Most test files require these environment variables (from `.env.local`):
- `APIFY_TOKEN` - Apify API token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FRONT_URL` - Frontend URL for API testing

## Notes

- These files were created during debugging sessions to isolate and fix issues
- Some files contain hardcoded IDs specific to test runs
- Files are kept for reference and future debugging needs
- Not all files may be currently functional as they were created for specific debugging scenarios

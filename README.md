# Scraper Dashboard

A real-time web scraping dashboard built with Next.js, Supabase, and Apify. This application provides a beautiful interface for starting scraping runs and monitoring their progress in real-time.

**Version**: 2.0.0 - UUID-based Architecture & Enhanced Progress Tracking

## Features

- 🚀 **Real-time Progress Tracking**: Live progress updates using Supabase Realtime
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 📊 **Run History**: Complete history of all scraping runs
- 📁 **File Storage & Downloads**: Secure file storage with easy download access
- 🔐 **Secure**: API authentication for actor callbacks
- ☁️ **Serverless**: Built for Vercel deployment
- 📱 **Responsive**: Works on desktop and mobile devices

## Architecture

```
┌─────────────────────────┐       ┌──── real-time row updates ────┐
│ 1️⃣ Next.js front-end   │◄─────┘                                │
│    (Vercel)             │                                        │
└─────────┬───────────────┘                                        │
          │ REST: /api/import  /api/actor-update (callbacks)      ▼
          ▼                                                ┌────────────────────┐
┌─────────────────────────┐  writes / updates rows         │ 3️⃣ Supabase DB    │
│ 2️⃣ Vercel Functions    │ ──────────────────────────────►│    Postgres        │
│    (Serverless)         │                                │    Realtime        │
│   • import              │                                │    Storage bucket  │
│   • actor-update        │                                └─────────┬──────────┘
└─────────┬───────────────┘                                          │ signed URLs
          │ start run / receive progress                            ▼
          ▼                                                ┌────────────────────┐
┌─────────────────────────┐  POST /api/actor-update        │ 5️⃣ Files in bucket│
│ 4️⃣ Apify Actor run     │  {runId, done, total}          │    docs/run-id/*   │
│    (scraper container)  │                                └────────────────────┘
└─────────────────────────┘
```

## ⚠️ **Important Note: Legacy Supabase API**

This project currently uses **Legacy Supabase API keys**. See `SUPABASE_LEGACY_NOTES.md` for important details about the current implementation and future migration requirements.

## 🔐 Security Status

**Current Implementation**: Basic authentication for actor endpoints
- ✅ **Actor Authentication**: Bearer token required for `/api/actor-update` and file processing endpoints
- ⚠️ **Public Endpoints**: Import and delete endpoints are currently public (see [Security Improvements](./docs/SECURITY_IMPROVEMENTS.md) for enhancement roadmap)
- ✅ **Database Security**: Row-level security policies configured
- ✅ **File Security**: Private storage with signed URLs

**Security Enhancements Planned**: See [SECURITY_IMPROVEMENTS.md](./docs/SECURITY_IMPROVEMENTS.md) for detailed security roadmap and implementation plans.

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd scraper-web-ui
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```sql
   -- Copy the contents of supabase/migrations/001_create_runs_table.sql
   ```
3. Enable Realtime for the `runs` table:
   - Go to Database > Replication
   - Enable realtime for the `runs` table

**Migration Status**: All migrations (001-011) are required for the current v2.0.0 implementation. See [CURRENT_SCHEMA.md](./docs/database/CURRENT_SCHEMA.md) for complete database schema documentation.

### 3. Configure Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `APIFY_TOKEN`: Your Apify API token
- `ACTOR_SECRET`: A shared secret for actor authentication
- `FRONT_URL`: Your Vercel app URL (for production)

Optional file processing variables:
- `FILE_PROCESSING_TIMEOUT`: File processing timeout in milliseconds (default: 300000)
- `MAX_CONCURRENT_DOWNLOADS`: Maximum concurrent file downloads (default: 5)
- `SIGNED_URL_EXPIRY`: Signed URL expiry time in seconds (default: 3600)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

### Configure Apify Actor

In your Apify actor, add these environment variables:
- `ACTOR_SECRET`: Same value as in your Vercel environment
- `FRONT_URL`: Your Vercel app URL

Add this code to your actor to send progress updates:

```javascript
// After each file is processed
await fetch(`${process.env.FRONT_URL}/api/actor-update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ACTOR_SECRET}`,
  },
  body: JSON.stringify({ 
    runId: process.env.APIFY_ACTOR_RUN_ID, 
    done: processedCount, 
    total: totalCount,
    status: 'RUNNING'
  }),
});

// On completion
await fetch(`${process.env.FRONT_URL}/api/actor-update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ACTOR_SECRET}`,
  },
  body: JSON.stringify({ 
    runId: process.env.APIFY_ACTOR_RUN_ID, 
    done: totalCount, 
    total: totalCount,
    status: 'COMPLETED'
  }),
});

// On error
await fetch(`${process.env.FRONT_URL}/api/actor-update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ACTOR_SECRET}`,
  },
  body: JSON.stringify({ 
    runId: process.env.APIFY_ACTOR_RUN_ID, 
    status: 'FAILED',
    error: errorMessage
  }),
});
```

## API Endpoints

### POST /api/import
Starts a new scraping run.

**Request:**
```json
{
  "actorId": "your-actor-id",
  "input": {
    "startUrls": ["https://example.com"]
  }
}
```

**Response:**
```json
{
  "runId": "abc123"
}
```

### POST /api/actor-update
Receives progress updates from Apify actors.

**Headers:**
```
Authorization: Bearer your-actor-secret
```

**Request:**
```json
{
  "runId": "abc123",
  "done": 5,
  "total": 10,
  "status": "RUNNING",
  "error": "Error message (optional)"
}
```

**Supported Status Values:**
- `STARTING` - Actor is starting up
- `RUNNING` - Actor is processing
- `COMPLETED` - Actor finished successfully (auto-converted to SUCCEEDED)
- `FAILED` - Actor encountered an error

### File Management Endpoints

#### POST /api/files/process/{runId}
Processes files from APIFY for a completed run.

**Headers:**
```
Authorization: Bearer your-actor-secret
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

#### GET /api/files/{runId}
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

#### GET /api/files/{fileId}/download
Generates a signed download URL for a specific file.

**Response:**
```json
{
  "downloadUrl": "https://...",
  "expiresAt": "2025-01-15T11:30:00Z"
}
```

## Database Schema

### Runs Table
```sql
CREATE TABLE runs (
  id         TEXT PRIMARY KEY,      -- Apify runId
  pct        INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'RUNNING',
  done       INTEGER DEFAULT 0,     -- Number of completed items
  total      INTEGER DEFAULT 0,     -- Total number of items
  error      TEXT,                  -- Error message if failed
  file_count INTEGER DEFAULT 0,     -- Number of files associated with run
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

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

## Development

### Project Structure

```
scraper-web-ui/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── files/         # File management endpoints
│   │   ├── import/        # Import functionality
│   │   └── actor-update/  # Actor progress updates
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ImportForm.tsx    # Form to start imports
│   ├── RunProgress.tsx   # Progress display
│   ├── RunList.tsx       # Run history table
│   ├── FileList.tsx      # File management UI
│   └── FileDownload.tsx  # File download component
├── hooks/                # Custom React hooks
│   ├── useRunProgress.ts # Real-time progress hook
│   ├── useRunList.ts     # Run list hook
│   ├── useFileList.ts    # File list hook
│   └── useFileDownload.ts # File download hook
├── lib/                  # Utility libraries
│   ├── apify.ts          # APIFY integration
│   ├── fileProcessor.ts  # File processing logic
│   └── supabaseStorage.ts # Supabase storage utilities
├── types/                # TypeScript type definitions
│   └── file.ts           # File-related types
├── supabase/             # Database migrations
└── public/              # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## File Storage Features

The Scraper Dashboard includes comprehensive file storage and download capabilities:

### How It Works
1. **APIFY Integration**: Files are downloaded from APIFY Key-Value Store
2. **Secure Storage**: Files are stored in Supabase Storage with private access
3. **Easy Access**: Users can download files through secure signed URLs
4. **Real-time Updates**: File processing status is updated in real-time

### File Types Supported
- PDF documents
- CSV data files
- JSON reports
- Excel spreadsheets
- Word documents

### Security Features
- Private storage bucket
- Time-limited download URLs
- File type validation
- Size restrictions (100MB max)

For detailed implementation information, see:
- [FILE_STORAGE_FEATURES.md](./FILE_STORAGE_FEATURES.md) - Complete feature documentation
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API reference
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Development roadmap

**Additional Documentation**:
- [🔐 Security Improvements](./docs/SECURITY_IMPROVEMENTS.md) - Security roadmap and implementation plans
- [📁 File Storage Features](./docs/development/FILE_STORAGE_FEATURES.md) - Detailed file management documentation
- [🗺️ Implementation Roadmap](./docs/development/IMPLEMENTATION_ROADMAP.md) - Development planning and timelines

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 
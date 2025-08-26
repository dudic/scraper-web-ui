# Scraper Dashboard

A real-time web scraping dashboard built with Next.js, Supabase, and Apify. This application provides a beautiful interface for starting scraping runs and monitoring their progress in real-time with comprehensive file management capabilities.

## Features

- 🚀 **Real-time Progress Tracking**: Live progress updates using Supabase Realtime
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 📊 **Run History**: Complete history of all scraping runs with UUID-based identification
- 📁 **File Storage & Downloads**: Secure file storage with automatic content type detection
- 🔐 **Secure**: API authentication for actor callbacks
- ☁️ **Serverless**: Built for Vercel deployment
- 📱 **Responsive**: Works on desktop and mobile devices
- 🗑️ **Run Management**: Delete runs and associated files
- 📋 **Progress Descriptions**: Real-time step descriptions from APIFY actors
- 🎯 **File Type Detection**: Automatic detection of PDF, CSV, JSON, Office documents

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
│   • file processing     │                                          │ signed URLs
└─────────┬───────────────┘                                          ▼
          │ start run / receive progress                ┌────────────────────┐
          ▼                                            │ 5️⃣ Files in bucket│
┌─────────────────────────┐  POST /api/actor-update    │    docs/run-id/*   │
│ 4️⃣ Apify Actor run     │  {UUID, done, total, desc} │                   │
│    (scraper container)  │                            └────────────────────┘
└─────────────────────────┘
```

## ⚠️ **Important Note: UUID-Based Implementation**

This project uses **Supabase-generated UUIDs** for all database operations. The Apify run ID is stored for reference only. See [UUID_IDENTIFICATION_GUIDE.md](./docs/development/UUID_IDENTIFICATION_GUIDE.md) for critical implementation details.

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd scraper-web-ui
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migrations in order:
   ```sql
   -- Run migrations 001-011 from supabase/migrations/
   -- See docs/database/CURRENT_SCHEMA.md for current schema
   ```
3. Enable Realtime for the `runs` and `files` tables:
   - Go to Database > Replication
   - Enable realtime for both tables

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
- `HR_COCKPIT_USER`: HR Cockpit username
- `HR_COCKPIT_PASSWORD`: HR Cockpit password
- `PROFILING_VALUES_USER`: Profiling Values username
- `PROFILING_VALUES_PASSWORD`: Profiling Values password

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
    runId: internalRunId, // Supabase UUID, not Apify run ID
    done: processedCount, 
    total: totalCount,
    status: 'RUNNING',
    description: 'Current step description'
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
    runId: internalRunId, // Supabase UUID
    done: totalCount, 
    total: totalCount,
    status: 'SUCCEEDED',
    description: 'Completed'
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
    runId: internalRunId, // Supabase UUID
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
  "actorId": "HceSv1pj0Y3PZTMvG",
  "input": {
    "code": "ABC123",
    "codeType": "HR_COCKPIT"
  }
}
```

**Response:**
```json
{
  "runId": "550e8400-e29b-41d4-a716-446655440000"
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
  "runId": "550e8400-e29b-41d4-a716-446655440000",
  "done": 5,
  "total": 10,
  "status": "RUNNING",
  "description": "Download Assessment-Report",
  "error": "Error message (optional)"
}
```

**Supported Status Values:**
- `STARTING` - Actor is starting up
- `RUNNING` - Actor is processing
- `SUCCEEDED` - Actor finished successfully
- `FAILED` - Actor encountered an error

### DELETE /api/runs/{runId}
Deletes a run and all associated files.

**Response:**
```json
{
  "success": true,
  "message": "Run and associated files deleted successfully",
  "deletedFiles": 3
}
```

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
      "id": "550e8400-e29b-41d4-a716-446655440001",
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apify_run_id TEXT,
  code TEXT,
  code_type TEXT,
  pct INTEGER DEFAULT 0,
  status TEXT DEFAULT 'STARTING',
  done INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  error TEXT,
  description TEXT,
  file_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Files Table
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT,                    -- Legacy column (deprecated)
  run_uuid UUID,                  -- Current UUID reference
  apify_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT,
  supabase_path TEXT,
  download_url TEXT,
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
│   │   ├── actor-update/  # Actor progress updates
│   │   └── runs/          # Run management endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ImportForm.tsx    # Form to start imports
│   ├── RunList.tsx       # Run history table
│   ├── FileList.tsx      # File management UI
│   └── FileDetailsModal.tsx # File details modal
├── hooks/                # Custom React hooks
│   ├── useRunList.ts     # Run list hook
│   └── useFileList.ts    # File list hook
├── lib/                  # Utility libraries
│   └── apify.ts          # APIFY integration
├── utils/                # Utility functions
│   └── fileTypeDetection.ts # File type detection
├── supabase/             # Database migrations
└── unified-scraper-actor/ # APIFY actor code
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
2. **Content Type Detection**: Automatic detection of file types (PDF, CSV, JSON, etc.)
3. **Secure Storage**: Files are stored in Supabase Storage with private access
4. **Easy Access**: Users can download files through secure signed URLs
5. **Real-time Updates**: File processing status is updated in real-time

### File Types Supported
- PDF documents
- CSV data files
- JSON reports
- Excel spreadsheets (XLSX, XLS)
- Word documents (DOCX, DOC)
- PowerPoint presentations (PPTX, PPT)
- Plain text files (TXT)
- XML files
- HTML files

### Security Features
- Private storage bucket
- Time-limited download URLs
- File type validation
- Size restrictions (100MB max)

## Documentation

For detailed documentation, see the `docs/` directory:

- [📋 Architecture Overview](./docs/ARCHITECTURE_OVERVIEW.md) - System architecture and components
- [🗄️ Current Database Schema](./docs/database/CURRENT_SCHEMA.md) - Database structure and relationships
- [🔌 API Endpoints](./docs/api/API_ENDPOINTS.md) - Complete API reference
- [🚀 Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md) - Deployment instructions
- [🧪 Testing Guide](./docs/TESTING_GUIDE.md) - Testing procedures and tools
- [🔄 Code Flow Diagram](./docs/development/CODE_FLOW_DIAGRAM.md) - Data flow and component interactions
- [🔑 UUID Identification Guide](./docs/development/UUID_IDENTIFICATION_GUIDE.md) - Critical UUID usage guidelines

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 
# Scraper Dashboard

A real-time web scraping dashboard built with Next.js, Supabase, and Apify. This application provides a beautiful interface for starting scraping runs and monitoring their progress in real-time.

## Features

- 🚀 **Real-time Progress Tracking**: Live progress updates using Supabase Realtime
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 📊 **Run History**: Complete history of all scraping runs
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

## Database Schema

```sql
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

## Development

### Project Structure

```
scraper-web-ui/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ImportForm.tsx    # Form to start imports
│   ├── RunProgress.tsx   # Progress display
│   └── RunList.tsx       # Run history table
├── hooks/                # Custom React hooks
│   ├── useRunProgress.ts # Real-time progress hook
│   └── useRunList.ts     # Run list hook
├── supabase/             # Database migrations
└── public/              # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 
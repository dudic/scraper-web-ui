# 🚀 Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the Scraper Dashboard with file storage features to production environments.

## 🏗️ Prerequisites

### Required Accounts
- [Vercel](https://vercel.com) - Hosting platform
- [Supabase](https://supabase.com) - Database and storage
- [APIFY](https://apify.com) - Web scraping platform

### Required Tools
- [Git](https://git-scm.com) - Version control
- [Node.js](https://nodejs.org) (v18+) - Runtime environment
- [npm](https://npmjs.com) or [yarn](https://yarnpkg.com) - Package manager

## 🔧 Environment Setup

### 1. Supabase Project Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and region
4. Set project name (e.g., "scraper-dashboard")
5. Set database password
6. Click "Create new project"

#### Database Configuration
1. Go to SQL Editor in Supabase dashboard
2. Run the initial migration:

```sql
-- Create runs table
CREATE TABLE runs (
  id         TEXT PRIMARY KEY,
  pct        INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'RUNNING',
  done       INTEGER DEFAULT 0,
  total      INTEGER DEFAULT 0,
  error      TEXT,
  file_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  apify_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT,
  supabase_path TEXT,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_runs_started_at ON runs(started_at DESC);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_files_run_id ON files(run_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_content_type ON files(content_type);

-- Enable RLS
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on runs" ON runs FOR ALL USING (true);
CREATE POLICY "Allow read access to files" ON files FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON files FOR ALL USING (auth.role() = 'service_role');
```

#### Storage Configuration
1. Go to Storage in Supabase dashboard
2. Click "Create a new bucket"
3. Set bucket name: `scraper-files`
4. Set access: `Private`
5. Click "Create bucket"

#### Storage Policies
1. Go to Storage > Policies
2. Add policy for `scraper-files` bucket:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scraper-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'scraper-files' AND auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL USING (bucket_id = 'scraper-files' AND auth.role() = 'service_role');
```

#### Enable Realtime
1. Go to Database > Replication
2. Enable realtime for `runs` table
3. Enable realtime for `files` table

### 2. APIFY Configuration

#### Get API Token
1. Go to [apify.com](https://apify.com)
2. Sign in to your account
3. Go to Account Settings > Integrations
4. Copy your API token

#### Configure Actor
1. Go to your APIFY actor
2. Add environment variables:
   - `ACTOR_SECRET`: Your shared secret for authentication
   - `FRONT_URL`: Your Vercel app URL

### 3. Vercel Project Setup

#### Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Environment Variables
Add the following environment variables in Vercel:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# APIFY Configuration
APIFY_TOKEN=your_apify_token

# Actor Configuration
ACTOR_SECRET=your_shared_secret_for_actor_authentication
FRONT_URL=https://your-app.vercel.app

# File Processing Configuration
FILE_PROCESSING_TIMEOUT=300000
MAX_CONCURRENT_DOWNLOADS=5
SIGNED_URL_EXPIRY=3600
```

## 🚀 Deployment Steps

### Step 1: Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/scraper-web-ui.git
cd scraper-web-ui

# Install dependencies
npm install

# Create environment file
cp env.example .env.local

# Edit environment variables
nano .env.local

# Run development server
npm run dev
```

### Step 2: Database Migration

```bash
# Run database migrations
# (This is done through Supabase dashboard SQL editor)
```

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 4: Configure Domain (Optional)

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Configure DNS records

## 🔍 Verification Steps

### 1. Database Connection
```bash
# Test database connection
curl -X GET "https://your-app.vercel.app/api/health"
```

### 2. File Storage
```bash
# Test file processing (after a run completes)
curl -X POST "https://your-app.vercel.app/api/files/process/{runId}" \
  -H "Authorization: Bearer your-actor-secret"
```

### 3. APIFY Integration
```bash
# Test APIFY connection
curl -X POST "https://your-app.vercel.app/api/import" \
  -H "Content-Type: application/json" \
  -d '{"actorId": "your-actor-id", "input": {"code": "test", "codeType": "HR_COCKPIT"}}'
```

## 🔧 Configuration Options

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes | - |
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | - |
| `APIFY_TOKEN` | APIFY API token | Yes | - |
| `ACTOR_SECRET` | Shared secret for actors | Yes | - |
| `FRONT_URL` | Vercel app URL | Yes | - |
| `FILE_PROCESSING_TIMEOUT` | File processing timeout (ms) | No | 300000 |
| `MAX_CONCURRENT_DOWNLOADS` | Max concurrent downloads | No | 5 |
| `SIGNED_URL_EXPIRY` | Signed URL expiry (seconds) | No | 3600 |

### Supabase Configuration

#### Storage Bucket Settings
- **Name**: `scraper-files`
- **Public**: `false`
- **File Size Limit**: `100MB`
- **Allowed MIME Types**: PDF, CSV, JSON, XLSX, DOCX

#### Database Settings
- **Connection Pooling**: Enabled
- **Row Level Security**: Enabled
- **Realtime**: Enabled for runs and files tables

## 🔐 Security Configuration

### CORS Settings
Configure CORS in your Next.js app:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### Rate Limiting
Implement rate limiting for API endpoints:

```javascript
// lib/rateLimit.js
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
})
```

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Enable Vercel Analytics in dashboard
2. Monitor performance metrics
3. Track user interactions

### Supabase Monitoring
1. Monitor database performance
2. Track storage usage
3. Monitor API usage

### APIFY Monitoring
1. Monitor actor performance
2. Track API usage
3. Monitor file processing

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check Supabase connection
curl -X GET "https://your-project-id.supabase.co/rest/v1/runs?select=count"
```

#### File Processing Failures
```bash
# Check file processing logs
curl -X GET "https://your-app.vercel.app/api/files/{runId}"
```

#### APIFY Integration Issues
```bash
# Test APIFY token
curl -H "Authorization: Bearer your-apify-token" \
  "https://api.apify.com/v2/users/me"
```

### Debug Commands

#### Check Environment Variables
```bash
# Verify environment variables are set
vercel env ls
```

#### Test API Endpoints
```bash
# Test import endpoint
curl -X POST "https://your-app.vercel.app/api/import" \
  -H "Content-Type: application/json" \
  -d '{"actorId": "test", "input": {}}'

# Test file processing
curl -X POST "https://your-app.vercel.app/api/files/process/test" \
  -H "Authorization: Bearer your-actor-secret"
```

#### Monitor Logs
```bash
# View Vercel logs
vercel logs

# View function logs
vercel logs --function api/import
```

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Deploy updates
vercel --prod
```

### Database Migrations
```bash
# Run new migrations in Supabase dashboard
# Update environment variables if needed
# Test functionality
```

### Monitoring Updates
1. Check Vercel deployment status
2. Monitor Supabase performance
3. Verify APIFY integration
4. Test file processing

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [APIFY Documentation](https://docs.apify.com)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

### Getting Help
1. Check the troubleshooting section
2. Review error logs
3. Test with minimal configuration
4. Contact support if needed

### Useful Links
- [Project Issues](https://github.com/your-username/scraper-web-ui/issues)
- [Documentation](https://github.com/your-username/scraper-web-ui/docs)
- [Discussions](https://github.com/your-username/scraper-web-ui/discussions)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Planning Phase

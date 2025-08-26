# 🏗️ Architecture Overview

## 📋 System Overview

The Scraper Dashboard is a comprehensive web application that orchestrates web scraping operations through APIFY actors, manages file storage, and provides real-time progress tracking. The system uses a modern, scalable architecture with clear separation of concerns.

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                 │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Import Form   │  │   Run History   │  │   File Manager  │            │
│  │   (React)       │  │   (React)       │  │   (React)       │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WEB API LAYER                                  │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Import API    │  │ Actor Update    │  │  File Process   │            │
│  │   (Next.js)     │  │   API (Next.js) │  │   API (Next.js) │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Supabase DB   │  │ Supabase Storage│  │   APIFY API     │            │
│  │   (PostgreSQL)  │  │   (File Store)  │  │  (Scraping)     │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Component Architecture

### 1. Frontend Layer (Next.js + React)

#### Core Components
- **`ImportForm.tsx`**: User interface for starting new scraping runs
- **`RunList.tsx`**: Displays run history with real-time updates
- **`FileList.tsx`**: Manages file downloads and previews
- **`FileDetailsModal.tsx`**: Detailed file information and actions

#### Custom Hooks
- **`useRunList.ts`**: Manages run data fetching and real-time subscriptions
- **`useFileList.ts`**: Handles file data and download operations
- **`useRunProgress.ts`**: Real-time progress tracking (deprecated)

#### Key Features
- **Real-time Updates**: Supabase Realtime for live progress updates
- **File Type Detection**: Dynamic file icons based on content type
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error states and user feedback

### 2. API Layer (Next.js API Routes)

#### Core Endpoints
- **`/api/import`**: Initiates new scraping runs
- **`/api/actor-update`**: Receives progress updates from APIFY actors
- **`/api/files/process/{runId}`**: Processes files from completed runs
- **`/api/files/{runId}`**: Lists files for a specific run
- **`/api/files/{fileId}/download`**: Generates signed download URLs
- **`/api/runs/{runId}`**: Deletes runs and associated files

#### Key Features
- **UUID-Based Identification**: All operations use Supabase-generated UUIDs
- **Authentication**: Bearer token authentication for actor endpoints
- **Error Handling**: Comprehensive error responses and logging
- **File Processing**: Automatic content type detection and storage

### 3. Data Layer

#### Database (Supabase PostgreSQL)
- **`runs` Table**: Stores run metadata and progress information
- **`files` Table**: Manages file metadata and storage references
- **Indexes**: Optimized for common query patterns
- **RLS Policies**: Row-level security for data access control

#### Storage (Supabase Storage)
- **`scraper-files` Bucket**: Private file storage with signed URLs
- **File Organization**: Organized by run UUID for easy management
- **Content Type Support**: PDF, CSV, JSON, Office documents, text files

#### External Services
- **APIFY Platform**: Web scraping execution and file storage
- **APIFY Key-Value Store**: Temporary file storage during scraping

### 4. APIFY Actor Layer

#### Unified Scraper Actor
- **`main.js`**: Entry point and orchestration
- **`routes.js`**: Request routing and handler selection
- **`handlers/`**: Specialized scraping logic for different platforms
- **`utils/`**: Progress tracking and logging utilities

#### Supported Platforms
- **HR Cockpit**: Standard and Soll profile scraping
- **Profiling Values**: Report generation and PAT data extraction

#### Key Features
- **Progress Tracking**: Real-time updates to web UI
- **Error Handling**: Comprehensive error reporting
- **File Management**: Automatic file upload and processing
- **Retry Logic**: Robust error recovery mechanisms

## 🔄 Data Flow

### 1. Run Creation Flow
```
User Input → Import Form → Import API → Database (UUID) → APIFY Actor → Progress Updates
```

### 2. Progress Update Flow
```
APIFY Actor → Actor Update API → Database (UUID) → Real-time → Frontend
```

### 3. File Processing Flow
```
APIFY Completion → File Process API → APIFY Storage → Supabase Storage → Database
```

### 4. File Access Flow
```
User Request → File API → Signed URL → Supabase Storage → File Download
```

## 🔐 Security Architecture

### Authentication & Authorization
- **API Authentication**: Bearer token for actor endpoints
- **Database Security**: Row-level security policies
- **Storage Security**: Private buckets with signed URLs
- **CORS Configuration**: Controlled cross-origin access

### Data Protection
- **Environment Variables**: Secure credential management
- **Input Validation**: Comprehensive request validation
- **Error Handling**: No sensitive data exposure in errors
- **Rate Limiting**: Protection against abuse

## 📊 Performance Architecture

### Optimization Strategies
- **Database Indexing**: Optimized for common query patterns
- **Real-time Subscriptions**: Efficient data synchronization
- **File Streaming**: Large file handling without memory issues
- **Caching**: Signed URL caching for improved performance

### Scalability Considerations
- **Stateless API**: Horizontal scaling capability
- **Database Connection Pooling**: Efficient resource utilization
- **File Storage**: Distributed storage with CDN capabilities
- **APIFY Integration**: Cloud-based scraping infrastructure

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React hooks with Supabase Realtime

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

### External Services
- **Scraping**: APIFY Platform
- **Deployment**: Vercel
- **Version Control**: GitHub
- **Monitoring**: Vercel Analytics

## 🔍 Monitoring & Observability

### Logging
- **Application Logs**: Vercel function logs
- **Database Logs**: Supabase dashboard
- **APIFY Logs**: Actor execution logs
- **Error Tracking**: Comprehensive error logging

### Metrics
- **Performance**: Vercel Analytics
- **Database**: Supabase monitoring
- **Storage**: File usage tracking
- **APIFY**: Actor performance metrics

## 🚀 Deployment Architecture

### Production Environment
- **Web UI**: Vercel (global CDN)
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage (distributed)
- **APIFY**: Cloud-based actor execution

### Development Environment
- **Local Development**: Next.js dev server
- **Database**: Supabase local development
- **Testing**: Local APIFY actor testing

## 🔄 CI/CD Pipeline

### Deployment Flow
1. **Code Changes**: GitHub repository updates
2. **Automatic Deployment**: Vercel auto-deploys on push
3. **APIFY Integration**: GitHub integration for actor updates
4. **Database Migrations**: Manual migration application

### Quality Assurance
- **Code Review**: GitHub pull request process
- **Testing**: Manual testing procedures
- **Monitoring**: Production environment monitoring
- **Rollback**: Vercel deployment rollback capability

## 📈 Future Architecture Considerations

### Planned Enhancements
- **Microservices**: Potential service decomposition
- **Event-Driven**: Message queue integration
- **Advanced Caching**: Redis integration
- **Multi-tenancy**: User isolation and management

### Scalability Improvements
- **Database Sharding**: Horizontal database scaling
- **CDN Integration**: Global file distribution
- **Load Balancing**: Multiple API instances
- **Monitoring**: Advanced observability tools

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Current Implementation

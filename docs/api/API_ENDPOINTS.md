# 🔌 API Endpoints Reference

## 📋 Overview

This document provides a complete reference for all API endpoints in the Scraper Dashboard, including existing functionality and new file storage features.

## 🔐 Authentication

### API Authentication
Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer your-token-here
```

### Actor Authentication
Actor-specific endpoints use a shared secret:

```http
Authorization: Bearer your-actor-secret
```

## 📊 Run Management

### POST `/api/import`
Starts a new scraping run.

**Authentication:** None (public endpoint)

**Request Body:**
```json
{
  "actorId": "HceSv1pj0Y3PZTMvG",
  "input": {
    "code": "ABC123",
    "codeType": "HR_COCKPIT"
  }
}
```

**Response (200):**
```json
{
  "runId": "abc123def456",
  "message": "Run started successfully"
}
```

**Response (400):**
```json
{
  "error": "Actor ID is required"
}
```

**Response (500):**
```json
{
  "error": "Failed to start Apify actor run"
}
```

### POST `/api/actor-update`
Receives progress updates from APIFY actors.

**Authentication:** Actor secret required

**Request Body:**
```json
{
  "runId": "abc123def456",
  "done": 5,
  "total": 10,
  "status": "RUNNING",
  "error": "Error message (optional)"
}
```

**Response (200):**
```json
{
  "ok": true,
  "runId": "abc123def456",
  "pct": 50,
  "status": "RUNNING",
  "done": 5,
  "total": 10
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

## 📁 File Storage & Management

### POST `/api/files/process/{runId}`
Processes files from APIFY for a completed run.

**Authentication:** Actor secret required

**Request Body:**
```json
{
  "force": false
}
```

**Response (200):**
```json
{
  "success": true,
  "processedFiles": 5,
  "totalFiles": 5,
  "errors": [],
  "processingTime": 15000
}
```

**Response (404):**
```json
{
  "error": "Run not found"
}
```

**Response (500):**
```json
{
  "error": "Failed to process files",
  "details": "APIFY API error"
}
```

### GET `/api/files/{runId}`
Lists all files for a specific run.

**Authentication:** None (public endpoint)

**Response (200):**
```json
{
  "files": [
    {
      "id": "uuid-here",
      "filename": "report.pdf",
      "contentType": "application/pdf",
      "fileSize": 1024000,
      "downloadUrl": "https://...",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "totalFiles": 1,
  "totalSize": 1024000
}
```

**Response (404):**
```json
{
  "error": "Run not found"
}
```

### GET `/api/files/{fileId}/download`
Generates a signed download URL for a specific file.

**Authentication:** None (public endpoint)

**Response (200):**
```json
{
  "downloadUrl": "https://...",
  "expiresAt": "2025-01-15T11:30:00Z",
  "filename": "report.pdf"
}
```

**Response (404):**
```json
{
  "error": "File not found"
}
```

### DELETE `/api/files/{fileId}`
Deletes a file (admin only).

**Authentication:** Service role required

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Response (403):**
```json
{
  "error": "Insufficient permissions"
}
```

## 🔍 Data Retrieval

### GET `/api/runs`
Lists all runs (if implemented).

**Authentication:** None (public endpoint)

**Query Parameters:**
- `limit`: Number of runs to return (default: 50)
- `offset`: Number of runs to skip (default: 0)
- `status`: Filter by status (RUNNING, SUCCEEDED, FAILED)

**Response (200):**
```json
{
  "runs": [
    {
      "id": "abc123def456",
      "pct": 100,
      "status": "SUCCEEDED",
      "done": 5,
      "total": 5,
      "fileCount": 3,
      "startedAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

## 📊 Status Codes

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully

### Client Error Codes
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict

### Server Error Codes
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Upstream service error
- `503 Service Unavailable` - Service temporarily unavailable

## 🔄 Webhook Integration

### APIFY Actor Integration
Actors should send progress updates to `/api/actor-update`:

```javascript
// Progress update
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
  })
});

// Completion update
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
  })
});
```

## 📈 Rate Limiting

### Limits
- **Public endpoints**: 100 requests per minute
- **File processing**: 10 requests per minute
- **Download endpoints**: 50 requests per minute

### Headers
Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## 🔐 Security Considerations

### CORS
CORS is enabled for the following origins:
- `http://localhost:3000` (development)
- `https://your-app.vercel.app` (production)

### Input Validation
All endpoints validate:
- Required fields
- Data types
- File size limits
- MIME type restrictions

### Error Handling
Errors are logged but sensitive information is not exposed in responses.

## 📝 Examples

### Starting a Run
```bash
curl -X POST "https://your-app.vercel.app/api/import" \
  -H "Content-Type: application/json" \
  -d '{
    "actorId": "HceSv1pj0Y3PZTMvG",
    "input": {
      "code": "ABC123",
      "codeType": "HR_COCKPIT"
    }
  }'
```

### Processing Files
```bash
curl -X POST "https://your-app.vercel.app/api/files/process/abc123def456" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-actor-secret" \
  -d '{"force": false}'
```

### Downloading a File
```bash
curl -X GET "https://your-app.vercel.app/api/files/uuid-here/download"
```

## 🐛 Error Handling

### Common Error Responses

#### Authentication Errors
```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

#### Validation Errors
```json
{
  "error": "Invalid request data",
  "details": {
    "field": "actorId",
    "message": "Actor ID is required"
  }
}
```

#### Processing Errors
```json
{
  "error": "File processing failed",
  "details": "APIFY API timeout",
  "retryAfter": 300
}
```

## 📚 Related Documentation

- [FILE_STORAGE_FEATURES.md](./FILE_STORAGE_FEATURES.md) - File storage implementation details
- [README.md](./README.md) - Main project documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Planning Phase

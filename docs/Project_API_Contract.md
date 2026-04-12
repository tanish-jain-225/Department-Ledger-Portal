# API Contract

This document defines stable request/response contracts for public API routes.

## Common Rules

- Content type: application/json
- Auth: Bearer token required unless explicitly noted
- Error format:

```json
{
  "error": "string"
}
```

- CORS origin allowlist is enforced on AI routes.
- High-level runtime health checks return a `service` field for monitoring.

## GET /api/health

Auth: not required

### Success (200)

```json
{
  "ok": true,
  "service": "student-ledger-portal",
  "time": "2026-04-12T00:00:00.000Z"
}
```

### Degraded (503)

```json
{
  "ok": false,
  "service": "student-ledger-portal",
  "time": "2026-04-12T00:00:00.000Z"
}
```

### Optional debug fields

Returned only when server has `HEALTHCHECK_DEBUG_TOKEN` and request header `x-health-debug-token` matches exactly.

## POST /api/autofill-section

Auth: required

Rate limit: 10 requests / IP / minute

Body parser max size: 12mb

### Request

```json
{
  "section": "academic|achievement|activity|placement|project|skill",
  "existingData": [],
  "fileData": "base64-string",
  "fileMimeType": "application/pdf|image/png|image/jpeg|image/webp|image/heic|image/heif|text/plain"
}
```

### Success (200)

Response keys depend on `section` and always match that section schema.

### Error examples

- 400 invalid section or malformed base64
- 401 unauthorized
- 403 disallowed origin
- 413 file too large
- 429 rate-limited
- 500 model or format failures
- 503/504 upstream AI temporary failures

## POST /api/analyze-readiness

Auth: required

Rate limit: 5 requests / IP / minute

Body parser max size: 2mb

### Request

```json
{
  "profile": {
    "name": "string",
    "gender": "string",
    "branch": "string",
    "year": "string",
    "alumni": false
  },
  "academic": [],
  "activities": [],
  "achievements": [],
  "placements": [],
  "projects": [],
  "skills": []
}
```

### Success (200)

```json
{
  "score": 88,
  "label": "Ready",
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "careerRoadmap": "string"
}
```

### Error examples

- 400 invalid profile/GPA payload
- 401 unauthorized
- 403 disallowed origin
- 429 rate-limited or AI quota
- 500 env or model validation failures
- 503/504 upstream AI temporary failures

## Backward Compatibility

- Existing fields are not renamed without a migration window.
- New fields may be added in success payloads, but existing fields remain stable.
- Breaking changes must be announced and versioned (`/api/v2/*`) when introduced.

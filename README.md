# Department Ledger Portal

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.11.0-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?style=flat)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-57_passing-brightgreen?style=flat)](__tests__)

AI-assisted academic record management system built with Next.js, Firebase, and Gemini. It supports Student, Faculty, and Admin workflows with role-based access, immutable audit logs, and Firestore-backed ledgers.

Last validated: April 11, 2026 (lint + unit/property tests + build + Playwright smoke tests)

Live Demo: https://department-ledger-portal.vercel.app

## Tech Stack

- Frontend: Next.js 16 (Pages Router), React 19
- Styling: Tailwind CSS 4
- Data/Auth: Firebase Firestore + Firebase Authentication
- Server auth verification: firebase-admin
- AI: Gemini via @google/generative-ai
- Testing: Jest + fast-check

## Role Model

Defined in lib/roles.js:

- student
- faculty
- admin
- pending (empty string, assigned at registration until approved)

Route access levels are defined in lib/route-access.js: public, guest, auth, student, staff, admin.

## Core Features

### Student

- Manage profile and ledger sections: academicRecords, achievements, activities, placements, projects, skills
- Smart Analysis: upload a file and autofill section fields via AI (api/autofill-section)
- Career Pulse: AI readiness report (api/analyze-readiness)
- Download identity card and AI report PDFs
- Submit account deletion request

### Faculty

- Search and review student profiles
- Export student lists as CSV (masked export supported)
- View student identity cards
- Manage own profile and deletion request

### Admin

- Approve/reject role and deletion requests
- Assign roles and purge users (with cascade delete)
- Review immutable audit logs
- Manage governance views and notifications

## API Endpoints

### GET /api/health

Returns public service health:

- ok
- service
- time

Optional debug details are available only when both of these are true:
- Server env var HEALTHCHECK_DEBUG_TOKEN is configured
- Request header x-health-debug-token matches the token

Debug details include Firebase/Gemini configuration status fields.

Returns HTTP 503 when required env vars are missing.

### POST /api/autofill-section

- Auth: Firebase ID token required (Authorization Bearer)
- Rate limit: 10 requests/IP/minute (lib/constants.js)
- Required body: section, fileData (base64), fileMimeType
- Optional body: existingData
- Max payload: 10MB (base64 size estimate)
- Valid sections: academic, achievement, activity, placement, project, skill
- Allowed MIME types: application/pdf, image/png, image/jpeg, image/webp, image/heic, image/heif, text/plain
- Rejects malformed base64 payloads and non-array existingData inputs

### POST /api/analyze-readiness

- Auth: Firebase ID token required
- Rate limit: 5 requests/IP/minute
- Required body: profile
- Optional body: academic, activities, achievements, placements, projects, skills
- Validates GPA values in academic records to 0-10 before AI call
- Normalizes and validates AI response fields before returning report JSON

## Data Collections

From lib/constants.js and data layer usage:

- users
- roleRequests
- deletionRequests
- notifications
- auditLogs
- academicRecords
- activities
- achievements
- placements
- projects
- skills
- aiReports

## Security Notes

- New registrations are created as pending role and cannot access protected routes.
- API routes verify Firebase ID tokens server-side (lib/api-auth.js).
- Audit logs are append-only by Firestore rule design.
- CSV export supports masking sensitive fields.
- Rate limiting uses a shared Firestore-backed sliding window by default with automatic local fallback when unavailable.
- RATE_LIMIT_STORE=memory forces in-memory mode (useful for local/testing); RATE_LIMIT_STORE=shared forces shared mode.

## Testing

Current status: 57 tests, 10 suites, all passing.

Run tests:

```bash
npm test
```

Suite breakdown:

- __tests__/buildPrompt.test.js: 8 tests
- __tests__/buildPrompt.property.test.js: 6 tests
- __tests__/dashboardSearch.test.js: 6 tests
- __tests__/health.test.js: 2 tests
- __tests__/listStudentsForDashboard.test.js: 6 tests
- __tests__/rateLimit.test.js: 5 tests
- __tests__/rateLimit.property.test.js: 4 tests
- __tests__/studentAnalytics.property.test.js: 9 tests
- __tests__/parseAiJson.test.js: 6 tests
- __tests__/analyzeReadinessSanitization.test.js: 5 tests

## Local Setup

```bash
git clone https://github.com/tanish-jain-225/Department-Ledger-Portal
cd Department-Ledger-Portal
npm install
cp .env.local.example .env.local
firebase deploy --only firestore
npm run dev
```

## Environment Variables

Use .env.local.example as template.

Required:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
GEMINI_MODEL=
```

## Validation Commands

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Current verification status:

- lint: pass
- test: 57/57 pass (10 suites)
- build: pass (Next.js 16.2.3)
- test:e2e: 2/2 pass

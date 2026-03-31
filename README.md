# Department Ledger Portal

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?style=flat&logo=google-gemini)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)
[![Tests](https://img.shields.io/badge/Tests-51_passing-brightgreen?style=flat)](/__tests__)

An AI-powered academic record management system for educational departments. Students manage their full academic profile, faculty oversee student progress, and admins govern the entire system — all backed by Gemini AI, Firebase, and a zero-trust security model.

**Live Demo:** https://department-ledger-portal.vercel.app

---

## Table of Contents

- [What It Does](#what-it-does)
- [Tech Stack](#tech-stack)
- [Role System](#role-system)
- [Features by Role](#features-by-role)
- [AI Features](#ai-features)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Security Architecture](#security-architecture)
- [Firestore Rules](#firestore-rules)
- [Firestore Indexes](#firestore-indexes)
- [Rate Limiting](#rate-limiting)
- [UI System](#ui-system)
- [PDF & CSV Export](#pdf--csv-export)
- [Notifications](#notifications)
- [Audit Logging](#audit-logging)
- [Testing](#testing)
- [Setup & Local Development](#setup--local-development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Known Limitations & Roadmap](#known-limitations--roadmap)

---

## What It Does

The Department Ledger Portal solves "data stagnation" in academic institutions — where student records are locked in fragmented spreadsheets and manual processes. It provides:

- A unified master ledger for all student academic data (GPA, achievements, placements, projects, skills)
- AI-powered document parsing that extracts structured data from uploaded PDFs and images in ~10 seconds vs 20 minutes of manual entry
- Career Pulse: an AI-generated placement readiness score (0–100) with SWOT analysis and career roadmap
- A three-tier governance system (Student / Faculty / Admin) with strict role-based access
- An immutable audit trail of every administrative action
- Digital identity cards with PDF export for students and faculty

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (Pages Router), React 18, Tailwind CSS 3.4 |
| AI | Google Gemini 2.5 Flash (multimodal — text + PDF + image) |
| Database | Firebase Firestore (NoSQL, real-time) |
| Auth | Firebase Authentication (email/password) |
| Hosting | Vercel (serverless, edge-optimized) |
| PDF Export | html2canvas + jsPDF (loaded from CDN on demand) |
| Testing | Jest 30, React Testing Library, fast-check (property-based) |
| Styling | Tailwind CSS with custom design tokens, glassmorphism |

---

## Role System

Every user starts as `pending` (empty role string) after registration. An admin must manually assign a role before the user can log in.

```
lib/roles.js

ROLES = { STUDENT: "student", FACULTY: "faculty", ADMIN: "admin" }
PENDING_ROLE = ""  ← new registrations

hasApprovedRole(role)  → student | faculty | admin
isStaff(role)          → faculty | admin
canExport(role)        → faculty | admin
canManageUsers(role)   → admin only
```

Route-level access is enforced in `Layout.jsx` using the `ACCESS` enum:

| ACCESS level | Who can see it |
|---|---|
| `PUBLIC` | Everyone |
| `GUEST` | Unauthenticated only (login, register) |
| `AUTH` | Any approved role |
| `STUDENT` | Students only |
| `STAFF` | Faculty + Admin |
| `ADMIN` | Admin only |

---

## Features by Role

### Student
- Edit personal profile (name, phone, DOB, gender, address, LinkedIn, GitHub, alumni status)
- Master Ledger with 6 sections: Academic Records, Achievements, Activities, Placements, Projects, Skills
- AI Smart Analysis: upload a PDF/image to auto-fill any ledger section
- Career Pulse: generate AI placement readiness reports (stored in Intelligence Vault)
- Download Career Intelligence Report as PDF
- View and download digital Identity Card as PDF
- Request account deletion (triggers admin workflow)

### Faculty
- View all student profiles and full ledger data
- Search students by name (server-side prefix query)
- Export student records as CSV (with PII masking)
- View individual student identity cards
- Edit own professional profile
- View and download own Faculty Identity Card
- Request account deletion

### Admin
- All faculty capabilities
- Governance Overview dashboard (live stats: users, pending requests, recent audit events)
- Student Directory: view, search, change roles, delete users with cascade purge
- Faculty Directory: same as student directory for faculty
- Governance Requests: approve/reject role elevation requests, approve/reject deletion requests
- Audit Log: full immutable log of all admin actions, exportable as CSV
- Real-time notifications for new registrations and deletion requests

---

## AI Features

### Smart Analysis — `POST /api/autofill-section`

Accepts a base64-encoded PDF or image and the target ledger section. Uses Gemini's multimodal capability to extract structured data and return a JSON object matching the section's field schema.

Supported sections and their fields:

| Section | Fields extracted |
|---|---|
| `academic` | year, semester, gpa, subjects, branch, rollNumber |
| `achievement` | title, issuer, level, date |
| `activity` | type, title, date, description |
| `placement` | company, role, status, package |
| `project` | title, techStack, description |
| `skill` | name, category, proficiency |

The prompt includes existing records so the model avoids duplicating entries already in the ledger.

Accepted file types: PDF, PNG, JPEG, WEBP, HEIC, HEIF, TXT (max 10MB)

### Career Pulse — `POST /api/analyze-readiness`

Sends the student's full profile (academic records, activities, achievements, placements, projects, skills) to Gemini with a structured evaluation prompt. Returns:

```json
{
  "score": 78,
  "label": "Developing",
  "summary": "Two-sentence executive summary.",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "recommendations": ["...", "...", "...", "..."],
  "careerRoadmap": "Detailed career trajectory prediction."
}
```

Reports are saved to the `aiReports` Firestore collection and displayed in the Intelligence Vault. Each report can be viewed in a modal and downloaded as a PDF.

---

## API Reference

### `GET /api/health`
Health check. Returns `{ ok: true, service, time }`.

### `POST /api/autofill-section`

| Field | Type | Required | Description |
|---|---|---|---|
| `section` | string | yes | One of: academic, achievement, activity, placement, project, skill |
| `fileData` | string | yes | Base64-encoded file content |
| `fileMimeType` | string | yes | MIME type of the file |
| `existingData` | array | no | Existing records to avoid duplicating |

Rate limit: 10 requests per IP per minute.

### `POST /api/analyze-readiness`

| Field | Type | Required | Description |
|---|---|---|---|
| `profile` | object | yes | User profile data |
| `academic` | array | no | Academic records |
| `activities` | array | no | Activity records |
| `achievements` | array | no | Achievement records |
| `placements` | array | no | Placement records |
| `projects` | array | no | Project records |
| `skills` | array | no | Skill records |

Rate limit: 5 requests per IP per minute.

---

## Data Model

### `users`
```
{
  name, email, role, year, branch, phone, address,
  dob, gender, linkedin, github, alumni, bio,
  status, facultyVerification, verificationMethod,
  createdAt, updatedAt, lastLogin
}
```

### `academicRecords`
```
{ studentUid, year, semester, gpa, subjects, rollNumber, branch, resultLink, createdAt, updatedAt }
```

### `achievements`
```
{ studentUid, title, issuer, level, date, description, certificateLink, createdAt, updatedAt }
```

### `activities`
```
{ studentUid, type, title, date, description, link, createdAt, updatedAt }
```

### `placements`
```
{ studentUid, company, role, status, package, link, year, createdAt, updatedAt }
```

### `projects`
```
{ studentUid, title, techStack, description, link, github, createdAt, updatedAt }
```

### `skills`
```
{ studentUid, name, category, proficiency, createdAt, updatedAt }
```

### `aiReports`
```
{ studentUid, score, label, summary, strengths, weaknesses, recommendations, careerRoadmap, createdAtString, createdAt, updatedAt }
```

### `auditLogs` (immutable)
```
{ action, actorUid, targetUid, description, details, timestamp }
```

### `roleRequests`
```
{ uid, email, requestedRole, status, createdAt }
```

### `deletionRequests`
```
{ uid, email, name, status, createdAt }
```

### `notifications`
```
{ userUid, title, message, type, link, relatedId, read, createdAt }
```

---

## Security Architecture

**Authentication:** Firebase Auth (email/password). New users are signed out immediately after registration and cannot log in until an admin assigns a role.

**RBAC enforcement — two layers:**
1. `lib/auth-context.js` — checks role on every `onAuthStateChanged` event. If role is not approved, signs the user out.
2. `Layout.jsx` — checks `ACCESS` level on every route render. Redirects unauthorized users.
3. Firestore security rules — enforced server-side, independent of the client.

**Audit trail:** Every admin action (role assignment, user deletion, profile update) calls `logAudit()` which writes to `auditLogs`. The Firestore rule sets `update: if false` and `delete: if false` — the collection is append-only and tamper-proof.

**Data masking:** CSV exports use `maskEmail()` and `maskPhone()` from `lib/export-utils.js` when `maskSensitive: true`. Faculty exports are masked; admin exports are unmasked.

**API key security:** Gemini API key is stored as `GEMINI_API_KEY` (no `NEXT_PUBLIC_` prefix) so it is never included in the client-side JavaScript bundle. Only the Next.js server-side API routes can read it.

---

## Firestore Rules

Key rules summary:

```
users          — read: any auth; write: own doc or admin
academicRecords/achievements/activities/placements/projects/skills/aiReports
               — read: any auth; create: owner only (studentUid == uid); update/delete: owner or admin
roleRequests   — read: owner or admin; create: any auth; update/delete: admin only
deletionRequests — read: owner or admin; create: any auth; update/delete: admin only
notifications  — read: own only; create: any auth; update: own or admin; delete: admin only
auditLogs      — read: admin only; create: any auth; update: NEVER; delete: NEVER
```

Full rules are in `firebase/firestore.rules`.

---

## Firestore Indexes

All composite indexes are defined in `firebase/firestore.indexes.json` and deployed via Firebase CLI. Key indexes:

| Collection | Fields |
|---|---|
| academicRecords, achievements, activities, placements, projects, skills, aiReports | studentUid ASC + createdAt DESC |
| notifications | userUid ASC + createdAt DESC |
| notifications | userUid ASC + read ASC |
| roleRequests, deletionRequests | status ASC + createdAt DESC |
| users | role ASC + createdAt DESC |
| users | role ASC + branch ASC |
| users | role ASC + year ASC |

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Rate Limiting

Implemented in `lib/rate-limit.js` using a `globalThis` singleton Map (survives Next.js hot-module replacement in dev, consistent within a single serverless instance in production).

| Endpoint | Limit |
|---|---|
| `/api/autofill-section` | 10 requests / IP / minute |
| `/api/analyze-readiness` | 5 requests / IP / minute |

Keys are namespaced: `autofill:<ip>` and `analyze:<ip>` so they don't share counters.

For multi-instance persistent rate limiting, swap the store for [Upstash Redis](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview).

---

## UI System

The design system is built on Tailwind CSS with custom tokens defined in `tailwind.config.js` and `styles/globals.css`.

**Custom classes:**
- `.premium-card` — rounded-[2.5rem] card with subtle shadow and hover lift
- `.glass` — frosted glass background
- `.glass-island` — floating island nav style
- `.btn-premium` — base button with active scale
- `.animate-slide-up`, `.animate-fade-in`, `.animate-scale-up`, `.animate-float` — keyframe animations

**Component variants (Button):** `primary`, `secondary`, `soft`, `danger`, `ghost`

**Skeleton loaders:** `Skeleton`, `ProfileSkeleton`, `CardSkeleton`, `TableRowSkeleton`

**Page transitions:** `PageTransition` in `_app.js` fades between routes using CSS class toggling.

**Sidebar:** Collapsible (160px collapsed / 400px expanded), state persisted to `localStorage` under key `sidebar_collapsed`.

---

## PDF & CSV Export

### PDF
`lib/pdf-download.js` loads html2canvas and jsPDF from CDN on demand (not bundled). It clones the target DOM element into an off-screen container at a fixed width, captures it with html2canvas, then slices the canvas into A4 pages for multi-page documents.

```js
await downloadElementAsPdf(elementRef.current, {
  filename: "Student_Card_Name_2026-01-01.pdf",
  orientation: "portrait",
  windowWidth: 794,
});
```

`DownloadPdfButton` wraps this with role-gating (`allowedRoles` prop) and loading/error state.

### CSV
`lib/csv-download.js` + `lib/export-utils.js`. Exports a flat array of user objects. PII masking:
- Email: `j***@domain.com`
- Phone: `***1234`

```js
downloadStudentsCsv(rows, "export.csv", { maskSensitive: true });
```

---

## Notifications

`lib/notifications.js` provides:

| Function | Description |
|---|---|
| `createNotification(userUid, {...})` | Creates a notification for a specific user |
| `notifyAdmins({...})` | Broadcasts to all users with role=admin |
| `notifyFaculty({...})` | Broadcasts to all users with role=faculty |
| `syncAdminNotifications(adminUid)` | Syncs pending role/deletion requests into admin's notification feed (deduplicates) |
| `purgeNotifications(relatedId)` | Batch-deletes all notifications with a given relatedId |
| `markAllAsRead(userUid)` | Batch-marks all unread notifications as read |

`NotificationCenter.jsx` uses `onSnapshot` for real-time updates. Unread count is shown as an animated badge on the bell icon.

---

## Audit Logging

Every significant admin action calls `logAudit()`:

```js
await logAudit({
  action: "user_role_assigned",   // machine-readable action key
  actorUid: "uid-of-admin",
  targetUid: "uid-of-affected-user",
  description: "Human-readable description",
  details: { role: "student" }    // structured metadata
});
```

The `auditLogs` Firestore collection has `update: if false` and `delete: if false` in security rules — it is physically impossible to modify or delete audit records from the client.

Logged actions include: `profile_updated`, `user_role_assigned`, `user_deleted`, `*_created`, `*_updated`, `*_deleted` for all ledger collections.

---

## Testing

51 tests across 8 suites, all passing.

```bash
npx jest --no-coverage
```

| Suite | Tests | What it covers |
|---|---|---|
| `buildPrompt.test.js` | 8 | AI prompt construction: field inclusion, existing data context, file context, JSON instruction |
| `buildPrompt.property.test.js` | 6 | Property-based: prompt always contains section name, always instructs JSON, grows with data |
| `rateLimit.test.js` | 5 | Sliding window: under limit, over limit, key isolation, window reset, route namespacing |
| `rateLimit.property.test.js` | 4 | Property-based: first request never blocked, always blocked after maxCount, keys independent |
| `dashboardSearch.test.js` | 6 | Search filter fallback: empty term, name match, email match, no match, partial, case-insensitive |
| `studentAnalytics.test.js` | 9 | computeReport: score range, verdicts, GPA trends, profile completeness, placement detection |
| `studentAnalytics.property.test.js` | 9 | Property-based: score 0–100, verdict always valid, placed flag consistent, counts match |
| `listStudentsForDashboard.test.js` | 6 | Integration (Firestore mocked): returns `{ rows, lastDoc }`, cursor, empty state, fallback filter |
| `components/Badge.test.jsx` | 7 | Component rendering: variants, className merging, element type |

Testing stack: Jest 30, React Testing Library, fast-check (property-based), Firestore mocked via `__mocks__/`.

---

## Setup & Local Development

```bash
# 1. Clone
git clone https://github.com/tanish-jain-225/Department-Ledger-Portal
cd Department-Ledger-Portal

# 2. Install
npm install

# 3. Install Playwright browsers (for E2E tests)
npx playwright install chromium

# 4. Configure environment
cp .env.local.example .env.local
# Fill in your Firebase and Gemini credentials (see Environment Variables below)

# 5. Deploy Firestore rules and indexes
firebase deploy --only firestore

# 6. Run dev server
npm run dev

# 7. Run unit + property + integration tests
npm test

# 8. Run E2E tests (requires dev server running or uses webServer config)
npm run test:e2e
```

---

## Environment Variables

Create `.env.local` from `.env.local.example`:

```env
# Firebase (client-side — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini AI (server-only — never expose to client)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix intentionally — it is only read by server-side API routes and is never included in the client bundle.

For Vercel deployment, add these same variables in the Vercel dashboard under Settings → Environment Variables.

---

## Deployment

The project is deployed on Vercel. Next.js is auto-detected.

```bash
# Build locally to verify
npm run build
npm start
```

**Vercel setup:**
1. Connect GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy — Vercel handles the rest

**Firebase setup:**
1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Deploy rules and indexes: `firebase deploy --only firestore`
5. Copy config values to `.env.local`

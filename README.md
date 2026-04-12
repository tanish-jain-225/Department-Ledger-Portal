# Department Ledger Portal

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.11.0-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?style=flat)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![CI](https://img.shields.io/badge/CI-lint%20%7C%20test%20%7C%20build%20%7C%20e2e-brightgreen?style=flat)](.github/workflows/ci.yml)

Production-grade academic ledger platform for departments. The system centralizes student records, faculty review workflows, governance actions, and AI-assisted insights using a secure role model and Firestore-backed data.

Live demo: https://department-ledger-portal.vercel.app

---

## 1. What This Project Solves

Departments usually manage student progression across multiple disconnected tools. This project provides one unified portal for:

- student record management
- faculty review and search
- admin governance and approvals
- AI-assisted autofill and readiness analysis
- auditability of critical actions

Core value:

- single source of truth for academic profiles
- role-based access boundaries
- standardized data model across sections
- operational confidence via CI and automated testing

---

## 2. Product Capabilities

### Student

- manage ledger sections: academics, achievements, activities, placements, projects, skills
- upload documents for AI-assisted section autofill
- generate Career Pulse readiness report
- download identity card and AI report PDFs
- submit account deletion requests

### Faculty

- search and review student profiles
- view identity cards
- export student records as CSV with masking support
- maintain own profile and deletion request

### Admin

- approve/reject role and deletion requests
- assign roles and purge users (cascade delete)
- review immutable audit logs
- monitor governance activity and notifications

---

## 3. Architecture Overview

### Frontend

- framework: Next.js 16 (Pages Router)
- UI: React 19 + Tailwind CSS 4
- route-level access control handled through shared layout/access utilities

### Backend (Next API Routes)

- auth verification via firebase-admin
- AI integration via Gemini API
- server-side validation, sanitization, and rate limiting

### Data Layer

- primary database: Firestore
- security boundaries enforced through Firestore Rules
- indexes pre-defined for key query patterns

### Audit and Governance

- audit writes are append-only by rules design
- admin workflows are tracked for forensics and accountability

---

## 4. Tech Stack

- frontend: Next.js, React
- styling: Tailwind CSS
- data/auth: Firebase Auth + Firestore
- server auth: firebase-admin
- AI: @google/generative-ai
- test: Jest + fast-check + Playwright
- CI: GitHub Actions

Node engine requirement:

- >=20.19.0 or >=22.13.0

---

## 5. Role and Access Model

Roles are defined in [lib/roles.js](lib/roles.js):

- student
- faculty
- admin
- pending (default immediately after registration)

Route access levels are defined in [lib/route-access.js](lib/route-access.js):

- public
- guest
- auth
- student
- staff
- admin

Operational rule:

- new users register as pending and cannot access protected role routes until approved by admin

---

## 6. Repository Structure

```text
.
├─ .github/workflows/           # CI workflows
├─ __tests__/                   # unit + property + API integration tests
├─ e2e/                         # Playwright smoke tests
├─ components/                  # UI and profile components
├─ pages/                       # Next.js routes and API handlers
├─ lib/                         # shared auth/data/security/business utilities
├─ firebase/                    # firestore rules and indexes
├─ public/                      # static assets and worker files
├─ styles/                      # global styles/theme tokens
└─ docs/                        # architecture and API contract docs
```

Important files:

- [pages/api/autofill-section.js](pages/api/autofill-section.js)
- [pages/api/analyze-readiness.js](pages/api/analyze-readiness.js)
- [pages/api/health.js](pages/api/health.js)
- [lib/api-auth.js](lib/api-auth.js)
- [lib/rate-limit.js](lib/rate-limit.js)
- [firebase/firestore.rules](firebase/firestore.rules)
- [docs/API_Contract.md](docs/API_Contract.md)
- [.github/workflows/ci.yml](.github/workflows/ci.yml)

---

## 7. API Surface

### GET /api/health

Returns service health status with `ok`, `service`, and `time`.

- returns 200 when required service env vars are present
- returns 503 when required service env vars are missing
- optional debug details only when both conditions are true:
	- `HEALTHCHECK_DEBUG_TOKEN` is configured on server
	- request header `x-health-debug-token` matches token

### POST /api/autofill-section

- auth required (Bearer Firebase ID token)
- rate limit: 10 requests/IP/minute
- accepted sections: academic, achievement, activity, placement, project, skill
- validates MIME allowlist and base64 payload format
- enforces upload size boundaries

### POST /api/analyze-readiness

- auth required
- rate limit: 5 requests/IP/minute
- validates profile structure and GPA ranges
- sanitizes and normalizes AI output before returning to client

Full contract, error shapes, and compatibility policy:

- [docs/API_Contract.md](docs/API_Contract.md)

---

## 8. Data Model (Collections)

Core collections used by the app:

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
- uploadedDocuments

Collection constants source:

- [lib/constants.js](lib/constants.js)

---

## 9. Security Model

Key controls implemented:

- server-side Firebase token verification for protected APIs
- Firestore Rules enforcing ownership and role constraints
- append-only audit log semantics
- origin checks for AI endpoints
- rate limiting and validation before expensive operations
- CSV export masking support for sensitive fields

Rule definitions:

- [firebase/firestore.rules](firebase/firestore.rules)

---

## 10. Local Development Setup

### Prerequisites

- Node.js 20.19+ (or 22.13+)
- npm
- Firebase project (Auth + Firestore)

### Steps

```bash
git clone https://github.com/tanish-jain-225/Department-Ledger-Portal
cd Department-Ledger-Portal
npm install
copy .env.local.example .env.local
npm run dev
```

Windows note:

- use `copy .env.local.example .env.local` in PowerShell/CMD

---

## 11. Environment Variables

Template source:

- [.env.local.example](.env.local.example)

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

Optional / operational:

```env
HEALTHCHECK_DEBUG_TOKEN=
RATE_LIMIT_STORE=shared
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Notes:

- `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` are used for local explicit service-account mode
- if omitted, server can use environment-based ADC fallback

---

## 12. Scripts

Defined in [package.json](package.json):

```bash
npm run dev          # start local dev server
npm run build        # production build
npm run start        # run production server
npm run lint         # eslint checks
npm test             # jest tests
npm run test:e2e     # playwright smoke tests
```

---

## 13. Testing and Quality Gates

Current status (latest local validation):

- Jest: 77 passing tests across 12 suites
- Playwright: 5 passing smoke tests
- Lint: pass
- Build: pass

Included test types:

- unit tests
- property-based tests (fast-check)
- API route integration-style tests (mocked auth/rate-limit/AI)
- browser smoke E2E tests

Run full validation locally:

```bash
npm run lint
npm test -- --ci
npm run build
npm run test:e2e
```

---

## 14. CI/CD

Workflow file:

- [.github/workflows/ci.yml](.github/workflows/ci.yml)

Pipeline coverage:

- trigger on push/PR/all branches and manual dispatch
- Node matrix verify on 20.x and 22.x
- install + production dependency audit (`npm audit --omit=dev --audit-level=high`)
- lint + unit/property/integration tests + build
- Playwright smoke tests in separate gated job

---

## 15. Deployment

Recommended runtime:

- Vercel for Next.js app hosting
- Firebase for Auth + Firestore

Deployment checklist:

1. Configure all required environment variables in hosting platform.
2. Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

3. Confirm `/api/health` returns 200 in production environment.
4. Run smoke E2E after deploy.

---

## 16. Operations and Troubleshooting

### App starts but AI endpoints fail

- verify `GEMINI_API_KEY` and `GEMINI_MODEL`
- check `/api/health` response and optional debug mode with token

### Unauthorized on protected APIs

- ensure client sends `Authorization: Bearer <firebase-id-token>`
- verify server has valid firebase-admin configuration or ADC

### Rate limit errors in local testing

- expected when repeated requests hit per-IP caps
- tune usage patterns or local test sequencing

### Firestore permission errors

- validate role assignment in `users` collection
- verify rules in [firebase/firestore.rules](firebase/firestore.rules)

---

## 17. Documentation Index

- API contract: [docs/API_Contract.md](docs/API_Contract.md)
- Project planning docs: [docs](docs)
- Firestore rules: [firebase/firestore.rules](firebase/firestore.rules)
- Firestore indexes: [firebase/firestore.indexes.json](firebase/firestore.indexes.json)

---

## 18. Roadmap Ideas

- broaden role-flow E2E coverage (student/faculty/admin critical journeys)
- add API versioning namespace (`/api/v1/*`) when introducing breaking changes
- add observability dashboards and error telemetry
- add domain-level performance budgets and monitoring SLOs

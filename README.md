# Department Ledger Portal

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.11.0-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?style=flat)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![CI](https://img.shields.io/badge/CI-lint%20%7C%20test%20%7C%20build%20%7C%20e2e-brightgreen?style=flat)](.github/workflows/ci.yml)

Production-grade academic ledger platform for departments. The system centralizes student records, faculty review workflows, governance actions, and AI-assisted insights using a secure role model and Firestore-backed data.

- Live demo: [Demo Link](https://department-ledger-portal.vercel.app)
- Hackathon presentation: [docs/GDG_Solution_Challenge_Solution_PPT_Final.pdf](docs/GDG_Solution_Challenge_Solution_PPT_Final.pdf)
- Prototype video: [Prototype Video](https://drive.google.com/drive/folders/1a2Bklmxa7QwUcPPeY83r4hymXAEa6kbX)

---

## 1. What This Project Solves

Departments often manage student progression across multiple disconnected tools. Department Ledger Portal provides a unified, secure platform for:

- student record management
- faculty review and search
- administrative governance and approvals
- AI-assisted autofill and readiness analysis
- auditability of critical actions

Core values:

- single source of truth for academic profiles
- role-based access boundaries
- standardized data model across sections
- operational confidence through CI and automated testing

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

- **Framework**: Next.js 16 (Pages Router)
- **UI**: React 19 + Tailwind CSS 4 (responsive tokens + global HSL colors)
- **Route Access Control**: Client layouts ([components/Layout.jsx](components/Layout.jsx)) enforce route permissions synchronously to prevent flicker during transitions.
- **Web Worker CSV Exports**: Heavy data exports are processed off-thread using Web Workers ([public/workers/csv-worker.js](public/workers/csv-worker.js)) to avoid UI freezes.

### Backend (Next API Routes)

- **Auth Verification**: JWT verification via the `firebase-admin` SDK.
- **AI Orchestration**: Direct integration with the Gemini 2.5 API, running under strict execution timeouts.
- **Hybrid Rate Limiting**: Distributed, transaction-safe sliding window rate limiting backed by Firestore. On timeout or failure, the logic fails-open to local in-memory limits ([lib/rate-limit.js](lib/rate-limit.js)).

### Data Layer

- **Primary Database**: Google Cloud Firestore.
- **Security Boundaries**: Enforced via declarative Firestore Security Rules ([firebase/firestore.rules](firebase/firestore.rules)).
- **Index Fallback Engine**: If queries hit unbuilt Firestore composite indexes in dev/staging (raising a `failed-precondition` exception), the data utilities ([lib/data.js](lib/data.js)) automatically page records and filter in-memory.

### Audit and Governance

- **Append-Only Auditing**: Write-only audit log rules prevent retrospective modifications or deletions.
- **Vector PDF CV Assembly**: Renders vector-based resumes using `jsPDF` for text searchability, then stitches student-uploaded verification records (PDFs/Images) dynamically using `pdf-lib` into a unified PDF portfolio ([lib/pdf-export.js](lib/pdf-export.js)).

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

Operational model:

- new users register as pending and cannot access protected routes until approved by an administrator

---

## 6. Repository Structure

```text
.
├─ .github/workflows/           # CI workflows
├─ __tests__/                   # unit + property + API integration + UI component tests
├─ e2e/                         # Playwright smoke and auth-flow tests
├─ components/                  # UI and profile components
├─ pages/                       # Next.js routes and API handlers
├─ lib/                         # shared auth/data/security/business utilities
├─ firebase/                    # firestore rules and indexes
├─ cors.json                    # Firebase Storage CORS policy (deploy with gsutil or Firebase CLI)
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
- [docs/Project_API_Contract.md](docs/Project_API_Contract.md)
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

- [docs/Project_API_Contract.md](docs/Project_API_Contract.md)

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

- **Server-Side Verification**: Bearer Firebase ID token authentication on all protected REST endpoints.
- **Role Boundary Rules**: Custom rules in [firebase/firestore.rules](firebase/firestore.rules) prevent privilege escalation (e.g., users cannot edit their own `role` or verification fields).
- **Atomic User Purging**: Administrator user purges use `writeBatch` in Firestore to guarantee either all sub-collection records (projects, achievements, academic records) and the user document are deleted, or none are.
- **Linked Document Cascades**: Deleting individual ledger entries automatically queries and deletes linked uploaded documents to avoid orphan storage files.
- **Non-Repudiation Logs**: Audit logs are append-only (no update or delete operations are defined in Firestore rules).
- **PII Sensitivity Masking**: CSV export utility filters and masks telephone, email, and location details depending on whether the actor is staff or admin ([lib/csv-download.js](lib/csv-download.js)).
- **Origin-Gated AI Endpoints**: Restricts CORS requests on expensive generative functions.

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

# Restrict AI endpoint CORS to your production origin.
# localhost is always allowed. If omitted, endpoints accept any origin.
ALLOWED_ORIGIN=https://your-app.vercel.app
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

- Jest: 77+ passing tests across 16 suites (includes UI component tests)
- Playwright: 5+ passing smoke tests + auth-flow journey tests
- Lint: pass
- Build: pass

Included test types:

- **Unit Testing**: Covers layout rendering, text styling, navigation routing, and utility scripts.
- **UI Component Testing**: React Testing Library tests for `Button`, `Modal`, `EmptyState`, and `Skeleton` primitives — verifying rendering, accessibility, interaction, and prop contracts.
- **Property-Based Testing**: Employs `fast-check` to run parameterized invariant checks (e.g., ensuring rate-limiting keys never interfere, and validating output formats across hundreds of randomized scenarios).
- **Route Integration testing**: Simulates Next.js API requests with mocked authentication states, database responses, and generative API models.
- **E2E Smoke and Auth-Flow Testing**: Playwright scripts simulate login/register page structure, unauthenticated redirect protection, home→auth navigation, mobile responsive assertions, and legal page reachability.

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
- Node matrix verify on 20.x and 22.x (matching `engines` field in package.json)
- install + production dependency audit (`npm audit --omit=dev --audit-level=high`)
- lint + unit/property/integration/UI tests + build
- Playwright smoke and auth-flow tests in separate gated job

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

- verify `GEMINI_API_KEY` and `GEMINI_MODEL` are set in `.env.local`.
- check `/api/health` response and optional debug mode using the header `x-health-debug-token`.
- **LLM balanced-bracket issues**: If AI output contains text wrapper prose outside JSON, the `parseAiJson` parser automatically extracts the balanced JSON block.
- **Upstream error masking**: Raw AI connection errors are converted into standardized HTTP codes (429/503/504) to avoid leaking server logs to clients.

### Unauthorized on protected APIs

- ensure client sends `Authorization: Bearer <firebase-id-token>`.
- verify server has valid firebase-admin credentials or Application Default Credentials (ADC).
- **Role Clearance check**: Even authenticated users will receive 403 Forbidden if their role is still empty (pending approval).

### Rate limit errors in local testing

- **Distributed vs Local limiting**: Local environments automatically bypass Firestore transactions to avoid rate-limiting lockouts, falling back to local memory limiters.
- Adjust `RATE_LIMIT_STORE` in `.env.local` to bypass or enforce shared rules.

### Firestore permission errors

- validate role assignment in `users` collection.
- verify rules in [firebase/firestore.rules](firebase/firestore.rules).
- **Composite Index Errors**: If composite queries fail during development, check if the console prompts to build indexes. The application will fall back to local in-memory filtering in the interim.

---

## 17. Documentation Index

- API contract: [docs/Project_API_Contract.md](docs/Project_API_Contract.md)
- Project planning docs: [docs](docs)
- Firestore rules: [firebase/firestore.rules](firebase/firestore.rules)
- Firestore indexes: [firebase/firestore.indexes.json](firebase/firestore.indexes.json)

---

## Hackathon Resources

- Presentation: [docs/GDG_Solution_Challenge_Solution_PPT_Final.pdf](docs/GDG_Solution_Challenge_Solution_PPT_Final.pdf)
- Video recording: [Prototype Video](https://drive.google.com/drive/folders/1a2Bklmxa7QwUcPPeY83r4hymXAEa6kbX)

---

## 18. Roadmap Ideas

- broaden role-flow E2E coverage (student/faculty/admin critical journeys)
- add API versioning namespace (`/api/v1/*`) when introducing breaking changes
- add observability dashboards and error telemetry
- add domain-level performance budgets and monitoring SLOs

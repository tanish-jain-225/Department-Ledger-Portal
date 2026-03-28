# 🚀 Department Ledger Portal — Ultimate README

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?style=flat&logo=google-gemini)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)


## Project Objective

The **Department Ledger Portal** is a production-grade, AI-powered academic record and career intelligence system. It automates academic data entry, provides actionable career insights, and enforces strict security and audit controls for educational institutions.

**Who is it for?**
- **Students:** Seamless academic record-keeping, AI-driven placement readiness, and digital identity cards.
- **Faculty:** Oversight of student progress, CSV/PDF exports, and search/filter tools.
- **Admins:** Full governance, audit logs, role management, and system settings.

---

## Key Features

- **AI-Driven Document Parsing:** Upload PDFs/images; Gemini AI extracts and validates academic data.
- **Career Pulse:** AI-powered SWOT analysis and readiness scoring for placements.
- **Zero-Trust RBAC:** Strict role-based access, managed in code and Firestore rules.
- **Immutable Audit Logs:** All admin actions are logged for compliance.
- **Real-Time Notifications:** In-app notification center for all roles.
- **Identity Cards:** Digital student/faculty cards with PDF export.
- **Bulk Data Export:** Masked CSV export for faculty/admins.
- **Modern UI:** Built with Next.js, React, and Tailwind CSS.
- **Serverless & Scalable:** Firebase backend, Next.js frontend, easy cloud deployment.

---

## Technical Architecture

**Stack:** Next.js (Pages Router), React, Firebase (Auth, Firestore), Google Gemini AI, Tailwind CSS

**Layers:**
- **Client:** React components, Auth/Toast context, role-based navigation, notification center.
- **Logic:** Next.js API routes for AI, Firestore, and business logic.
- **Data:** Firebase Auth for authentication, Firestore for all data, strict security rules.

**Key Folders:**
- `components/` — All UI and profile components (cards, modals, sections, notifications, etc.)
- `lib/` — Auth context, Firestore helpers, audit, notifications, constants, role logic, error handling.
- `pages/` — Next.js pages for login, register, dashboard, admin, faculty, student, profile, and API endpoints.
- `firebase/` — Firestore rules and indexes.
- `public/` — Static assets (logo, robots.txt, etc.)
- `styles/` — Tailwind and global CSS.

---

## AI Intelligence Protocol

### 1. Smart Analysis (Auto-Fill)
- **Endpoint:** `POST /api/autofill-section`
- **Input:** Base64 PDF/image + existing data context
- **Logic:** Gemini parses, deduplicates, and outputs validated JSON for academic, achievement, skill, etc.

### 2. Career Pulse (Readiness)
- **Endpoint:** `POST /api/analyze-readiness`
- **Input:** Aggregated profile, academic, skills, projects, etc.
- **Output:** Readiness score (0-100), summary, strengths, weaknesses, recommendations, career roadmap

---

## Role-Based Access Control (RBAC)

| Role      | Permissions                                                                 |
|-----------|-----------------------------------------------------------------------------|
| Student   | Own profile/ledger CRUD, AI reports, identity card view                     |
| Faculty   | Read-only all student ledgers, search/filter, CSV export                   |
| Admin     | Full governance: role management, deletion approvals, audit logs, settings  |
| Pending   | Restricted: Awaiting admin clearance                                        |

**RBAC is enforced in `lib/auth-context.js` and Firestore security rules.**

---

## API Reference

### `POST /api/autofill-section`
Extracts structured data from academic documents.
- **Payload:** `{ section: string, fileData: base64, fileMimeType: string, existingData: Array }`
- **Response:** `{ ...section fields... }`

### `POST /api/analyze-readiness`
Generates a career readiness report.
- **Payload:** `{ profile: Object, academic: Array, skills: Array, ... }`
- **Response:** `{ score, label, summary, strengths, weaknesses, recommendations, careerRoadmap }`

---

## Data Model (Firestore)

**Primary Collections:**
- `users` — Profile data, role, metadata
- `academicRecords` — GPA, semester, branch, roll number
- `achievements` / `activities` — Extracurricular, professional milestones
- `projects` / `skills` — Portfolio and technical skills
- `aiReports` — Placement readiness history
- `auditLogs` — All admin actions (immutable)
- `roleRequests` — Role elevation queue
- `notifications` — In-app notifications

**Indexes:** Composite indexes for fast queries on studentUid, createdAt, etc. (see `firebase/firestore.indexes.json`)
- **Firestore Indexes:**
    ```
    {
  "indexes": [
    {
      "collectionGroup": "academicRecords",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "achievements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "placements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "skills",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "aiReports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userUid", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "roleRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "deletionRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "deletionRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "branch", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "year", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}

    ```

---

## Security & Audit

- **Authentication:** Firebase Auth (email/password)
- **RBAC:** Enforced in code and Firestore rules
- **Audit Logs:** All admin actions (role change, deletion, etc.) are logged with timestamp
- **Data Masking:** Exports mask sensitive info (email, phone)
- **Rate Limiting:** API endpoints are rate-limited per IP
- **Environment Variables:** All secrets in `.env.local` (see `.env.local.example`)
- **Firestore Rules:**
    ```
    service cloud.firestore {
        match /databases/{database}/documents {
            match /{document=**} {
                allow read, write: if request.auth != null;
            }
        }
    }
    ```

---

## Setup & Usage

### 1. Clone & Install
```bash
git clone <github-repo-link>
cd Department-Ledger-Portal
npm install
```

### 2. Environment Configuration
Create `.env.local` (see `.env.local.example`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_GEMINI_MODEL=
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Deployment

- **Vercel:** Recommended for Next.js (auto-detects config)
- **Firebase Hosting:** Supported (configure rewrites for Next.js)
- **Environment:** Set all secrets in Vercel/Firebase dashboard

---

## Advanced: Extending & Customizing

- **Add New Roles:** Update `lib/roles.js` and Firestore rules
- **Custom Sections:** Extend `components/profile/` and API logic
- **AI Model:** Swap Gemini model via `.env.local`
- **UI:** Tailwind CSS for rapid theming
- **Export/Import:** Utilities in `lib/csv-download.js`, `lib/pdf-download.js`

---

## Troubleshooting & FAQ

**Q: Firebase not connecting?**
A: Check `.env.local` and ensure all Firebase keys are correct.

**Q: AI endpoints failing?**
A: Ensure Gemini API key/model are set and valid.

**Q: Permission denied errors?**
A: Check your role and Firestore security rules.

**Q: How to reset a user password?**
A: Use the "Forgot Password" link on the login page.

**Q: How to export data?**
A: Faculty/Admin can export CSV from dashboard or student lists.

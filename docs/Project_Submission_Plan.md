# Project Submission Plan

This file is a submission-ready narrative aligned with the current repository.

## Brief Overview

Department Ledger Portal is a role-based academic records platform that combines Firestore-backed ledgers with Gemini-powered AI assistance.

- Students maintain profile and ledger sections, run Smart Analysis autofill, and generate Career Pulse reports.
- Faculty can review and search student records and export CSVs.
- Admins handle approvals, deletion workflows, and audit monitoring.

## Deployed Prototype

- Live URL: https://department-ledger-portal.vercel.app
- Hosting: Vercel

## Repository

- GitHub: https://github.com/tanish-jain-225/Department-Ledger-Portal

## Google AI Usage

- Model integration: Gemini (via @google/generative-ai)
- Use cases:
  - document-to-form extraction (autofill-section)
  - readiness report generation (analyze-readiness)

## Core Technical Stack

- Next.js 16.2.2
- React 19.2.4
- Firebase Auth + Firestore
- firebase-admin (server-side token verification)
- Tailwind CSS 4.2.2

## Code Areas Reviewers Can Inspect

- pages/api/autofill-section.js
- pages/api/analyze-readiness.js
- pages/admin/requests.js
- pages/admin/audit.js
- lib/data.js
- lib/auth-context.js
- lib/rate-limit.js

## Validation Snapshot (April 8, 2026)

- npm run lint: pass
- npm test: 55 passed
- npm run build: pass

## Quality Hardening Included

- Autofill endpoint enforces supported MIME types and base64 payload validity.
- Readiness endpoint validates and normalizes AI output structure before returning to clients.
- Search fallback implemented for failed-precondition index errors in dashboard student listing.

## Notes for Submission Form

- If asked about cloud hosting on Google Cloud: hosting is Vercel; Google services are used via Firebase and Gemini APIs.
- If asked for architecture: Next.js frontend + serverless API + Firebase + Gemini.

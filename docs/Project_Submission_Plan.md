# GDG Solution Challenge Submission Format

Use this file as direct copy text for the submission portal fields.

## Challenge

[Smart Resource Allocation] Open Innovation

## Submission Window (Reference)

- Starting Date: 14/03/2026 07:00:00 PM (IST)
- Ending Date: 24/04/2026 11:59:00 PM (IST)

## Upload your Prototype deck/presentation

- File type: PDF
- Max size: 5 MB
- Suggested filename: GDGSolutionChallengeSolution.pdf
- Current deck asset in repo: docs/GDG_Solution_Challenge_Solution_PPT_compressed.pdf

## Brief Overview (Copy-Paste Ready)

Department Ledger Portal is an AI-powered academic records platform for colleges and departments. It replaces fragmented spreadsheets and manual tracking with a secure, role-based ledger where students maintain profile information, academic records, achievements, activities, placements, projects, skills, and AI-generated career insights.

The solution addresses data stagnation and slow record handling by allowing document uploads and automatically extracting structured data using Gemini AI. Faculty can quickly search and review student records, while admins maintain governance through role assignment, request approval, audit logging, and secure deletion workflows.

Tech stack: Next.js 16.2.3 (React 19), Tailwind CSS 4.2.2, Firebase Authentication + Firestore, Google Generative AI SDK (Gemini 2.5 Flash), deployed on Vercel.

Google tools use-case: Gemini is used for Smart Analysis document-to-data extraction and Career Pulse readiness scoring. Firebase is used for secure authentication, role-based workflow control, and academic ledger storage.

## Live Prototype Link

https://department-ledger-portal.vercel.app

## GitHub Repository Link

https://github.com/tanish-jain-225/Department-Ledger-Portal

## Demo Video Link

https://drive.google.com/drive/folders/1a2Bklmxa7QwUcPPeY83r4hymXAEa6kbX?usp=sharing

## Have you deployed your solution on Google Cloud?

No

Rationale: The prototype is hosted on Vercel. Google technologies used are Firebase and Gemini APIs.

## Which Google AI model/service have you used?

Gemini 2.5 Flash via the Google Generative AI API.

## Verification Snapshot (April 11, 2026)

- npm run lint: pass
- npm test: 57 passed (10 suites)
- npm run build: pass
- npm run test:e2e: 2 passed

## Reviewer Quick-Inspect Code Paths

- pages/api/autofill-section.js
- pages/api/analyze-readiness.js
- pages/admin/requests.js
- pages/admin/audit.js
- lib/data.js
- lib/auth-context.js
- lib/rate-limit.js

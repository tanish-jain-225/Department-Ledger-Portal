# Department Ledger Portal - Submission Readme

## Submission Instruction

Mandatory to use Submission Template: Download

## Starting Date

14/03/2026 07:00:00 PM(IST)

## Ending Date

24/04/2026 11:59:00 PM(IST)

## Challenges

Smart Resource Allocation - Open Innovation

## Upload your Prototype deck/presentation.

No file chosen

Drop your pdf here or browse

Supports: pdf file upto 5 MB.

## Provide a brief overview of your solution and how it solves the problem.

Department Ledger Portal is an AI-powered academic records platform for colleges and departments. It replaces fragmented spreadsheets and manual tracking with one secure ledger where students manage their profile, academic records, achievements, activities, placements, projects, skills and AI-generated career insights.

The solution solves the problem of data stagnation and slow record handling by letting users upload supporting documents and automatically extract structured data with Gemini AI. Faculty can search and review student records quickly, while admins maintain full governance with role assignment, request approval, audit logging and secure deletion workflows.

Tech stack: Next.js 16.2.2 (React 19.2.4), Tailwind CSS 4.2.2, Firebase Authentication + Firestore, Google Generative AI SDK (Gemini 2.5 Flash), and deployed on Vercel.

Google tools use-case: Gemini is used for Smart Analysis document-to-data extraction and Career Pulse readiness scoring. Firebase is used for secure user authentication, role-based access workflows and real-time academic ledger storage.

## Share the link to your live prototype demonstrating the core functionality.

https://department-ledger-portal.vercel.app

## Share the GitHub Repository link

https://github.com/tanish-jain-225/Department-Ledger-Portal

Note:
URL must include https or http , example: https://github.com/sample_user

## Upload or share the link to a short demo video showcasing your solution and its functionality.

https://drive.google.com/drive/folders/1a2Bklmxa7QwUcPPeY83r4hymXAEa6kbX?usp=sharing

## Have you deployed your solution on the cloud using Google Cloud?

No

The application is deployed on Vercel. It uses Google services for authentication/data/AI integration through Firebase and Gemini, but the hosting target is not Google Cloud.

## Which Google AI model or service have you used in your solution? (e.g., Gemini, Vertex AI, Vision AI)

Gemini 2.5 Flash via the Google Generative AI API

## Project Summary

Department Ledger Portal is built for a three-role academic workflow:

- Student: maintains personal profile, academic ledger, identity card and AI placement readiness report.
- Faculty: reviews student records, searches the student directory and exports masked ledger data.
- Admin: manages role approvals, deletion requests, audit logs and system-wide governance.

## Core Features

- Secure Firebase Auth login and registration flow.
- Pending-role approval workflow after sign-up.
- Student profile management with ledger sections for academic records, achievements, activities, placements, projects and skills.
- Smart Analysis that auto-fills ledger sections from PDF, image, or text uploads.
- Career Pulse AI report that scores placement readiness and generates strengths, gaps and a roadmap.
- Student, faculty and admin dashboards with role-based access control.
- Searchable student directory for staff and admins.
- CSV export for student records and governance data.
- PDF export for identity cards and AI reports.
- Immutable audit trail for administrative actions.
- Real-time notifications for approvals, AI reports and governance events.

## Project Architecture

- Frontend: Next.js 16.2.2 with the Pages Router and React 19.2.4.
- Styling: Tailwind CSS with custom premium UI components.
- Database: Firebase Firestore.
- Authentication: Firebase Authentication with server-side token verification using firebase-admin.
- AI: Google Generative AI SDK calling Gemini models.
- Hosting: Vercel.

## Key Modules In The Codebase

- [pages/index.js](../pages/index.js): landing page and entry flow.
- [pages/profile/index.js](../pages/profile/index.js): student and faculty profile area.
- [pages/dashboard/index.js](../pages/dashboard/index.js): staff-facing student directory.
- [pages/admin/index.js](../pages/admin/index.js): governance dashboard.
- [pages/admin/students.js](../pages/admin/students.js): student registry and role controls.
- [pages/admin/requests.js](../pages/admin/requests.js): role and deletion request review.
- [pages/admin/audit.js](../pages/admin/audit.js): immutable audit log.
- [pages/api/autofill-section.js](../pages/api/autofill-section.js): document extraction and auto-fill.
- [pages/api/analyze-readiness.js](../pages/api/analyze-readiness.js): career readiness scoring.
- [lib/auth-context.js](../lib/auth-context.js): sign-in, registration and role enforcement.
- [lib/notifications.js](../lib/notifications.js): user and admin notifications.
- [lib/data.js](../lib/data.js): Firestore query and record utilities.
- [lib/pdf-download.js](../lib/pdf-download.js): PDF export helper.
- [lib/csv-download.js](../lib/csv-download.js): CSV export helper.

## Implementation Highlights

- New registrations are created with a pending role and cannot access the app until an admin assigns a valid role.
- Route access is enforced centrally through the layout component and role checks.
- AI requests are protected by Firebase ID token verification and rate limits.
- Firestore audit logs are append-only and used for all major admin actions.
- Exported CSVs can mask sensitive fields for safer sharing.
- Profile data is loaded lazily so the main profile page stays responsive.

## Final Submission Notes

- Live prototype: https://department-ledger-portal.vercel.app
- GitHub repository: https://github.com/tanish-jain-225/Department-Ledger-Portal
- Demo video: https://drive.google.com/drive/folders/1a2Bklmxa7QwUcPPeY83r4hymXAEa6kbX?usp=sharing
- Cloud deployment: Vercel hosting with Firebase and Gemini integrations

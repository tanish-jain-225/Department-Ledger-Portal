# Project Deck Plan

Use this as the source content for presentation slides.

Last metrics refresh: June 16, 2026

## Slide Outline (10-12 slides)

1. Title
- Department Ledger Portal
- One-line value proposition

2. Problem
- Fragmented academic data
- Manual entry overhead
- Low governance visibility

3. Solution
- Unified ledger + role workflows + AI support

4. Architecture
- Next.js frontend
- Firebase Auth + Firestore
- Next.js API routes
- Gemini integration

5. Role-Based Flows
- Student: ledger + AI tools
- Faculty: review/search/export
- Admin: approvals, deletion handling, audit log

6. Smart Analysis
- Input file -> API -> Gemini -> validated JSON -> form autofill

7. Career Pulse
- Profile + records -> analysis endpoint -> structured readiness report

8. Security and Governance
- Firebase cryptographic token verification
- Zod runtime schema validation on API routes and auth forms
- Route-level RBAC
- append-only audit trail
- request approval workflows
- admin self-security and role immutability controls

9. Reliability and Quality
- lint, tests, coverage and production build status
- current test total: 199 passing (26 suites)
- Playwright E2E tests: 27 passing (3 suites)
- coverage thresholds enforced (65% branch, 70% func/line/stmt; current 72.5% stmts, 75.4% lines)

10. Evidence Slide (recommended)
- Before: manual record entry workflow
- After: Smart Analysis + Zod-validated JSON autofill workflow
- Show one concrete API request/response example

11. Deployment and Usage
- Vercel deployment
- environment setup overview

12. Roadmap
- stronger distributed rate limiting
- analytics dashboards
- bulk ingestion workflows

13. Closing
- practical institutional impact and extensibility

## Presenter Notes

- Keep language factual and implementation-backed.
- Prefer live screenshots from current build over design-only mockups.
- Do not include features not present in pages/ or pages/api/.
- Keep all numerical claims tied to verifiable artifacts (tests, build output, measured demo timings).

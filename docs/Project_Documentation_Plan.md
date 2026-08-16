# Project Documentation Plan

This file defines how project documentation is maintained so it stays aligned with implementation.

## Scope

Documentation files in this repository:

- README.md
- docs/CHANGELOG.md
- docs/GUIDE.md
- docs/Project_API_Contract.md
- docs/Project_Deck_Plan.md
- docs/Project_Documentation_Plan.md
- docs/Project_Hackathon_Context_Plan.md
- docs/Project_Submission_Plan.md
- docs/VIDEO_DEMO.md

## Alignment Rules

- Every API statement must match current files under pages/api.
- Every role/access statement must match lib/roles.js and lib/route-access.js.
- Test counts must be derived from npm test output, not estimated.
- Environment variable names must match .env.local.example.
- Route lists should be validated with npm run build output.

## Update Procedure

1. Run npm run lint, npm test, npm run test:coverage, npm run test:e2e, npm run build.
2. Note exact outputs (passing/failing, routes, test totals).
3. Update docs to reflect current state only.
4. Remove speculative numbers and unverifiable claims.
5. Re-run npm test after code or test changes.

## Current Verified Baseline (June 16, 2026)

- Lint: passes (ESLint with 0 errors)
- Tests: 164 passed, 22 suites (Jest + fast-check)
- Coverage: Enforced thresholds (65% branches, 70% functions/lines/statements on lib/**)
- Build: passes (Next.js 16.2.3 with Turbopack)
- E2E tests: 27 passed across 3 suites (Playwright)
- API routes: /api/analyze-readiness, /api/autofill-section, /api/health
- API hardening: MIME + base64 validation for autofill, normalized AI readiness response, public-safe health response with token-gated debug details
- Rate limiting: shared Firestore-backed sliding window with in-memory fallback and stale-key cleanup

## Code-to-Doc Mapping

- Auth and pending-role flow: lib/auth-context.js, lib/roles.js
- Route access levels: lib/route-access.js
- Rate limits and constants: lib/constants.js, lib/rate-limit.js
- Data layer and query fallback behavior: lib/data.js
- Security rules and indexes: firebase/firestore.rules, firebase/firestore.indexes.json

## Quality Checklist

- No stale test numbers
- No references to missing files
- No API contract drift
- No contradictory role behavior
- No unverified performance claims

# Project Documentation Plan

This file defines how project documentation is maintained so it stays aligned with implementation.

## Scope

Documentation files in this repository:

- README.md
- docs/Project_Documentation_Plan.md
- docs/Project_Demo_Script_Plan.md
- docs/Project_Hackathon_Context_Plan.md
- docs/Project_Deck_Plan.md
- docs/Project_Submission_Plan.md

## Alignment Rules

- Every API statement must match current files under pages/api.
- Every role/access statement must match lib/roles.js and lib/route-access.js.
- Test counts must be derived from npm test output, not estimated.
- Environment variable names must match .env.local.example.
- Route lists should be validated with npm run build output.

## Update Procedure

1. Run npm run lint, npm test, npm run build.
2. Note exact outputs (passing/failing, routes, test totals).
3. Update docs to reflect current state only.
4. Remove speculative numbers and unverifiable claims.
5. Re-run npm test after code or test changes.

## Current Verified Baseline (April 8, 2026)

- Lint: passes
- Tests: 55 passed, 9 suites
- Build: passes (Next.js 16.2.2)
- API routes: analyze-readiness, autofill-section, health
- API hardening: MIME + base64 validation for autofill, normalized AI readiness response

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

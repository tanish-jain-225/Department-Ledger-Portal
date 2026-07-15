# Changelog

All notable changes to this project are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Security
- Tightened CSP `connect-src` from the overly broad `https:` to a specific allowlist of Firebase, Firestore, Gemini and Google APIs domains.
- Fixed CORS `resolveAllowedOrigin` no-op bug in both API routes — disallowed origins now receive `Access-Control-Allow-Origin: null` instead of the configured origin, making the CORS header itself a correct rejection signal in addition to the downstream 403 guard.
- Hardened Firestore notification `create` rule to require `hasApprovedRole()`, preventing pending/unapproved users from inflating the notifications collection.

### Changed
- `logAudit()` no longer throws when a Firestore write fails — errors are swallowed silently and logged to `console.error`. Audit write failures must never roll back user-facing operations.
- `syncAdminNotifications` now deduplicates by `relatedId` (stable identifier) instead of full message strings, preventing duplicate notifications after message format changes.
- `syncAdminNotifications` is debounced to at most once per 60 seconds per admin UID, preventing triple Firestore query hits on every admin page load.
- `logout()` uses a `finally` block to always reset `isLoggingOut` to `false`, preventing stuck overlay state in future refactors.
- `getRouteAccess()` returns `ACCESS.AUTH` (not `ACCESS.PUBLIC`) for any unregistered path under a protected namespace (`/admin`, `/student`, `/faculty`, `/dashboard`, `/profile`, `/document`).

### Added
- Skip-to-content link (`.skip-link`) as the first focusable element in the Layout component — WCAG 2.1 SC 2.4.1 compliance for keyboard and screen-reader users.
- `aria-expanded` attribute on both mobile hamburger menu buttons, communicating open/closed state to screen readers.
- `aria-label="Main navigation"` on the desktop `<nav>` landmark element.
- `id` attributes on mobile menu containers (`mobile-menu`, `dashboard-mobile-menu`) for `aria-controls` referencing.
- Next.js `images.remotePatterns` configured for Firebase Storage and `images.formats` for AVIF/WebP next-gen compression.
- `npm run test:coverage` script that runs Jest with coverage reporting and enforced thresholds.
- Jest coverage thresholds (65% branches, 70% functions/lines/statements) for `lib/**`.
- Unit tests for `lib/notifications.js` covering `createNotification`, `purgeNotifications`, `markAllAsRead`, `clearAllNotifications` and `syncAdminNotifications` deduplication.
- Unit tests for `lib/audit.js` covering document shape, label derivation and silent failure on Firestore errors.
- Playwright E2E tests for route guard redirects, skip-link focus behavior, `aria-expanded` state, security header validation and the new protected-prefix fallback.

### DevOps
- Removed `continue-on-error: true` from the `npm audit` CI step — high-severity production dependency vulnerabilities now fail the build.
- Added coverage artifact upload step to the CI `verify` job.

---

## [0.1.0] — 2026-06-01

### Added
- **Student Ledger Management**: Full CRUD for academics, achievements, activities, placements, projects and skills.
- **Smart Autofill**: AI-assisted section input from uploaded PDF/image proof documents via Gemini 2.5 Flash.
- **Career Pulse**: AI-generated readiness evaluation with score, strengths, weaknesses and career roadmap.
- **PDF Exporter**: Compile verified portfolios and resumes into downloadable PDFs.
- **Faculty Verification**: Student search with branch/year filtering, ledger review and masked PII CSV exports.
- **Admin Governance**: Role request approval, cascade user deletion with atomic batch transactions.
- **Immutable Audit Log**: Append-only Firestore collection with Firestore rules enforcing `allow update: if false; allow delete: if false`.
- **Notification System**: Real-time notifications with admin broadcast, relatedId-based deduplication and bulk clear.
- **Zero-trust RBAC**: Client-side Layout guards + server-side JWT cryptographic verification + Firestore security rules — triple enforcement.
- **Sliding-window Rate Limiter**: Firestore-backed shared limiter with in-memory fallback for both AI API routes.
- **Security Headers**: CSP, HSTS (with `preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP.
- **Web Worker CSV Export**: Large dataset exports offloaded to a Web Worker to keep the browser UI thread unblocked.
- **CI/CD Pipeline**: GitHub Actions pipeline covering lint, npm audit, unit/property tests (Node 20 + 22 matrix), production build and Playwright E2E smoke tests.
- **Property-based Testing**: `fast-check` fuzz testing for analytics, rate limiting and prompt construction invariants.
- **Privacy Controls**: Student-initiated deletion requests with admin approval and cascade purge.

[Unreleased]: https://github.com/tanish-jain-225/Department-Ledger-Portal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tanish-jain-225/Department-Ledger-Portal/releases/tag/v0.1.0

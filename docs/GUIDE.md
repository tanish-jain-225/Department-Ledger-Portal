# Department Ledger Portal - Developer & Operations Guide (`GUIDE.md`)

This guide provides a comprehensive, end-to-end reference for setting up, running, testing, auditing, and deploying the **Department Ledger Portal**.

---

## 📋 Table of Contents

1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Environment Configuration](#2-environment-configuration)
3. [Installation & Setup](#3-installation--setup)
4. [Local Development Commands](#4-local-development-commands)
5. [Testing & Quality Assurance Commands](#5-testing--quality-assurance-commands)
6. [Security & Dependency Audit Commands](#6-security--dependency-audit-commands)
7. [Production Build & Server Commands](#7-production-build--server-commands)
8. [Firebase & Firestore Rules Deployment](#8-firebase--firestore-rules-deployment)
9. [Automated Pre-Deployment Pipeline](#9-automated-pre-deployment-pipeline)
10. [End-to-End Master Execution Checklist](#10-end-to-end-master-execution-checklist)

---

## 1. Prerequisites & System Requirements

- **Node.js**: Required engine `>=20.19.0` or `>=22.13.0` (Node 20 LTS or Node 22 LTS recommended).
- **Package Manager**: `npm` v10.0+
- **Database & Auth**: A Google Firebase project (Firestore Database + Firebase Authentication enabled).
- **AI Service**: Google Gemini API key (Google AI Studio).
- **Supported Operating Systems**: Windows, Linux, macOS.

Verify your installed Node version:
```bash
node -v
npm -v
```

---

## 2. Environment Configuration

1. Copy the template configuration file:
   ```bash
   # On Windows (PowerShell/CMD):
   copy .env.local.example .env.local

   # On Linux/macOS:
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and populate your project credentials:
   ```env
   # Client Configuration (Shared)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Server Configuration (Private)
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash

   # Security Controls (Optional)
   ALLOWED_ORIGIN=https://department-ledger-portal.vercel.app
   RATE_LIMIT_STORE=shared
   HEALTHCHECK_DEBUG_TOKEN=your_debug_token
   ```

---

## 3. Installation & Setup

Install all dependencies cleanly. The repository uses `overrides` in `package.json` to resolve transitive vulnerabilities cleanly with 0 audit warnings:

```bash
npm install
```

---

## 4. Local Development Commands

### Start Hot-Reloading Development Server
Launches the Next.js development server with Turbopack at `http://localhost:3000`:
```bash
npm run dev
```

### Clean Next.js Cache & Restart Development Server
Wipes `.next` build cache and spins up a fresh dev server (useful if styles or routes cache unexpectedly):
```bash
npm run dev:clean
```

### Clean Next.js Build Cache Only
```bash
npm run clean
```

---

## 5. Testing & Quality Assurance Commands

### Run Unit, Integration & Property-Based Tests
Runs Jest test suites across API auth, audit logging, rate limiters, notifications, route access policies, and RTL components:
```bash
npm test
```

### Run Tests in CI Mode (Non-interactive)
```bash
npm test -- --ci
```

### Run Unit Tests with Coverage Threshold Enforcement
Executes Jest with coverage reporting and enforces project coverage thresholds (65% branches, 70% functions/lines/statements on `lib/**`):
```bash
npm run test:coverage
```

### Run Code Formatting & Lint Checks
Executes ESLint across all `.js`, `.jsx`, and `.mjs` files:
```bash
npm run lint
```

### Install Playwright Browsers (One-Time Setup for E2E Tests)
Installs Chromium browser dependencies needed for end-to-end browser testing:
```bash
npx playwright install --with-deps chromium
```

### Run End-to-End (E2E) Browser Tests
Launches Playwright smoke specs, auth flows, and ledger navigation checks:
```bash
npm run test:e2e
```

---

## 6. Security & Dependency Audit Commands

### Run Security Audit Report
Inspects the dependency tree for known vulnerabilities:
```bash
npm audit
```

### Audit Production Dependencies Only (CI Enforcement)
Fails the build if high-severity or critical vulnerabilities exist in production packages:
```bash
npm audit --omit=dev --audit-level=high
```

---

## 7. Production Build & Server Commands

### Compile Production Build
Compiles and optimizes all Next.js static pages, dynamic server routes, and Turbopack bundles:
```bash
npm run build
```

### Start Compiled Production Server
Launches the compiled production server on port `3000`:
```bash
npm run start
```

---

## 8. Firebase & Firestore Rules Deployment

Deploy Cloud Firestore security rules ([`firebase/firestore.rules`](../firebase/firestore.rules)) and index definitions ([`firebase/firestore.indexes.json`](../firebase/firestore.indexes.json)) to your live Firebase project:

```bash
# Login to Firebase CLI (if not logged in)
npx firebase login

# Deploy Firestore rules and indexes
npx firebase deploy --only firestore:rules,firestore:indexes
```

---

## 9. Automated Pre-Deployment Pipeline

For Windows environments, run the automated pre-deployment batch script [`pre-deploy.bat`](../pre-deploy.bat). This script executes all validation gates sequentially:

```cmd
pre-deploy.bat
```

What `pre-deploy.bat` executes automatically:
1. Cleans existing build cache (`npm run clean`).
2. Runs ESLint checks (`npm run lint`).
3. Runs Jest unit and property-based test suites (`npm test`).
4. Verifies test coverage thresholds (`npm run test:coverage`).
5. Executes Playwright E2E browser tests (`npm run test:e2e`).
6. Pushes Firestore security rules and index definitions (`firebase deploy`).
7. Compiles the Next.js production build (`npm run build`).

---

## 10. End-to-End Master Execution Checklist

Run this single sequence before submitting pull requests or pushing to production:

```bash
# 1. Clean & install dependencies
npm install

# 2. Verify security audit (Must return 0 vulnerabilities)
npm audit

# 3. Run linting
npm run lint

# 4. Run unit and property tests with coverage
npm run test:coverage

# 5. Run Playwright E2E browser tests
npm run test:e2e

# 6. Verify production build compilation
npm run build

# 7. Start local production server for final manual sanity check
npm run start
```

When all 7 steps pass cleanly, your application is 100% verified and ready for live deployment on Vercel! 🚀

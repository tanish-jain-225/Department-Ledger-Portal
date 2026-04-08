# Project Demo Script Plan

Duration: 2-3 minutes

Goal: demonstrate real product behavior that exists in the deployed app.

## Demo Flow

1. Landing and login context (10-15s)
- Show landing page and role-based entry points.

2. Student Smart Analysis (35-45s)
- Open profile ledger section.
- Upload a sample document in Smart Analysis.
- Show AI-generated JSON-based field autofill.
- Mention endpoint: POST /api/autofill-section.
- Mention safeguards: valid file-type checks + malformed payload rejection.

3. Career Pulse report (35-45s)
- Trigger readiness analysis.
- Show score, summary, strengths, weaknesses, recommendations, roadmap.
- Mention endpoint: POST /api/analyze-readiness.
- Mention safeguards: GPA validation + normalized AI response.

4. Faculty/Admin governance (30-40s)
- Show student search and filters.
- Show admin request management and audit logs.
- Mention immutable audit logging and role workflows.

5. Close (10-15s)
- Summarize: AI-assisted data capture + governed academic workflows.

## Narration Guardrails

- Only claim behavior visible in the current build.
- Avoid unverified time/accuracy percentages.
- Use "AI-assisted" rather than absolute automation claims.

## Recording Checklist

- Confirm .env values are set in demo environment.
- Keep one student account and one admin account ready.
- Keep one sample marksheet/certificate file ready.
- Keep browser zoom readable for recording.
- Verify notifications and audit views are populated.
- Keep one "failure path" ready (invalid file type) to show robust error handling if time permits.

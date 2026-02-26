# Schediora Documentation Index

## Product Documents
- Frontend PRD: `docs/frontend-prd.md`
- Frontend Architecture: `docs/frontend-architecture.md`
- Backend PRD: `docs/backend-prd.md`
- Backend Architecture: `docs/backend-architecture.md`
- AI PRD: `docs/ai-prd.md`
- AI Architecture: `docs/ai-architecture.md`

## Runbooks
- End-to-end setup: `docs/setup-end-to-end.md`
- Frontend runbook: `docs/frontend-runbook.md`
- Backend runbook: `docs/backend-runbook.md`
- Local AI model setup: `docs/ai-local-model-setup.md`

## Current Flow Snapshot
- AI plan generation is weekly-gated (once per week when no weekly planner is set).
- Completed AI jobs persist tasks into planner sessions.
- Planner supports manual task add:
  - append to current weekly plan if exists
  - create weekly plan if no current plan exists
- Dashboard metrics are computed from live task sessions and update after status changes.

# Schediora Backend PRD (MVP)

## 1. Overview
Schediora backend provides APIs and asynchronous processing for the mobile AI Study Planner.

## 2. Goals
- Stable API contracts for frontend MVP.
- Fast non-AI endpoint performance (target p95 <= 500ms).
- Async AI execution to keep mobile UX responsive.
- Maintainable codebase via modular monolith architecture.

## 3. Scope
### In Scope (MVP)
- Auth and token lifecycle.
- User onboarding preferences.
- Study plan and session lifecycle.
- Dashboard summary datasets.
- AI plan generation jobs.
- Health checks, migrations, and logging.

### Out of Scope (MVP)
- Billing and subscriptions.
- Real-time collaboration.
- Public third-party API exposure.

## 4. Functional Requirements
- Auth:
  - register, login, refresh, logout
- User:
  - get profile, update preferences
- Planner:
  - list sessions, create plan, append session to current plan, update session status
- Dashboard:
  - summary by range (7d/30d) derived from live `study_sessions`
- AI:
  - create generation job, poll job status, weekly generation status
  - enforce one weekly planner generation window
  - persist generated tasks into planner sessions

## 5. Non-Functional Requirements
- API prefix `/api/v1`.
- Strict request validation.
- Schema changes through Alembic only.
- Structured logs.
- Queue-backed AI processing.

## 6. API Contract (MVP)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/preferences`
- `GET /api/v1/plans`
- `POST /api/v1/plans`
- `GET /api/v1/sessions?week=current|all`
- `POST /api/v1/plans/current/sessions`
- `PATCH /api/v1/sessions/{id}`
- `GET /api/v1/dashboard/summary?range=7d|30d`
- `POST /api/v1/ai/plans/generate`
- `GET /api/v1/ai/plans/status/weekly`
- `GET /api/v1/ai/jobs/{id}`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

## 7. Data Model
- users
- refresh_tokens
- onboarding_preferences
- study_plans
- study_sessions
- ai_jobs
- dashboard_daily_metrics (legacy table; current dashboard summary reads from `study_sessions`)

## 8. Security Baseline
- Password hashing: Argon2.
- JWT access + refresh strategy.
- Environment-based secret and CORS config.

## 9. Success Metrics
- 5xx rate < 1%.
- Auth success >= 99%.
- AI job completion >= 95%.

## 10. Acceptance Criteria
- API contract is fully available.
- DB migration runs from clean state.
- AI jobs move queued -> running -> completed/failed.
- AI generation is blocked when current weekly planner already exists.
- AI completion persists plan tasks into `study_sessions`.

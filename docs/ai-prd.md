# Schediora AI PRD (Local Model MVP)

## 1. Objective
Provide a fully local, no-paid-API AI plan generation capability using Ollama.

## 2. Scope
- Generate study plan from goal + topic.
- Async job lifecycle support.
- Polling endpoint for status and result.
- Persist job output and errors.
- Return normalized structured result (`title`, `summary`, `steps[]`) for stable frontend rendering.
- Enforce weekly generation policy (one generated plan per week per user).
- Persist generated plan as executable planner tasks (`study_sessions`).

## 3. User Story
- User taps `Generate AI Plan` in the app.
- App shows processing status.
- User receives structured result and sees tasks in Planner tab when completed.

## 4. Functional Requirements
- Trigger endpoint: `POST /api/v1/ai/plans/generate`.
- Weekly status endpoint: `GET /api/v1/ai/plans/status/weekly`.
- Poll endpoint: `GET /api/v1/ai/jobs/{id}`.
- Worker statuses: `queued`, `running`, `completed`, `failed`.
- Job response includes:
  - `result` (raw generated text)
  - `result_structured` (normalized plan payload for UI mapping)
- Trigger endpoint returns `409` when weekly planner already set.

## 5. Quality Targets
- Typical local completion <= 8-12s (7B model).
- AI completion rate >= 95%.
- App remains responsive while job runs.

## 6. Model Strategy
- Default: `qwen2.5:7b`.
- Optional lighter fallback: `qwen2.5:3b`.
- Runtime configured via env.

## 7. Risks
- Task registration mismatch in Celery.
- Queue mismatch between producer and worker.
- Ollama running without required model.

## 8. Mitigation
- Run worker on queue `ai`.
- Verify task registration via Celery inspect.
- Validate model availability with `ollama list`.

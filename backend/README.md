# Schediora Backend

Backend service for Schediora AI Study Planner using FastAPI + PostgreSQL + Redis + Celery.

## Quick start

1. Copy env

```bash
cp .env.example .env
```

2. Install dependencies (example with uv)

```bash
uv sync
```

3. Run API

```bash
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

4. Run worker

```bash
uv run celery -A app.workers.celery_app.celery_app worker -l INFO
```

## Project docs

- `../docs/backend-prd.md`
- `../docs/backend-architecture.md`

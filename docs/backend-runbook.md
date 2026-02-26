# Schediora Backend Runbook

## 1. Local Setup
```bash
cd backend
cp .env.example .env
```

## 2. Dependencies
### Option A: uv
```bash
uv sync
```

### Option B: venv + pip
```bash
python3 -m venv .venv --upgrade-deps
source .venv/bin/activate
python -m ensurepip --upgrade || true
python -m pip install -U pip
python -m pip install fastapi "uvicorn[standard]" sqlalchemy "psycopg[binary]" alembic \
  pydantic-settings "python-jose[cryptography]" "passlib[argon2]" redis celery httpx \
  email-validator pytest pytest-asyncio ruff mypy
```

## 3. Start Infra
```bash
docker compose up -d postgres redis
```

## 4. Run Migrations
```bash
python -m alembic upgrade head
```

## 5. Run Services
API:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

Worker:
```bash
python -m celery -A app.workers.celery_app.celery_app worker -Q ai -l INFO
```

## 6. Smoke Checks
```bash
curl http://localhost:8000/api/v1/health/live
curl http://localhost:8000/api/v1/health/ready
```

With auth token:
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/api/v1/ai/plans/status/weekly
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:8000/api/v1/sessions?week=current"
```

## 7. Troubleshooting
- `No module named pip`:
  - recreate venv with `--upgrade-deps`.
- Alembic cannot import `app`:
  - run from backend root and use configured `alembic/env.py` path bootstrap.
- Celery unregistered task:
  - verify registered tasks:
  - `python -m celery -A app.workers.celery_app.celery_app inspect registered`
- AI jobs stuck queued:
  - ensure worker is listening to `-Q ai`.
- AI generation returns 409:
  - weekly planner already exists; this is expected behavior.

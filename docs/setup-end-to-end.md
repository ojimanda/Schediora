# Schediora End-to-End Setup (Frontend + Backend + Local AI)

## 1. Prerequisites
- macOS
- Xcode + Command Line Tools
- Node.js >= 20
- Python 3.11+
- Docker Desktop
- Homebrew
- CocoaPods

## 2. Clone and Prepare
```bash
git clone <YOUR_REPOSITORY_URL>
cd Schediora
```

## 3. Backend Setup
```bash
cd backend
python3 -m venv .venv --upgrade-deps
source .venv/bin/activate
python -m ensurepip --upgrade || true
python -m pip install -U pip
python -m pip install fastapi "uvicorn[standard]" sqlalchemy "psycopg[binary]" alembic \
  pydantic-settings "python-jose[cryptography]" "passlib[argon2]" redis celery httpx \
  email-validator pytest pytest-asyncio ruff mypy
cp .env.example .env
docker compose up -d postgres redis
python -m alembic upgrade head
```

Run API:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

Run worker (new terminal):
```bash
cd backend
source .venv/bin/activate
python -m celery -A app.workers.celery_app.celery_app worker -Q ai -l INFO
```

## 4. Local AI Setup
```bash
brew install ollama
ollama serve
ollama pull qwen2.5:7b
```

## 5. Frontend Setup
```bash
cd mobile
npm install
cd ios && pod install
```

Run frontend:
```bash
cd mobile
npm start -- --reset-cache
```

Then:
```bash
npm run ios
```

## 6. Verification
- Backend health:
```bash
curl http://localhost:8000/api/v1/health/live
```
- AI model:
```bash
ollama list
```
- Worker registration:
```bash
cd backend
source .venv/bin/activate
python -m celery -A app.workers.celery_app.celery_app inspect registered
```
- App flow:
  - login/register
  - if weekly plan not set, tap `Generate AI Plan`
  - open Planner tab and confirm tasks are created
  - update task status and confirm dashboard charts/progress change

## 7. Common Issues
- `No module named pip`:
  - recreate venv with `--upgrade-deps`.
- `Received unregistered task`:
  - restart worker with `-Q ai` and confirm registered tasks.
- `AI job timeout`:
  - ensure API + worker + Ollama are all running.

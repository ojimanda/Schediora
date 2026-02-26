.PHONY: up down api worker lint typecheck test smoke migrate

up:
	docker compose up -d postgres redis

down:
	docker compose down

api:
	uv run uvicorn app.main:app --reload --port 8000

worker:
	uv run celery -A app.workers.celery_app.celery_app worker -l INFO

migrate:
	uv run alembic upgrade head

lint:
	uv run ruff check .

typecheck:
	uv run mypy app

test:
	uv run pytest -q

smoke:
	curl -s http://localhost:8000/api/v1/health/live
	curl -s http://localhost:8000/api/v1/health/ready

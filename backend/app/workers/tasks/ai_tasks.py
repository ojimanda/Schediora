from __future__ import annotations

import logging
import re
from datetime import UTC, datetime, time, timedelta

from sqlalchemy import select

from app.db.models import AiJob, StudyPlan, StudySession
from app.db.session import SessionLocal
from app.services.ai_plan_formatter import normalize_ai_plan
from app.services.ai_service import generate_study_plan
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name='app.workers.tasks.ai_tasks.generate_plan_task')
def generate_plan_task(job_id: str, goal: str, topic: str) -> dict:
    db = SessionLocal()
    try:
        job = db.scalar(select(AiJob).where(AiJob.id == job_id))
        if not job:
            logger.warning('AI job missing job_id=%s', job_id)
            return {'job_id': job_id, 'status': 'missing'}

        job.status = 'running'
        job.updated_at = datetime.now(UTC)
        db.commit()

        result = generate_study_plan(goal=goal, topic=topic)
        structured = normalize_ai_plan(result, goal=goal, topic=topic)
        _persist_weekly_plan_from_ai(
            db=db,
            user_id=job.user_id,
            topic=topic,
            structured=structured,
        )

        job.status = 'completed'
        job.result_text = result
        job.updated_at = datetime.now(UTC)
        db.commit()

        logger.info('AI job completed job_id=%s', job_id)
        return {'job_id': job_id, 'status': 'completed'}
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        job = db.scalar(select(AiJob).where(AiJob.id == job_id))
        if job:
            job.status = 'failed'
            job.error = str(exc)
            job.updated_at = datetime.now(UTC)
            db.commit()
        logger.exception('AI job failed job_id=%s', job_id)
        return {'job_id': job_id, 'status': 'failed'}
    finally:
        db.close()


def enqueue_generate_plan(job_id: str, goal: str, topic: str) -> None:
    generate_plan_task.delay(job_id=job_id, goal=goal, topic=topic)


def _persist_weekly_plan_from_ai(db, user_id: str, topic: str, structured: dict) -> None:
    now = datetime.now(UTC)
    week_start_date = now.date() - timedelta(days=now.date().weekday())
    week_start = datetime.combine(week_start_date, time.min, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)

    existing_week_plan = db.scalar(
        select(StudyPlan.id).where(
            StudyPlan.user_id == user_id,
            StudyPlan.created_at >= week_start,
            StudyPlan.created_at < week_end,
        )
    )
    if existing_week_plan:
        return

    steps = structured.get('steps') or []
    if not isinstance(steps, list):
        steps = []

    normalized_steps = [step for step in steps if isinstance(step, dict) and str(step.get('title') or '').strip()]
    if not normalized_steps:
        normalized_steps = [{'title': structured.get('summary') or f'{topic} review', 'detail': None}]

    estimated_total = sum(_estimate_duration_minutes(step.get('title', ''), step.get('detail', '')) for step in normalized_steps)
    plan = StudyPlan(
        user_id=user_id,
        title=str(structured.get('title') or f'{topic} Weekly Plan')[:180],
        topic=topic,
        duration_minutes=max(estimated_total, 30),
        status='pending',
    )
    db.add(plan)
    db.flush()

    for index, step in enumerate(normalized_steps[:10]):
        title = str(step.get('title') or '').strip()
        detail = str(step.get('detail') or '').strip()
        merged_title = f'{title} - {detail}' if detail else title
        scheduled_at = _build_schedule_time(week_start, index)
        db.add(
            StudySession(
                plan_id=plan.id,
                user_id=user_id,
                title=merged_title[:180],
                topic=topic,
                duration_minutes=_estimate_duration_minutes(title, detail),
                status='pending',
                scheduled_at=scheduled_at,
            )
        )


def _build_schedule_time(week_start: datetime, index: int) -> datetime:
    # Distribute tasks across weekdays first; additional tasks use a second/third slot
    # on the same weekday instead of collapsing all extras into Sunday.
    day_offset = index % 7
    slot_index = index // 7
    slot_hours = [10, 14, 18]
    hour = slot_hours[min(slot_index, len(slot_hours) - 1)]
    return week_start + timedelta(days=day_offset, hours=hour)


def _estimate_duration_minutes(title: str, detail: str) -> int:
    text = f'{title} {detail}'
    match = re.search(r'(\d{2,3})\s*(min|minute|minutes)', text, re.I)
    if match:
        value = int(match.group(1))
        return max(20, min(value, 180))
    return 45

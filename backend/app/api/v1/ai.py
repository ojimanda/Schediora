from __future__ import annotations

import uuid
from datetime import UTC, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.db.models import AiJob, StudyPlan, User
from app.schemas.ai import AiWeeklyStatusResponse, GeneratePlanRequest, JobResponse
from app.services.ai_plan_formatter import normalize_ai_plan
from app.workers.tasks.ai_tasks import enqueue_generate_plan

router = APIRouter(prefix='/ai', tags=['ai'])


def _current_week_bounds() -> tuple[datetime, datetime]:
    now = datetime.now(UTC)
    week_start_date = now.date() - timedelta(days=now.date().weekday())
    week_start = datetime.combine(week_start_date, time.min, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


@router.post('/plans/generate', response_model=JobResponse)
def generate_plan(
    payload: GeneratePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    week_start, week_end = _current_week_bounds()

    existing_week_plan = db.scalar(
        select(StudyPlan.id).where(
            StudyPlan.user_id == current_user.id,
            StudyPlan.created_at >= week_start,
            StudyPlan.created_at < week_end,
        )
    )
    if existing_week_plan:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Weekly planner already set. You can generate a new AI plan next week.',
        )

    job_id = str(uuid.uuid4())

    db.add(
        AiJob(
            id=job_id,
            user_id=current_user.id,
            goal=payload.goal,
            topic=payload.topic,
            status='queued',
        )
    )
    db.commit()

    enqueue_generate_plan(job_id=job_id, goal=payload.goal, topic=payload.topic)
    return JobResponse(job_id=job_id, status='queued')


@router.get('/plans/status/weekly', response_model=AiWeeklyStatusResponse)
def weekly_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AiWeeklyStatusResponse:
    week_start, week_end = _current_week_bounds()
    has_generated = db.scalar(
        select(AiJob.id).where(
            AiJob.user_id == current_user.id,
            AiJob.status == 'completed',
            AiJob.created_at >= week_start,
            AiJob.created_at < week_end,
        )
    )
    return AiWeeklyStatusResponse(has_generated_this_week=bool(has_generated))


@router.get('/jobs/{job_id}', response_model=JobResponse)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    job = db.scalar(select(AiJob).where(AiJob.id == job_id, AiJob.user_id == current_user.id))
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')

    structured = None
    if job.status == 'completed':
        structured = normalize_ai_plan(job.result_text or '', goal=job.goal, topic=job.topic)

    return JobResponse(
        job_id=job.id,
        status=job.status,
        result=job.result_text,
        result_structured=structured,
    )

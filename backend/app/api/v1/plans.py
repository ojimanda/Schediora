from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.db.models import StudyPlan, StudySession, User
from app.schemas.common import MessageResponse
from app.schemas.plans import (
    StudySessionCreateRequest,
    SessionUpdateRequest,
    StudyPlanCreateRequest,
    StudyPlanResponse,
    StudySessionResponse,
)

router = APIRouter(prefix='', tags=['plans'])


def _current_week_bounds() -> tuple[datetime, datetime]:
    today = datetime.now(UTC).date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=7)
    return (
        datetime.combine(week_start, time.min, tzinfo=UTC),
        datetime.combine(week_end, time.min, tzinfo=UTC),
    )


@router.get('/plans', response_model=list[StudyPlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StudyPlanResponse]:
    plans = db.scalars(select(StudyPlan).where(StudyPlan.user_id == current_user.id)).all()
    return [
        StudyPlanResponse(
            id=item.id,
            title=item.title,
            topic=item.topic,
            duration_minutes=item.duration_minutes,
            status=item.status,
        )
        for item in plans
    ]


@router.get('/sessions', response_model=list[StudySessionResponse])
def list_sessions(
    week: str = Query(default='current', pattern='^(current|all)$'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StudySessionResponse]:
    query = select(StudySession).where(StudySession.user_id == current_user.id)

    if week == 'current':
        today = datetime.now(UTC).date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=7)
        week_start_dt = datetime.combine(week_start, time.min, tzinfo=UTC)
        week_end_dt = datetime.combine(week_end, time.min, tzinfo=UTC)
        query = query.where(
            StudySession.created_at >= week_start_dt,
            StudySession.created_at < week_end_dt,
        )

    sessions = db.scalars(query.order_by(StudySession.created_at.asc())).all()
    return [
        StudySessionResponse(
            id=item.id,
            plan_id=item.plan_id,
            title=item.title,
            topic=item.topic,
            duration_minutes=item.duration_minutes,
            status=item.status,  # type: ignore[arg-type]
            scheduled_at=item.scheduled_at,
        )
        for item in sessions
    ]


@router.post('/plans', response_model=StudyPlanResponse)
def create_plan(
    payload: StudyPlanCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StudyPlanResponse:
    plan = StudyPlan(
        user_id=current_user.id,
        title=payload.title,
        topic=payload.topic,
        duration_minutes=payload.duration_minutes,
        status='pending',
    )
    db.add(plan)
    db.flush()

    db.add(
        StudySession(
            plan_id=plan.id,
            user_id=current_user.id,
            title=payload.title,
            topic=payload.topic,
            duration_minutes=payload.duration_minutes,
            status='pending',
            scheduled_at=datetime.now(UTC),
        )
    )
    db.commit()

    return StudyPlanResponse(
        id=plan.id,
        title=plan.title,
        topic=plan.topic,
        duration_minutes=plan.duration_minutes,
        status=plan.status,
    )


@router.post('/plans/current/sessions', response_model=StudySessionResponse)
def add_session_to_current_plan(
    payload: StudySessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StudySessionResponse:
    week_start, week_end = _current_week_bounds()
    plan = db.scalar(
        select(StudyPlan)
        .where(
            StudyPlan.user_id == current_user.id,
            StudyPlan.created_at >= week_start,
            StudyPlan.created_at < week_end,
        )
        .order_by(StudyPlan.created_at.asc())
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Current weekly plan not found')

    session = StudySession(
        plan_id=plan.id,
        user_id=current_user.id,
        title=payload.title,
        topic=payload.topic,
        duration_minutes=payload.duration_minutes,
        status='pending',
        scheduled_at=datetime.now(UTC),
    )
    db.add(session)

    plan.duration_minutes = max(30, plan.duration_minutes + payload.duration_minutes)
    if plan.status == 'done':
        plan.status = 'in_progress'

    db.commit()
    db.refresh(session)

    return StudySessionResponse(
        id=session.id,
        plan_id=session.plan_id,
        title=session.title,
        topic=session.topic,
        duration_minutes=session.duration_minutes,
        status=session.status,  # type: ignore[arg-type]
        scheduled_at=session.scheduled_at,
    )


@router.patch('/sessions/{session_id}', response_model=MessageResponse)
def update_session(
    session_id: str,
    payload: SessionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    session = db.scalar(
        select(StudySession).where(StudySession.id == session_id, StudySession.user_id == current_user.id)
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')

    session.status = payload.status  # type: ignore[assignment]
    session.completed_at = datetime.now(UTC) if payload.status == 'done' else None

    if session.plan_id:
        sibling_sessions = db.scalars(select(StudySession).where(StudySession.plan_id == session.plan_id)).all()
        plan = db.scalar(select(StudyPlan).where(StudyPlan.id == session.plan_id, StudyPlan.user_id == current_user.id))
        if plan and sibling_sessions:
            statuses = {item.status for item in sibling_sessions}
            if statuses == {'done'}:
                plan.status = 'done'
            elif 'in_progress' in statuses:
                plan.status = 'in_progress'
            else:
                plan.status = 'pending'

    db.commit()

    return MessageResponse(message='session updated')

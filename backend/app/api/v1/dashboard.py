from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.db.models import StudySession, User
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


def _session_schedule_day(item: StudySession) -> date:
    if item.scheduled_at:
        return item.scheduled_at.date()
    return item.created_at.date()


def _session_done_day(item: StudySession) -> date | None:
    if item.status != 'done' or not item.completed_at:
        return None
    return item.completed_at.date()


def _compute_streak(done_days: set[date], today: date) -> int:
    streak = 0
    cursor = today
    while cursor in done_days:
        streak += 1
        cursor = cursor - timedelta(days=1)
    return streak


@router.get('/summary', response_model=DashboardSummaryResponse)
def summary(
    range_key: Literal['7d', '30d'] = Query(default='7d', alias='range'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummaryResponse:
    today = datetime.now(UTC).date()
    days = 7 if range_key == '7d' else 30
    since = today - timedelta(days=days - 1)

    sessions = db.scalars(select(StudySession).where(StudySession.user_id == current_user.id)).all()

    sessions_in_window = [item for item in sessions if _session_schedule_day(item) >= since]

    today_total = sum(1 for item in sessions if _session_schedule_day(item) == today)
    today_completed = sum(1 for item in sessions if _session_done_day(item) == today)

    done_days = {_session_done_day(item) for item in sessions if _session_done_day(item)}
    streak = _compute_streak({item for item in done_days if item}, today)

    completed_by_day: dict[date, int] = defaultdict(int)
    for item in sessions:
        done_day = _session_done_day(item)
        if done_day and done_day >= since:
            completed_by_day[done_day] += 1

    if range_key == '7d':
        week_start = today - timedelta(days=today.weekday())
        weekly_progress = [
            completed_by_day.get(week_start + timedelta(days=offset), 0)
            for offset in range(7)
        ]
    else:
        buckets: list[int] = []
        for offset in range(0, 30, 4):
            start = today - timedelta(days=offset + 3)
            end = today - timedelta(days=offset)
            value = sum(count for day, count in completed_by_day.items() if start <= day <= end)
            buckets.append(value)
        weekly_progress = list(reversed(buckets))[:7]

    focus_minutes_trend = []
    for chunk in range(4):
        end = today - timedelta(days=(3 - chunk) * 7)
        start = end - timedelta(days=6)
        minutes = sum(
            item.duration_minutes
            for item in sessions
            if (_session_done_day(item) and start <= _session_done_day(item) <= end)
        )
        focus_minutes_trend.append({'label': f'W{chunk + 1}', 'minutes': minutes})

    subject_totals: dict[str, int] = defaultdict(int)
    for item in sessions_in_window:
        if item.status == 'done':
            subject_totals[item.topic] += item.duration_minutes

    if not subject_totals:
        for item in sessions_in_window:
            subject_totals[item.topic] += item.duration_minutes

    if not subject_totals:
        subject_distribution = [
            {'subject': 'Math', 'minutes': 0},
            {'subject': 'Biology', 'minutes': 0},
            {'subject': 'English', 'minutes': 0},
        ]
    else:
        subject_distribution = [
            {'subject': key, 'minutes': value}
            for key, value in sorted(subject_totals.items(), key=lambda row: row[1], reverse=True)[:4]
        ]

    return DashboardSummaryResponse(
        today_completed=today_completed,
        today_total=today_total,
        streak_days=streak,
        weekly_progress=weekly_progress,
        focus_minutes_trend=focus_minutes_trend,
        subject_distribution=subject_distribution,
    )

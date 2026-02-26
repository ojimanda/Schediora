from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.db.models import OnboardingPreference, User
from app.schemas.common import MessageResponse
from app.schemas.users import PreferencesRequest, UserMeResponse

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me', response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user)) -> UserMeResponse:
    return UserMeResponse(id=current_user.id, email=current_user.email)


@router.put('/preferences', response_model=MessageResponse)
def update_preferences(
    payload: PreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    current = db.scalar(select(OnboardingPreference).where(OnboardingPreference.user_id == current_user.id))

    if current:
        current.goal = payload.goal
        current.daily_hours = payload.daily_hours
        current.focus_topics = payload.focus_topics
        current.updated_at = datetime.now(UTC)
    else:
        db.add(
            OnboardingPreference(
                user_id=current_user.id,
                goal=payload.goal,
                daily_hours=payload.daily_hours,
                focus_topics=payload.focus_topics,
            )
        )

    db.commit()
    return MessageResponse(message='preferences updated')

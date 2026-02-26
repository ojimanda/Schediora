from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class StudyPlanCreateRequest(BaseModel):
    title: str
    topic: str
    duration_minutes: int


class StudyPlanResponse(BaseModel):
    id: str
    title: str
    topic: str
    duration_minutes: int
    status: str


class SessionUpdateRequest(BaseModel):
    status: Literal['pending', 'in_progress', 'done']


class StudySessionResponse(BaseModel):
    id: str
    plan_id: str | None
    title: str
    topic: str
    duration_minutes: int
    status: Literal['pending', 'in_progress', 'done']
    scheduled_at: datetime | None


class StudySessionCreateRequest(BaseModel):
    title: str
    topic: str
    duration_minutes: int

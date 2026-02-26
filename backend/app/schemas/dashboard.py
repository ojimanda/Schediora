from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    today_completed: int
    today_total: int
    streak_days: int
    weekly_progress: list[int]
    focus_minutes_trend: list[dict]
    subject_distribution: list[dict]

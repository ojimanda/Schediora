from pydantic import BaseModel


class UserMeResponse(BaseModel):
    id: str
    email: str


class PreferencesRequest(BaseModel):
    goal: str
    daily_hours: int
    focus_topics: list[str]

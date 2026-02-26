from pydantic import BaseModel


class GeneratePlanRequest(BaseModel):
    goal: str
    topic: str


class StructuredPlanStep(BaseModel):
    title: str
    detail: str | None = None


class StructuredPlanResult(BaseModel):
    title: str
    summary: str
    steps: list[StructuredPlanStep]


class JobResponse(BaseModel):
    job_id: str
    status: str
    result: str | None = None
    result_structured: StructuredPlanResult | None = None


class AiWeeklyStatusResponse(BaseModel):
    has_generated_this_week: bool

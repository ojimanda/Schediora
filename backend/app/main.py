from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging

configure_logging()

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.include_router(api_router, prefix=settings.api_prefix)


@app.get('/')
def root() -> dict[str, str]:
    return {'message': 'Schediora backend is running'}

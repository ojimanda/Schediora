from celery import Celery

from app.core.config import settings

celery_app = Celery(
    'schediora',
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=['app.workers.tasks.ai_tasks'],
)
celery_app.conf.task_default_queue = 'ai'
celery_app.conf.task_create_missing_queues = True
celery_app.conf.task_routes = {
    'app.workers.tasks.ai_tasks.generate_plan_task': {'queue': 'ai'},
}

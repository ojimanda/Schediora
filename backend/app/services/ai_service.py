import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_study_plan(goal: str, topic: str) -> str:
    prompt = (
        'Return ONLY valid JSON with this exact shape:\n'
        '{\n'
        '  "title": "string",\n'
        '  "summary": "string",\n'
        '  "steps": [\n'
        '    {"title": "string", "detail": "string"}\n'
        '  ]\n'
        '}\n\n'
        f'Goal: {goal}\n'
        f'Topic: {topic}\n\n'
        'Rules:\n'
        '- Keep steps actionable and concise.\n'
        '- Use 6-10 steps.\n'
        '- Do not include markdown, checklist markers, or prose outside JSON.\n'
    )

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    'model': settings.ollama_model,
                    'prompt': prompt,
                    'stream': False,
                    'format': 'json',
                    'options': {'temperature': 0.2},
                },
            )
            response.raise_for_status()
            payload = response.json()
            return payload.get('response', 'No response')
    except Exception as exc:  # noqa: BLE001
        logger.warning('Ollama request failed: %s', exc)
        return 'AI generation unavailable, fallback response.'

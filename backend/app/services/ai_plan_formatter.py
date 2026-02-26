from __future__ import annotations

import json
import re


def normalize_ai_plan(raw_text: str, *, goal: str, topic: str) -> dict:
    parsed_json = _try_parse_json_plan(raw_text)
    if parsed_json:
        normalized = _normalize_structured_plan(parsed_json, goal=goal, topic=topic)
        if normalized['steps']:
            return normalized

    expanded_lines: list[str] = []
    for source_line in raw_text.splitlines():
        expanded_lines.extend(_split_checkbox_segments(source_line))

    cleaned_lines = [_clean_line(line) for line in expanded_lines]
    cleaned_lines = [line for line in cleaned_lines if line and not _is_non_actionable(line)]

    summary = cleaned_lines[0] if cleaned_lines else f'Study plan for {goal} ({topic}).'
    if _is_section_heading(summary):
        summary = f'Study plan for {goal} ({topic}).'
    steps: list[dict] = []

    for line in cleaned_lines[1:]:
        if _is_section_heading(line) or not steps:
            steps.append({'title': line, 'detail': None})
            continue

        previous = steps[-1]
        if _should_attach_as_detail(previous['title'], line):
            detail = ' • '.join(item for item in [previous.get('detail'), line] if item)
            previous['detail'] = detail
            continue

        steps.append({'title': line, 'detail': None})

    if not steps:
        steps = [{'title': summary, 'detail': None}]

    return {
        'title': _clean_line(f'{topic} Study Plan'),
        'summary': summary,
        'steps': steps[:10],
    }


def _try_parse_json_plan(raw_text: str) -> dict | None:
    body = raw_text.strip()
    if not body:
        return None

    # Handle markdown fenced JSON.
    fenced = re.search(r'```(?:json)?\s*(\{[\s\S]*\})\s*```', body, re.I)
    if fenced:
        body = fenced.group(1).strip()

    candidates = [body]

    # Handle model outputs that prepend/append text around JSON.
    start = body.find('{')
    end = body.rfind('}')
    if start != -1 and end != -1 and start < end:
        candidates.append(body[start : end + 1])

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except Exception:  # noqa: BLE001
            continue

        if isinstance(data, dict):
            return data

    return None


def _normalize_structured_plan(payload: dict, *, goal: str, topic: str) -> dict:
    title = _clean_line(str(payload.get('title') or f'{topic} Study Plan'))
    summary = _clean_line(str(payload.get('summary') or f'Study plan for {goal} ({topic}).'))

    raw_steps = payload.get('steps')
    if not isinstance(raw_steps, list):
        raw_steps = []

    steps: list[dict] = []
    for item in raw_steps:
        if isinstance(item, dict):
            step_title = _clean_line(str(item.get('title') or ''))
            step_detail = _clean_line(str(item.get('detail') or ''))
        else:
            step_title = _clean_line(str(item))
            step_detail = ''

        if not step_title:
            continue

        steps.append(
            {
                'title': step_title,
                'detail': step_detail or None,
            }
        )

    return {
        'title': title or f'{topic} Study Plan',
        'summary': summary or f'Study plan for {goal} ({topic}).',
        'steps': steps[:10],
    }


def _clean_line(line: str) -> str:
    value = line.strip()
    value = re.sub(r'^#{1,6}\s*', '', value)
    value = re.sub(r'^(\d+[).]|[-*•])\s*', '', value)
    value = re.sub(r'^\[(x|X| )\]\s*', '', value)
    value = re.sub(r'\*\*(.*?)\*\*', r'\1', value)
    value = re.sub(r'^\*+|\*+$', '', value)
    value = re.sub(r'\[(x|X| )\]\s*', '', value)
    value = re.sub(r'__(.*?)__', r'\1', value)
    value = re.sub(r'`([^`]+)`', r'\1', value)
    value = re.sub(r'\s+', ' ', value)
    return value.strip()


def _is_non_actionable(line: str) -> bool:
    if line in {'*', '**'}:
        return True
    return bool(re.search(r"^(certainly|sure|great|awesome|here('?|’)s).*(study plan|tailored)", line, re.I))


def _is_section_heading(line: str) -> bool:
    return bool(re.search(r'^(week|day|phase|step|session)\b', line, re.I))


def _should_attach_as_detail(previous_title: str, line: str) -> bool:
    if _is_section_heading(previous_title):
        return True

    if re.search(r'(such as|including|include|focus on)\s*$', previous_title, re.I):
        return True

    return len(line) > 55


def _split_checkbox_segments(line: str) -> list[str]:
    raw = line.strip()
    if not raw:
        return []

    # Split lines that contain multiple markdown checklist items.
    segments = re.split(r'(?=\[(?:x|X| )\]\s+)', raw)
    normalized = [segment.strip() for segment in segments if segment.strip()]
    return normalized or [raw]

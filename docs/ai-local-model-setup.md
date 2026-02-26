# Schediora Local AI Model Setup (Ollama)

## 1. Install Ollama
```bash
brew install ollama
```

## 2. Start Service
```bash
ollama serve
```

## 3. Pull Model
```bash
ollama pull qwen2.5:7b
```

## 4. Validate Model
```bash
ollama run qwen2.5:7b "Create a short biology study plan"
```

## 5. Backend Env
Set in `backend/.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

## 6. Validate End-to-End
1. Start API and worker.
2. Trigger AI from app or curl.
3. Poll job status until `completed`.

Example trigger:
```bash
curl -X POST http://localhost:8000/api/v1/ai/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"goal":"Semester Exam","topic":"Math"}'
```

Example polling:
```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8000/api/v1/ai/jobs/<JOB_ID>
```

## 7. Runtime Checks
- `ollama list` includes configured model.
- Worker logs show task reception and completion.
- Job API returns result text.

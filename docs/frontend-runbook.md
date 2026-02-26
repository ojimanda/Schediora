# Schediora Frontend Runbook

## 1. Prerequisites
- macOS + Xcode
- Node.js >= 20
- npm
- CocoaPods

## 2. Install Dependencies
```bash
cd mobile
npm install
```

## 3. iOS Setup
```bash
cd mobile/ios
pod install
```

## 4. Run App
Metro terminal:
```bash
cd mobile
npm start -- --reset-cache
```

App terminal:
```bash
cd mobile
npm run ios
```

## 5. API Base URL
Configured in:
- `mobile/src/shared/services/api/config.ts`

Defaults:
- iOS simulator: `127.0.0.1:8000`
- Android emulator: `10.0.2.2:8000`

## 6. Current Integration Status
- Auth is integrated with backend.
- AI `Generate AI Plan` flow is integrated (queue + polling + weekly lock awareness).
- Dashboard summary is integrated with backend (`GET /dashboard/summary`) and derived from live task sessions.
- Planner is integrated with sessions API (`GET /sessions?week=current`) in timeline/board views.
- Planner mutations are wired:
  - `PATCH /sessions/{id}` for status updates
  - `POST /plans/current/sessions` for manual append to current weekly plan
  - `POST /plans` as fallback when no weekly plan exists

## 7. Troubleshooting
- Icon font issues:
  - run `rnvi-update-plist` and `pod install`.
- No visible AI action:
  - if planner already exists this week, CTA is intentionally hidden.
  - ensure backend API, worker, and Ollama are running.
- AI timeout in app:
  - verify worker receives task and job status progresses.
- Dashboard/Planner empty:
  - verify authenticated user has `study_sessions` data in backend DB.

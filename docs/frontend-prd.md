# Schediora Frontend PRD (MVP)

## 1. Product Summary
Schediora is an AI-powered Study Planner mobile app. The frontend focuses on fast planning, daily execution, and progress tracking with a smooth mobile experience.

## 2. Goals
- Let users create a personal study setup in under 3 minutes.
- Provide a clear daily dashboard (progress, tasks, next action).
- Keep AI interactions short, useful, and actionable.
- Maintain smooth UX on mid-range devices.

## 3. Non-Goals (MVP)
- Social features (leaderboards, friends).
- Subscription and monetization flows.
- Full offline-first sync.
- Third-party LMS integrations.

## 4. Target Users
- Students (high school and university) aged 15-24.
- Users who need structure and consistency for study sessions.

## 5. Core User Problems
- Not sure where to start studying.
- Inconsistent study schedule.
- No clear feedback on weekly progress.

## 6. Success Metrics (MVP)
- Onboarding completion rate >= 70%.
- Day-1 retention >= 35%.
- Users creating at least 1 study plan on day 1 >= 60%.
- Completed study tasks per user per week >= 5.
- Dashboard chart interaction rate >= 50% of WAU.

## 7. Feature Scope

### 7.1 Onboarding
- Study goal selection (exam, semester prep, certification).
- Daily availability setup.
- Priority topics selection.

### 7.2 Authentication
- Email + password.
- OAuth placeholders (Google/Apple).
- Session persistence and auto-login.

### 7.3 Dashboard
- Today summary (completed/total, streak, next session).
- Main CTA: `Generate AI Plan` (visible only when weekly plan not set).
- Charts:
  - weekly completion (bar)
  - focus trend (line)
  - subject distribution (donut)
  - range switcher (7D/30D)

### 7.4 Study Plan
- Daily session timeline view.
- Status board view (pending, in progress, done).
- Session status (`pending`, `in_progress`, `done`).
- Quick actions wired to backend (`pending`, `in_progress`, `done`).
- Manual task input form (title, topic, duration).
- Manual task behavior:
  - append to current weekly plan if exists
  - otherwise create weekly plan with first task

### 7.5 AI Assistant
- Generate plan from goal + topic.
- Async status updates and interactive result rendering (step checklist + progress).
- AI generated plan is persisted into planner tasks and reflected in dashboard metrics.

### 7.6 Profile & Settings
- Preferences.
- Reminder toggle.
- Logout.

## 8. Primary User Flow
1. Splash -> Onboarding -> Auth.
2. User enters dashboard.
3. If weekly plan not set, user taps `Generate AI Plan`.
4. User sees AI status/result and tasks appear in Planner.
5. User can add extra manual tasks from Planner.
6. User updates task statuses; dashboard updates accordingly.

## 9. Screens
- Splash
- Onboarding
- Auth (Login/Register)
- Dashboard
- Planner
- Profile

## 10. UX Requirements
- Complete loading, empty, error, success states.
- Reusable and consistent UI components.
- Readable charts on small devices.
- Smooth transitions for range switching.

## 11. Technical Requirements
- React Native + TypeScript.
- React Navigation.
- Zustand + TanStack Query.
- Typed API layer.
- Async storage for session persistence.

## 12. Risks and Mitigations
- AI latency:
  - async job + polling + clear status UI.
- Onboarding drop-off:
  - short steps and clear progress.
- UI inconsistency:
  - shared design system components.

## 13. Release Plan
1. App shell + navigation + auth UI.
2. Onboarding + dashboard with mock data.
3. API integration for auth and AI.
4. Dashboard/planner read API integration and QA.
5. Planner status mutations, AI weekly lock, and manual append to current plan.

## 14. Current Implementation Status
- Auth integration (FE -> BE): done.
- Session persistence (tokens + onboarding flag): done.
- `Generate AI Plan` with polling: done.
- Dashboard summary API integration (`/dashboard/summary`): done.
- AI weekly generation status/lock UI: done.
- Planner source switched to sessions API (`/sessions`) with timeline/board UI: done.
- Planner status mutation (`PATCH /sessions/{id}`): done.
- Manual planner input with append-to-current-plan behavior: done.

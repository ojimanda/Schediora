import { apiRequest } from '../../../shared/services/api/client';

export type StudyTaskStatus = 'pending' | 'in_progress' | 'done';

export type StudyTaskVM = {
  id: string;
  planId?: string | null;
  title: string;
  topic: string;
  durationMinutes: number;
  status: StudyTaskStatus;
  scheduledAt?: string | null;
};

type StudySessionApi = {
  id: string;
  plan_id?: string | null;
  title: string;
  topic: string;
  duration_minutes: number;
  status: string;
  scheduled_at?: string | null;
};

type StudyPlanCreateApiPayload = {
  title: string;
  topic: string;
  duration_minutes: number;
};

export async function getStudyTasks(token: string): Promise<StudyTaskVM[]> {
  const response = await apiRequest<StudySessionApi[]>('/sessions?week=current', {
    method: 'GET',
    token,
  });

  return response.map(item => ({
    id: item.id,
    planId: item.plan_id,
    title: item.title,
    topic: item.topic,
    durationMinutes: item.duration_minutes,
    status: toValidStatus(item.status),
    scheduledAt: item.scheduled_at ?? null,
  }));
}

export async function updateStudyTaskStatus(token: string, sessionId: string, status: StudyTaskStatus) {
  return apiRequest<{ message: string }>(`/sessions/${sessionId}`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function createManualPlan(token: string, payload: StudyPlanCreateApiPayload) {
  return apiRequest<{ id: string; title: string }>('/plans', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function addTaskToCurrentPlan(token: string, payload: StudyPlanCreateApiPayload) {
  return apiRequest<{ id: string; plan_id: string | null }>('/plans/current/sessions', {
    method: 'POST',
    token,
    body: payload,
  });
}

function toValidStatus(value: string): StudyTaskStatus {
  if (value === 'in_progress' || value === 'done' || value === 'pending') {
    return value;
  }
  return 'pending';
}

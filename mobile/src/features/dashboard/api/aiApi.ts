import { apiRequest } from '../../../shared/services/api/client';

type GeneratePlanPayload = {
  goal: string;
  topic: string;
};

export type AiWeeklyStatusResponse = {
  has_generated_this_week: boolean;
};

export type AiJobResponse = {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | string;
  result?: string | null;
  result_structured?: {
    title: string;
    summary: string;
    steps: { title: string; detail?: string | null }[];
  } | null;
};

export function generateAiPlan(token: string, payload: GeneratePlanPayload) {
  return apiRequest<AiJobResponse>('/ai/plans/generate', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getAiJob(token: string, jobId: string) {
  return apiRequest<AiJobResponse>(`/ai/jobs/${jobId}`, {
    method: 'GET',
    token,
  });
}

export function getWeeklyAiStatus(token: string) {
  return apiRequest<AiWeeklyStatusResponse>('/ai/plans/status/weekly', {
    method: 'GET',
    token,
  });
}

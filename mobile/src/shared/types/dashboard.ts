export type DashboardChartRange = '7d' | '30d';

export type StudyPlanCardVM = {
  id: string;
  title: string;
  topic: string;
  durationMinutes: number;
  scheduledAt: string;
  status: 'pending' | 'in_progress' | 'done';
};

export type DashboardSummaryVM = {
  todayCompleted: number;
  todayTotal: number;
  streakDays: number;
  weeklyProgress: number[];
  focusMinutesTrend: { label: string; minutes: number }[];
  subjectDistribution: { subject: string; minutes: number; color: string }[];
  nextSession?: StudyPlanCardVM;
};

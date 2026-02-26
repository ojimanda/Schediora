import { colors } from '../../../app/theme/tokens';
import { apiRequest } from '../../../shared/services/api/client';
import { DashboardChartRange, DashboardSummaryVM } from '../../../shared/types/dashboard';

type DashboardSummaryApi = {
  today_completed: number;
  today_total: number;
  streak_days: number;
  weekly_progress: number[];
  focus_minutes_trend: { label: string; minutes: number }[];
  subject_distribution: { subject: string; minutes: number }[];
};

const chartPalette = [colors.chartBlue, colors.chartMint, colors.chartAmber, colors.chartViolet, colors.chartRose];

export async function getDashboardSummary(
  token: string,
  range: DashboardChartRange,
): Promise<DashboardSummaryVM> {
  const response = await apiRequest<DashboardSummaryApi>(`/dashboard/summary?range=${range}`, {
    method: 'GET',
    token,
  });

  return {
    todayCompleted: response.today_completed,
    todayTotal: response.today_total,
    streakDays: response.streak_days,
    weeklyProgress: response.weekly_progress,
    focusMinutesTrend: response.focus_minutes_trend,
    subjectDistribution: response.subject_distribution.map((item, index) => ({
      ...item,
      color: chartPalette[index % chartPalette.length],
    })),
  };
}

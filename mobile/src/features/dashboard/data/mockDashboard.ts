import { colors } from '../../../app/theme/tokens';
import { DashboardChartRange, DashboardSummaryVM } from '../../../shared/types/dashboard';

const baseSummary: Omit<DashboardSummaryVM, 'weeklyProgress' | 'focusMinutesTrend' | 'subjectDistribution'> = {
  todayCompleted: 3,
  todayTotal: 5,
  streakDays: 6,
  nextSession: {
    id: 'session-next-1',
    title: 'Biology - Cell Structure',
    topic: 'Biology',
    durationMinutes: 45,
    scheduledAt: '18:30',
    status: 'pending',
  },
};

const dataByRange: Record<DashboardChartRange, DashboardSummaryVM> = {
  '7d': {
    ...baseSummary,
    weeklyProgress: [1, 2, 0, 3, 2, 4, 3],
    focusMinutesTrend: [
      { label: 'W1', minutes: 210 },
      { label: 'W2', minutes: 240 },
      { label: 'W3', minutes: 190 },
      { label: 'W4', minutes: 280 },
    ],
    subjectDistribution: [
      { subject: 'Math', minutes: 180, color: colors.chartBlue },
      { subject: 'Biology', minutes: 120, color: colors.chartMint },
      { subject: 'English', minutes: 90, color: colors.chartAmber },
      { subject: 'Chemistry', minutes: 70, color: colors.chartViolet },
    ],
  },
  '30d': {
    ...baseSummary,
    weeklyProgress: [8, 9, 7, 10, 12, 11, 13],
    focusMinutesTrend: [
      { label: 'W1', minutes: 820 },
      { label: 'W2', minutes: 760 },
      { label: 'W3', minutes: 910 },
      { label: 'W4', minutes: 1030 },
    ],
    subjectDistribution: [
      { subject: 'Math', minutes: 640, color: colors.chartBlue },
      { subject: 'Biology', minutes: 520, color: colors.chartMint },
      { subject: 'English', minutes: 360, color: colors.chartAmber },
      { subject: 'Chemistry', minutes: 290, color: colors.chartViolet },
    ],
  },
};

export async function getMockDashboardSummary(range: DashboardChartRange): Promise<DashboardSummaryVM> {
  await new Promise(resolve => setTimeout(() => resolve(undefined), 280));
  return dataByRange[range];
}

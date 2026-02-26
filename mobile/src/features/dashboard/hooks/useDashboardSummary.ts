import { useQuery } from '@tanstack/react-query';

import { DashboardChartRange } from '../../../shared/types/dashboard';
import { getDashboardSummary } from '../api/dashboardApi';

export function useDashboardSummary(range: DashboardChartRange, token: string | null) {
  return useQuery({
    queryKey: ['dashboard-summary', range, token],
    queryFn: () => getDashboardSummary(token as string, range),
    enabled: Boolean(token),
    placeholderData: previousData => previousData,
    refetchInterval: 15000,
  });
}

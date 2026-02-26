import { useQuery } from '@tanstack/react-query';

import { getStudyTasks } from '../api/plansApi';

export function useStudyTasks(token: string | null) {
  return useQuery({
    queryKey: ['study-sessions', token],
    queryFn: () => getStudyTasks(token as string),
    enabled: Boolean(token),
    placeholderData: previousData => previousData,
    refetchInterval: 15000,
  });
}

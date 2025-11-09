import { useQuery } from '@tanstack/react-query';
import { getContributionStats, type ContributionStatsResponse } from '../services/api';

export function useContributionStats() {
  return useQuery<ContributionStatsResponse>({
    queryKey: ['contribution-stats'],
    queryFn: () => getContributionStats(),
  });
}

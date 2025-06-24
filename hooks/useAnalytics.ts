import { analyticsService, ShowAnalytics } from '@/services/analytics';
import { UserShowWithDetails } from '@/types';
import { useMemo } from 'react';

export function useAnalytics(userShows: UserShowWithDetails[]) {
  const statistics = useMemo(() => {
    return analyticsService.calculateWatchStatistics(userShows);
  }, [userShows]);

  const getShowAnalytics = (show: UserShowWithDetails): ShowAnalytics => {
    return analyticsService.getShowAnalytics(show);
  };

  const formatWatchTime = (minutes: number): string => {
    return analyticsService.formatWatchTime(minutes);
  };

  return {
    statistics,
    getShowAnalytics,
    formatWatchTime,
  };
}

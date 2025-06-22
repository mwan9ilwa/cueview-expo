import { useAuth } from '@/contexts/SimpleAuthContext';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { useEffect, useState } from 'react';

interface HomeScreenData {
  trendingShows: TMDbShow[];
  popularShows: TMDbShow[];
  topRatedShows: TMDbShow[];
  continueWatching: TMDbShow[];
  upcomingEpisodes: any[];
  loading: boolean;
  error: string | null;
}

export function useHomeScreenData(): HomeScreenData {
  const { user } = useAuth();
  const [data, setData] = useState<HomeScreenData>({
    trendingShows: [],
    popularShows: [],
    topRatedShows: [],
    continueWatching: [],
    upcomingEpisodes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadHomeScreenData();
  }, [user]);

  const loadHomeScreenData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch trending, popular, and top-rated shows in parallel
      const [trendingResponse, popularResponse, topRatedResponse] = await Promise.all([
        tmdbService.getTrendingShows('week'),
        tmdbService.getPopularShows(1),
        tmdbService.getTopRatedShows(1),
      ]);

      // TODO: Fetch user's continue watching shows from database
      // This would require querying the user's show library with status 'watching'
      const continueWatching: TMDbShow[] = [];

      // TODO: Fetch upcoming episodes for user's shows
      // This would require getting air dates for shows in user's library
      const upcomingEpisodes: any[] = [];

      setData({
        trendingShows: trendingResponse.results.slice(0, 10),
        popularShows: popularResponse.results.slice(0, 10),
        topRatedShows: topRatedResponse.results.slice(0, 10),
        continueWatching,
        upcomingEpisodes,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading home screen data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load shows. Please check your connection.',
      }));
    }
  };

  return data;
}

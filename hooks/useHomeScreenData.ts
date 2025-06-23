import { useAuth } from '@/contexts/SimpleAuthContext';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { userLibraryService } from '@/services/user-library';
import { useCallback, useEffect, useState } from 'react';

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

  const loadHomeScreenData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch trending, popular, and top-rated shows in parallel
      const [trendingResponse, popularResponse, topRatedResponse] = await Promise.all([
        tmdbService.getTrendingShows('week'),
        tmdbService.getPopularShows(1),
        tmdbService.getTopRatedShows(1),
      ]);

      // Fetch user's continue watching shows from database
      let continueWatching: TMDbShow[] = [];
      if (user) {
        try {
          const watchingShowsWithDetails = await userLibraryService.getUserShowsWithDetails(user.id);
          const watchingShows = watchingShowsWithDetails.filter(show => show.status === 'watching');
          
          // Convert cached shows to TMDbShow format for continue watching
          continueWatching = watchingShows
            .map(userShow => {
              if (!userShow.showDetails) return null;
              
              return {
                id: userShow.showDetails.id,
                name: userShow.showDetails.name,
                overview: userShow.showDetails.overview,
                poster_path: userShow.showDetails.poster_path,
                backdrop_path: userShow.showDetails.backdrop_path,
                first_air_date: userShow.showDetails.first_air_date,
                last_air_date: userShow.showDetails.last_air_date,
                number_of_episodes: userShow.showDetails.number_of_episodes,
                number_of_seasons: userShow.showDetails.number_of_seasons,
                status: userShow.showDetails.status,
                vote_average: userShow.showDetails.vote_average,
                vote_count: 0, // Not available in cached data
                genres: userShow.showDetails.genres,
                networks: userShow.showDetails.networks.map((network: any) => ({
                  ...network,
                  logo_path: null, // Not available in cached data
                })),
                created_by: [], // Not available in cached data
                episode_run_time: [], // Not available in cached data
                in_production: false, // Not available in cached data
                origin_country: [], // Not available in cached data
                original_language: '', // Not available in cached data
                original_name: userShow.showDetails.name,
                popularity: 0, // Not available in cached data
                tagline: '', // Not available in cached data
              } as TMDbShow;
            })
            .filter(show => show !== null) as TMDbShow[];
        } catch (error) {
          console.error('Error loading continue watching shows:', error);
        }
      }

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
  }, [user]);

  useEffect(() => {
    loadHomeScreenData();
  }, [loadHomeScreenData]);

  return data;
}

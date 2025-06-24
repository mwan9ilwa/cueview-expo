import { useAuth } from '@/contexts/SimpleAuthContext';
import { realTimeEpisodeService, UpcomingEpisode } from '@/services/real-time-episodes';
import { useEffect, useState } from 'react';

export function useRealTimeEpisodes() {
  const { user } = useAuth();
  const [episodesAiringToday, setEpisodesAiringToday] = useState<UpcomingEpisode[]>([]);
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<UpcomingEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setEpisodesAiringToday([]);
      setUpcomingEpisodes([]);
      setLoading(false);
      return;
    }

    const loadEpisodes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [airingToday, upcoming] = await Promise.all([
          realTimeEpisodeService.getEpisodesAiringToday(user.id),
          realTimeEpisodeService.getUpcomingEpisodes(user.id, 7)
        ]);
        
        setEpisodesAiringToday(airingToday);
        setUpcomingEpisodes(upcoming);
      } catch (err) {
        console.error('Error loading real-time episodes:', err);
        setError('Failed to load episode information');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();

    // Set up real-time updates
    const handleUpdate = (episodes: UpcomingEpisode[]) => {
      setEpisodesAiringToday(episodes);
    };

    realTimeEpisodeService.startRealTimeUpdates(user.id, handleUpdate);

    // Cleanup
    return () => {
      realTimeEpisodeService.stopRealTimeUpdates();
    };
  }, [user?.id]);

  const refreshEpisodes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [airingToday, upcoming] = await Promise.all([
        realTimeEpisodeService.getEpisodesAiringToday(user.id),
        realTimeEpisodeService.getUpcomingEpisodes(user.id, 7)
      ]);
      
      setEpisodesAiringToday(airingToday);
      setUpcomingEpisodes(upcoming);
    } catch (err) {
      console.error('Error refreshing episodes:', err);
      setError('Failed to refresh episode information');
    } finally {
      setLoading(false);
    }
  };

  return {
    episodesAiringToday,
    upcomingEpisodes,
    loading,
    error,
    refreshEpisodes,
  };
}

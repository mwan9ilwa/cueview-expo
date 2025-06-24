import { UserShowWithDetails } from '@/types';
import { tmdbService } from './tmdb';
import { userLibraryService } from './user-library';

interface UpcomingEpisode {
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: Date;
  stillPath?: string;
  overview?: string;
}

interface AiringToday {
  episodes: UpcomingEpisode[];
  lastUpdated: Date;
}

class RealTimeEpisodeService {
  private static instance: RealTimeEpisodeService;
  private airingTodayCache: Map<string, AiringToday> = new Map();
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  public static getInstance(): RealTimeEpisodeService {
    if (!RealTimeEpisodeService.instance) {
      RealTimeEpisodeService.instance = new RealTimeEpisodeService();
    }
    return RealTimeEpisodeService.instance;
  }

  /**
   * Get episodes airing today for user's watching shows
   */
  public async getEpisodesAiringToday(userId: string): Promise<UpcomingEpisode[]> {
    try {
      const userShows = await userLibraryService.getShowsByStatus(userId, 'watching');
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const airingEpisodes: UpcomingEpisode[] = [];

      for (const userShow of userShows) {
        try {
          // Get show details to find current season
          const showDetails = await tmdbService.getShowDetails(userShow.showId);
          
          // Check if show is currently airing
          if (showDetails.status === 'Ended' || showDetails.status === 'Canceled') {
            continue;
          }

          // Get the next season to check (user's current season or latest)
          const currentSeason = userShow.currentSeason || showDetails.number_of_seasons;
          
          // Get season details
          const seasonDetails = await tmdbService.getSeasonDetails(userShow.showId, currentSeason);
          
          // Find episodes airing today
          for (const episode of seasonDetails.episodes || []) {
            if (episode.air_date === todayStr) {
              airingEpisodes.push({
                showId: userShow.showId,
                showName: showDetails.name,
                seasonNumber: episode.season_number,
                episodeNumber: episode.episode_number,
                episodeName: episode.name,
                airDate: new Date(episode.air_date),
                stillPath: episode.still_path || undefined,
                overview: episode.overview,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to get episodes for show ${userShow.showId}:`, error);
        }
      }

      return airingEpisodes;
    } catch (error) {
      console.error('Error getting episodes airing today:', error);
      return [];
    }
  }

  /**
   * Get upcoming episodes in the next week
   */
  public async getUpcomingEpisodes(userId: string, days: number = 7): Promise<UpcomingEpisode[]> {
    try {
      const userShows = await userLibraryService.getShowsByStatus(userId, 'watching');
      const today = new Date();
      const endDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const upcomingEpisodes: UpcomingEpisode[] = [];

      for (const userShow of userShows) {
        try {
          const showDetails = await tmdbService.getShowDetails(userShow.showId);
          
          if (showDetails.status === 'Ended' || showDetails.status === 'Canceled') {
            continue;
          }

          // Check current and next season
          const seasonsToCheck = [
            userShow.currentSeason || 1,
            (userShow.currentSeason || 1) + 1
          ].filter(s => s <= showDetails.number_of_seasons);

          for (const seasonNum of seasonsToCheck) {
            try {
              const seasonDetails = await tmdbService.getSeasonDetails(userShow.showId, seasonNum);
              
              for (const episode of seasonDetails.episodes || []) {
                if (episode.air_date) {
                  const airDate = new Date(episode.air_date);
                  if (airDate >= today && airDate <= endDate) {
                    // Check if user has already watched this episode
                    const isWatched = userShow.watchedEpisodes.some(
                      we => we.seasonNumber === episode.season_number && 
                            we.episodeNumber === episode.episode_number
                    );

                    if (!isWatched) {
                      upcomingEpisodes.push({
                        showId: userShow.showId,
                        showName: showDetails.name,
                        seasonNumber: episode.season_number,
                        episodeNumber: episode.episode_number,
                        episodeName: episode.name,
                        airDate,
                        stillPath: episode.still_path || undefined,
                        overview: episode.overview,
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.warn(`Failed to get season ${seasonNum} for show ${userShow.showId}:`, error);
            }
          }
        } catch (error) {
          console.warn(`Failed to get show details for ${userShow.showId}:`, error);
        }
      }

      // Sort by air date
      return upcomingEpisodes.sort((a, b) => a.airDate.getTime() - b.airDate.getTime());
    } catch (error) {
      console.error('Error getting upcoming episodes:', error);
      return [];
    }
  }

  /**
   * Get next episode for a specific show
   */
  public async getNextEpisodeForShow(userShow: UserShowWithDetails): Promise<UpcomingEpisode | null> {
    try {
      const showDetails = await tmdbService.getShowDetails(userShow.showId);
      
      if (showDetails.status === 'Ended' || showDetails.status === 'Canceled') {
        return null;
      }

      const currentSeason = userShow.currentSeason || 1;
      const currentEpisode = userShow.currentEpisode || 0;

      // Check current season first for next episode
      try {
        const seasonDetails = await tmdbService.getSeasonDetails(userShow.showId, currentSeason);
        
        for (const episode of seasonDetails.episodes || []) {
          if (episode.episode_number > currentEpisode && episode.air_date) {
            const airDate = new Date(episode.air_date);
            if (airDate >= new Date()) {
              return {
                showId: userShow.showId,
                showName: showDetails.name,
                seasonNumber: episode.season_number,
                episodeNumber: episode.episode_number,
                episodeName: episode.name,
                airDate,
                stillPath: episode.still_path || undefined,
                overview: episode.overview,
              };
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to get current season for show ${userShow.showId}:`, error);
      }

      // Check next season if no episodes found in current season
      if (currentSeason < showDetails.number_of_seasons) {
        try {
          const nextSeasonDetails = await tmdbService.getSeasonDetails(userShow.showId, currentSeason + 1);
          
          if (nextSeasonDetails.episodes && nextSeasonDetails.episodes.length > 0) {
            const firstEpisode = nextSeasonDetails.episodes[0];
            if (firstEpisode.air_date) {
              const airDate = new Date(firstEpisode.air_date);
              if (airDate >= new Date()) {
                return {
                  showId: userShow.showId,
                  showName: showDetails.name,
                  seasonNumber: firstEpisode.season_number,
                  episodeNumber: firstEpisode.episode_number,
                  episodeName: firstEpisode.name,
                  airDate,
                  stillPath: firstEpisode.still_path || undefined,
                  overview: firstEpisode.overview,
                };
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to get next season for show ${userShow.showId}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting next episode for show ${userShow.showId}:`, error);
      return null;
    }
  }

  /**
   * Start automatic updates for real-time data
   */
  public startRealTimeUpdates(userId: string, onUpdate: (episodes: UpcomingEpisode[]) => void) {
    // Update every hour
    this.updateInterval = setInterval(async () => {
      try {
        const episodes = await this.getEpisodesAiringToday(userId);
        onUpdate(episodes);
      } catch (error) {
        console.error('Error during real-time update:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Initial update
    this.getEpisodesAiringToday(userId).then(onUpdate).catch(console.error);
  }

  /**
   * Stop automatic updates
   */
  public stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Check if a show has been renewed/cancelled
   */
  public async checkShowStatus(showId: number): Promise<{
    status: string;
    statusChanged: boolean;
    previousStatus?: string;
  }> {
    try {
      const showDetails = await tmdbService.getShowDetails(showId);
      const cachedShow = await userLibraryService.getCachedShowData(showId);
      
      const statusChanged = cachedShow && cachedShow.status !== showDetails.status;
      
      return {
        status: showDetails.status,
        statusChanged: statusChanged || false,
        previousStatus: cachedShow?.status,
      };
    } catch (error) {
      console.error(`Error checking status for show ${showId}:`, error);
      return {
        status: 'Unknown',
        statusChanged: false,
      };
    }
  }
}

export const realTimeEpisodeService = RealTimeEpisodeService.getInstance();
export type { UpcomingEpisode };

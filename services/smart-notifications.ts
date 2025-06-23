import * as Notifications from 'expo-notifications';
import { tmdbService } from './tmdb';
import { userLibraryService } from './user-library';

export class SmartNotificationService {
  // Check for new episodes and notify users
  async checkForNewEpisodes(userId: string) {
    try {
      const userShows = await userLibraryService.getUserShows(userId);
      const watchingShows = userShows.filter(show => 
        show.status === 'watching' && 
        show.reminderSettings?.notifyOnNewEpisodes
      );

      for (const userShow of watchingShows) {
        await this.checkShowForNewEpisodes(userId, userShow);
      }
    } catch (error) {
      console.error('Error checking for new episodes:', error);
    }
  }

  private async checkShowForNewEpisodes(userId: string, userShow: any) {
    try {
      const showDetails = await tmdbService.getShowDetails(userShow.showId);
      const currentSeason = userShow.currentSeason || 1;
      const currentEpisode = userShow.currentEpisode || 0;

      // Check if there are newer episodes available
      if (showDetails.number_of_seasons > currentSeason) {
        // New season available
        await this.sendNewSeasonNotification(userShow, currentSeason + 1);
      } else if (showDetails.number_of_seasons === currentSeason) {
        // Check for new episodes in current season
        const seasonData = await tmdbService.getSeasonDetails(userShow.showId, currentSeason);
        if (seasonData.episodes.length > currentEpisode) {
          await this.sendNewEpisodeNotification(userShow, currentSeason, currentEpisode + 1);
        }
      }
    } catch (error) {
      console.error('Error checking show for new episodes:', error);
    }
  }

  private async sendNewEpisodeNotification(userShow: any, season: number, episode: number) {
    const showDetails = await userLibraryService.getCachedShowData(userShow.showId);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Episode Available!',
        body: `${showDetails?.name || 'Your show'} S${season}E${episode} is now available`,
        data: { showId: userShow.showId, season, episode, type: 'new_episode' },
      },
      trigger: null, // Send immediately
    });
  }

  private async sendNewSeasonNotification(userShow: any, season: number) {
    const showDetails = await userLibraryService.getCachedShowData(userShow.showId);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Season Available!',
        body: `${showDetails?.name || 'Your show'} Season ${season} is now available`,
        data: { showId: userShow.showId, season, type: 'new_season' },
      },
      trigger: null, // Send immediately
    });
  }

  // Recommendation engine based on user's watch history
  async generateRecommendations(userId: string) {
    try {
      const userShows = await userLibraryService.getUserShows(userId);
      const watchedShows = userShows.filter(show => show.status === 'watched');
      
      if (watchedShows.length === 0) {
        return this.getPopularShows();
      }

      // Extract genres from watched shows
      const genres = new Map<number, number>();
      const networks = new Map<number, number>();
      
      for (const userShow of watchedShows) {
        const showDetails = await userLibraryService.getCachedShowData(userShow.showId);
        if (showDetails) {
          // Count genre preferences
          showDetails.genres.forEach((genre: any) => {
            genres.set(genre.id, (genres.get(genre.id) || 0) + 1);
          });
          
          // Count network preferences
          showDetails.networks.forEach((network: any) => {
            networks.set(network.id, (networks.get(network.id) || 0) + 1);
          });
        }
      }

      // Get top genres
      const topGenres = Array.from(genres.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genreId]) => genreId);

      // Get recommendations based on top genres
      return await this.getRecommendationsByGenres(topGenres);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getPopularShows();
    }
  }

  private async getRecommendationsByGenres(genreIds: number[]) {
    // This would call TMDb API to get shows by genres
    // For now, return empty array
    return [];
  }

  private async getPopularShows() {
    // Fallback to popular shows
    return await tmdbService.getPopularShows();
  }

  // Setup notification scheduling
  async setupNotificationSchedule(userId: string) {
    // Schedule daily check for new episodes
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Checking for new episodes...',
        body: 'CueView is checking for new episodes of your shows',
      },
      trigger: {
        type: 'calendar',
        hour: 9, // 9 AM
        minute: 0,
        repeats: true,
      } as any,
    });
  }
}

export const smartNotificationService = new SmartNotificationService();

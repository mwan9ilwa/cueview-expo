import { ShowStatus, UserShow } from '@/types';
import { dbService } from './database';
import { TMDbShow } from './tmdb';

class UserLibraryService {
  private userShows: Map<string, UserShow[]> = new Map(); // Cache by userId
  private initialized = false;

  async init() {
    if (!this.initialized) {
      await dbService.init();
      this.initialized = true;
    }
  }

  async getUserShows(userId: string): Promise<UserShow[]> {
    await this.init();
    
    // Check cache first
    if (this.userShows.has(userId)) {
      return this.userShows.get(userId)!;
    }

    // Load from database
    const shows = await dbService.getUserShows(userId);
    this.userShows.set(userId, shows);
    return shows;
  }

  async getShowsByStatus(userId: string, status: ShowStatus): Promise<UserShow[]> {
    const allShows = await this.getUserShows(userId);
    return allShows.filter(show => show.status === status);
  }

  async addShowToLibrary(
    userId: string, 
    show: TMDbShow, 
    status: ShowStatus = 'want-to-watch'
  ): Promise<void> {
    await this.init();

    const userShow: UserShow = {
      id: `${userId}_${show.id}`,
      userId,
      showId: show.id,
      status,
      watchedEpisodes: [],
      addedAt: new Date(),
      updatedAt: new Date(),
    };

    await dbService.saveUserShow(userShow);
    
    // Update cache
    const userShows = this.userShows.get(userId) || [];
    const existingIndex = userShows.findIndex(s => s.showId === show.id);
    
    if (existingIndex >= 0) {
      userShows[existingIndex] = userShow;
    } else {
      userShows.unshift(userShow); // Add to beginning
    }
    
    this.userShows.set(userId, userShows);

    // Cache the show data for offline access
    await this.cacheShowData(show);
  }

  async removeShowFromLibrary(userId: string, showId: number): Promise<void> {
    await this.init();

    const userShowId = `${userId}_${showId}`;
    await dbService.deleteUserShow(userShowId);
    
    // Update cache
    const userShows = this.userShows.get(userId) || [];
    const updatedShows = userShows.filter(show => show.showId !== showId);
    this.userShows.set(userId, updatedShows);
  }

  async updateShowStatus(
    userId: string, 
    showId: number, 
    status: ShowStatus
  ): Promise<void> {
    await this.init();

    const userShows = await this.getUserShows(userId);
    const userShow = userShows.find(show => show.showId === showId);
    
    if (!userShow) {
      throw new Error('Show not found in user library');
    }

    userShow.status = status;
    userShow.updatedAt = new Date();

    await dbService.saveUserShow(userShow);
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async updateShowProgress(
    userId: string,
    showId: number,
    season: number,
    episode: number
  ): Promise<void> {
    await this.init();

    const userShows = await this.getUserShows(userId);
    const userShow = userShows.find(show => show.showId === showId);
    
    if (!userShow) {
      throw new Error('Show not found in user library');
    }

    userShow.currentSeason = season;
    userShow.currentEpisode = episode;
    userShow.updatedAt = new Date();

    // Add to watched episodes if not already there
    const alreadyWatched = userShow.watchedEpisodes.some(
      ep => ep.seasonNumber === season && ep.episodeNumber === episode
    );

    if (!alreadyWatched) {
      userShow.watchedEpisodes.push({
        seasonNumber: season,
        episodeNumber: episode,
        watchedAt: new Date(),
      });
    }

    await dbService.saveUserShow(userShow);
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async rateShow(
    userId: string,
    showId: number,
    rating: number
  ): Promise<void> {
    await this.init();

    const userShows = await this.getUserShows(userId);
    const userShow = userShows.find(show => show.showId === showId);
    
    if (!userShow) {
      throw new Error('Show not found in user library');
    }

    userShow.rating = Math.max(1, Math.min(5, rating)); // Clamp to 1-5
    userShow.updatedAt = new Date();

    await dbService.saveUserShow(userShow);
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async addNoteToShow(
    userId: string,
    showId: number,
    notes: string
  ): Promise<void> {
    await this.init();

    const userShows = await this.getUserShows(userId);
    const userShow = userShows.find(show => show.showId === showId);
    
    if (!userShow) {
      throw new Error('Show not found in user library');
    }

    userShow.notes = notes;
    userShow.updatedAt = new Date();

    await dbService.saveUserShow(userShow);
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async isShowInLibrary(userId: string, showId: number): Promise<boolean> {
    const userShows = await this.getUserShows(userId);
    return userShows.some(show => show.showId === showId);
  }

  async getUserShowForShow(userId: string, showId: number): Promise<UserShow | null> {
    const userShows = await this.getUserShows(userId);
    return userShows.find(show => show.showId === showId) || null;
  }

  async getLibraryStats(userId: string) {
    const userShows = await this.getUserShows(userId);
    
    const stats = {
      totalShows: userShows.length,
      watching: userShows.filter(s => s.status === 'watching').length,
      wantToWatch: userShows.filter(s => s.status === 'want-to-watch').length,
      watched: userShows.filter(s => s.status === 'watched').length,
      totalEpisodesWatched: userShows.reduce(
        (total, show) => total + show.watchedEpisodes.length, 
        0
      ),
      averageRating: this.calculateAverageRating(userShows),
    };

    return stats;
  }

  private calculateAverageRating(shows: UserShow[]): number {
    const ratedShows = shows.filter(show => show.rating !== undefined);
    if (ratedShows.length === 0) return 0;
    
    const totalRating = ratedShows.reduce((sum, show) => sum + (show.rating || 0), 0);
    return Math.round((totalRating / ratedShows.length) * 10) / 10; // Round to 1 decimal
  }

  private async cacheShowData(show: TMDbShow): Promise<void> {
    // Convert TMDbShow to CachedShow format
    const cachedShow = {
      id: show.id,
      name: show.name,
      overview: show.overview || '',
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      first_air_date: show.first_air_date || '',
      last_air_date: '', // TMDbShow doesn't have this
      number_of_episodes: 0, // Will be updated when we fetch full details
      number_of_seasons: 0, // Will be updated when we fetch full details
      status: '', // Will be updated when we fetch full details
      vote_average: show.vote_average || 0,
      genres: [], // Will be updated when we fetch full details
      networks: [], // Will be updated when we fetch full details
      cachedAt: new Date(),
    };

    await dbService.saveCachedShow(cachedShow);
  }

  // Clear cache when user signs out
  clearCache(userId?: string) {
    if (userId) {
      this.userShows.delete(userId);
    } else {
      this.userShows.clear();
    }
  }
}

export const userLibraryService = new UserLibraryService();

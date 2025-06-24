import { ShowStatus, UserShow } from '@/types';
import { firestoreService } from './firestore';
import { TMDbShow } from './tmdb';

class UserLibraryService {
  private userShows: Map<string, UserShow[]> = new Map(); // Cache by userId
  private showDetailsCache: Map<number, any> = new Map(); // Cache show details by showId
  private initialized = false;

  async init() {
    this.initialized = true;
  }

  async getUserShows(userId: string): Promise<UserShow[]> {
    await this.init();
    
    // Check cache first
    if (this.userShows.has(userId)) {
      return this.userShows.get(userId)!;
    }

    let shows: UserShow[] = [];
    
    try {
      // Firestore is the only source now
      shows = await firestoreService.getUserShows(userId);
      console.log(`Loaded ${shows.length} shows from Firestore`);
    } catch (error) {
      console.error('Failed to load from Firestore:', error);
      shows = []; // Return empty array if Firestore fails
    }

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
      rating: undefined,
      notes: undefined,
      currentSeason: undefined,
      currentEpisode: undefined,
      watchedEpisodes: [],
      addedAt: new Date(),
      updatedAt: new Date(),
      totalRewatches: 0,
      favoriteEpisodes: [],
      totalWatchTimeMinutes: 0,
    };

    // Save to Firestore
    try {
      await firestoreService.saveUserShow(userShow);
    } catch (error) {
      console.error('Failed to save show to Firestore:', error);
      throw new Error('Failed to save show to library');
    }
    
    // Update cache
    const userShows = this.userShows.get(userId) || [];
    const existingIndex = userShows.findIndex(s => s.showId === show.id);
    
    if (existingIndex >= 0) {
      userShows[existingIndex] = userShow;
    } else {
      userShows.unshift(userShow); // Add to beginning
    }
    
    this.userShows.set(userId, userShows);

    // Cache the show data for future use
    try {
      await this.cacheShowData(show);
    } catch (cacheError) {
      console.error('Failed to cache show data:', cacheError);
      // Continue - this is not critical
    }
  }

  async removeShowFromLibrary(userId: string, showId: number): Promise<void> {
    await this.init();

    const userShowId = `${userId}_${showId}`;
    
    // Remove from Firestore
    try {
      await firestoreService.deleteUserShow(userId, userShowId);
    } catch (error) {
      console.error('Failed to remove show from Firestore:', error);
      throw new Error('Failed to remove show from library');
    }
    
    // Update cache
    const userShows = this.userShows.get(userId) || [];
    const filteredShows = userShows.filter(show => show.showId !== showId);
    this.userShows.set(userId, filteredShows);
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

    // Save to Firestore
    try {
      await firestoreService.saveUserShow(userShow);
    } catch (error) {
      console.error('Failed to update show status in Firestore:', error);
      throw new Error('Failed to update show status');
    }
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async updateShowRating(
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

    userShow.rating = rating;
    userShow.updatedAt = new Date();

    // Save to Firestore
    try {
      await firestoreService.saveUserShow(userShow);
    } catch (error) {
      console.error('Failed to update show rating in Firestore:', error);
      throw new Error('Failed to update show rating');
    }
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async updateShowNotes(
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

    // Save to Firestore
    try {
      await firestoreService.saveUserShow(userShow);
    } catch (error) {
      console.error('Failed to update show notes in Firestore:', error);
      throw new Error('Failed to update show notes');
    }
    
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

    // Save to Firestore
    try {
      await firestoreService.saveUserShow(userShow);
    } catch (error) {
      console.error('Failed to update show progress in Firestore:', error);
      throw new Error('Failed to update show progress');
    }
    
    // Update cache
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    if (showIndex >= 0) {
      cachedShows[showIndex] = userShow;
      this.userShows.set(userId, cachedShows);
    }
  }

  async markEpisodeWatched(
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
      userShow.updatedAt = new Date();

      // Save to Firestore
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to mark episode as watched in Firestore:', error);
        throw new Error('Failed to mark episode as watched');
      }
      
      // Update cache
      const cachedShows = this.userShows.get(userId) || [];
      const showIndex = cachedShows.findIndex(s => s.showId === showId);
      if (showIndex >= 0) {
        cachedShows[showIndex] = userShow;
        this.userShows.set(userId, cachedShows);
      }
    }
  }

  async markEpisodeUnwatched(
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

    // Remove from watched episodes if present
    const initialLength = userShow.watchedEpisodes.length;
    userShow.watchedEpisodes = userShow.watchedEpisodes.filter(
      ep => !(ep.seasonNumber === season && ep.episodeNumber === episode)
    );

    if (userShow.watchedEpisodes.length !== initialLength) {
      userShow.updatedAt = new Date();

      // Save to Firestore
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to mark episode as unwatched in Firestore:', error);
        throw new Error('Failed to mark episode as unwatched');
      }
      
      // Update cache
      const cachedShows = this.userShows.get(userId) || [];
      const showIndex = cachedShows.findIndex(s => s.showId === showId);
      if (showIndex >= 0) {
        cachedShows[showIndex] = userShow;
        this.userShows.set(userId, cachedShows);
      }
    }
  }

  async getCachedShowData(showId: number) {
    await this.init();
    
    // Check memory cache first
    if (this.showDetailsCache.has(showId)) {
      return this.showDetailsCache.get(showId);
    }
    
    // Try to get from Firestore cache
    let cachedShow = null;
    try {
      cachedShow = await firestoreService.getCachedShow(showId);
    } catch (error) {
      console.error('Failed to get cached show from Firestore:', error);
    }
    
    // If not cached, fetch from TMDb and cache it
    if (!cachedShow) {
      try {
        console.log(`Show ${showId} not cached, fetching from TMDb...`);
        const { tmdbService } = await import('./tmdb');
        const showDetails = await tmdbService.getShowDetails(showId);
        
        // Create cached show object
        cachedShow = {
          id: showDetails.id,
          name: showDetails.name,
          overview: showDetails.overview,
          poster_path: showDetails.poster_path,
          backdrop_path: showDetails.backdrop_path,
          first_air_date: showDetails.first_air_date,
          last_air_date: showDetails.last_air_date || '',
          number_of_episodes: showDetails.number_of_episodes,
          number_of_seasons: showDetails.number_of_seasons,
          status: showDetails.status,
          vote_average: showDetails.vote_average,
          genres: showDetails.genres,
          networks: showDetails.networks || [],
          cachedAt: new Date(),
        };
        
        // Save to Firestore cache
        try {
          await firestoreService.saveCachedShow(cachedShow);
          console.log(`Cached show ${showId}: ${showDetails.name}`);
        } catch (error) {
          console.error('Failed to cache show to Firestore:', error);
          // Continue - we still have the data
        }
      } catch (error) {
        console.error(`Failed to fetch show details for ${showId}:`, error);
        return null;
      }
    }
    
    // Cache in memory for this session
    if (cachedShow) {
      this.showDetailsCache.set(showId, cachedShow);
    }
    
    return cachedShow;
  }

  // Update show details in cache (when fetched in modal)
  async updateCachedShowData(showId: number, showDetails: any) {
    const cachedShow = {
      id: showDetails.id,
      name: showDetails.name,
      overview: showDetails.overview,
      poster_path: showDetails.poster_path,
      backdrop_path: showDetails.backdrop_path,
      first_air_date: showDetails.first_air_date,
      last_air_date: showDetails.last_air_date || '',
      number_of_episodes: showDetails.number_of_episodes,
      number_of_seasons: showDetails.number_of_seasons,
      status: showDetails.status,
      vote_average: showDetails.vote_average,
      genres: showDetails.genres,
      networks: showDetails.networks || [],
      cachedAt: new Date(),
    };
    
    // Cache in memory
    this.showDetailsCache.set(showId, cachedShow);
    
    // Save to Firestore cache
    try {
      await firestoreService.saveCachedShow(cachedShow);
      console.log(`Updated cached show ${showId}: ${showDetails.name}`);
    } catch (error) {
      console.error('Failed to update cached show in Firestore:', error);
    }
  }

  async getUserShowsWithDetails(userId: string) {
    await this.init();
    
    const userShows = await this.getUserShows(userId);
    const userShowsWithDetails = [];
    
    for (const userShow of userShows) {
      const showDetails = await this.getCachedShowData(userShow.showId);
      userShowsWithDetails.push({
        ...userShow,
        showDetails,
      });
    }
    
    return userShowsWithDetails;
  }

  private async cacheShowData(show: TMDbShow): Promise<void> {
    // Convert TMDbShow to CachedShow format and cache
    const cachedShow = {
      id: show.id,
      name: show.name,
      overview: show.overview,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      first_air_date: show.first_air_date,
      last_air_date: '',
      number_of_episodes: 0,
      number_of_seasons: 0,
      status: 'Unknown',
      vote_average: show.vote_average,
      genres: show.genres || [],
      networks: [],
      cachedAt: new Date(),
    };

    // Cache in memory
    this.showDetailsCache.set(show.id, cachedShow);

    // Save to Firestore
    try {
      await firestoreService.saveCachedShow(cachedShow);
    } catch (error) {
      console.error('Failed to cache show data to Firestore:', error);
    }
  }

  // Clear cache methods
  clearUserCache(userId?: string) {
    if (userId) {
      this.userShows.delete(userId);
    } else {
      this.userShows.clear();
    }
  }

  clearShowDetailsCache() {
    this.showDetailsCache.clear();
  }
}

export const userLibraryService = new UserLibraryService();

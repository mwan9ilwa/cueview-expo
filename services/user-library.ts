import { ShowStatus, UserShow } from '@/types';
import { firestoreService } from './firestore';
import { TMDbShow } from './tmdb';

class UserLibraryService {
  private userShows: Map<string, UserShow[]> = new Map(); // Cache by userId
  private showDetailsCache: Map<number, any> = new Map(); // Cache show details by showId
  private initialized = false;

  // Offline support and conflict resolution
  private pendingOperations: Map<string, any[]> = new Map();
  private isOnline = true;

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
      // Enhanced tracking fields
      startedWatchingAt: undefined,
      completedAt: undefined,
      lastWatchedAt: undefined,
      totalRewatches: 0,
      favoriteEpisodes: [],
      reminderSettings: {
        enabled: false,
        notifyOnNewEpisodes: false,
        notifyOnNewSeasons: false,
      },
      totalWatchTimeMinutes: 0,
      averageEpisodeRating: undefined,
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

  async markSeasonWatched(
    userId: string, 
    showId: number, 
    seasonNumber: number,
    episodes: { episode_number: number }[]
  ): Promise<void> {
    await this.init();

    const userShows = await this.getUserShows(userId);
    const userShow = userShows.find(show => show.showId === showId);
    
    if (!userShow) {
      throw new Error('Show not found in user library');
    }

    // Add all episodes to watched list if not already there
    let hasChanges = false;
    episodes.forEach(ep => {
      const alreadyWatched = userShow.watchedEpisodes.some(
        watchedEp => watchedEp.seasonNumber === seasonNumber && watchedEp.episodeNumber === ep.episode_number
      );

      if (!alreadyWatched) {
        userShow.watchedEpisodes.push({
          seasonNumber: seasonNumber,
          episodeNumber: ep.episode_number,
          watchedAt: new Date(),
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      userShow.updatedAt = new Date();

      // Update current progress to last episode of season
      if (episodes.length > 0) {
        const lastEpisode = episodes[episodes.length - 1];
        userShow.currentSeason = seasonNumber;
        userShow.currentEpisode = lastEpisode.episode_number;
      }

      // Save to Firestore
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to mark season as watched in Firestore:', error);
        throw new Error('Failed to mark season as watched');
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

  async markSeasonUnwatched(
    userId: string, 
    showId: number, 
    seasonNumber: number,
    episodes: { episode_number: number }[]
  ): Promise<void> {
    await this.init();

    const userShows = await this.getUserShows(userId);
    const userShow = userShows.find(show => show.showId === showId);
    
    if (!userShow) {
      throw new Error('Show not found in user library');
    }

    // Remove all episodes of this season from watched list
    const initialLength = userShow.watchedEpisodes.length;
    userShow.watchedEpisodes = userShow.watchedEpisodes.filter(
      ep => !(ep.seasonNumber === seasonNumber && episodes.some(seasonEp => seasonEp.episode_number === ep.episodeNumber))
    );

    if (userShow.watchedEpisodes.length !== initialLength) {
      userShow.updatedAt = new Date();

      // Save to Firestore
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to mark season as unwatched in Firestore:', error);
        throw new Error('Failed to mark season as unwatched');
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

  // Helper methods for the hook
  async getLibraryStats(userId: string) {
    const shows = await this.getUserShows(userId);
    const watchedEpisodes = shows.reduce((total, show) => total + show.watchedEpisodes.length, 0);
    const totalRating = shows.reduce((total, show) => show.rating ? total + show.rating : total, 0);
    const ratedShows = shows.filter(show => show.rating).length;
    
    return {
      totalShows: shows.length,
      watching: shows.filter(show => show.status === 'watching').length,
      wantToWatch: shows.filter(show => show.status === 'want-to-watch').length,
      watched: shows.filter(show => show.status === 'watched').length,
      totalEpisodesWatched: watchedEpisodes,
      averageRating: ratedShows > 0 ? totalRating / ratedShows : 0,
    };
  }

  async subscribeToUpdates(userId: string, callback: (shows: UserShow[]) => void) {
    // Set up real-time Firestore listener
    try {
      const unsubscribe = await firestoreService.subscribeToUserShows(userId, (shows) => {
        // Update local cache
        this.userShows.set(userId, shows);
        // Notify callback
        callback(shows);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Failed to set up real-time listener:', error);
      // Return dummy unsubscribe function as fallback
      return () => {};
    }
  }

  async rateShow(userId: string, showId: number, rating: number) {
    return this.updateShowRating(userId, showId, rating);
  }

  async addNoteToShow(userId: string, showId: number, notes: string) {
    return this.updateShowNotes(userId, showId, notes);
  }

  async isShowInLibrary(userId: string, showId: number): Promise<boolean> {
    const shows = await this.getUserShows(userId);
    return shows.some(show => show.showId === showId);
  }

  async getUserShowForShow(userId: string, showId: number) {
    const shows = await this.getUserShows(userId);
    return shows.find(show => show.showId === showId) || null;
  }

  // Sync methods (no-op for Firestore-only implementation)
  async syncToFirestore(userId: string) {
    // No-op - we're already using Firestore
    console.log('Sync to Firestore: Already using Firestore as primary storage');
  }

  async syncFromFirestore(userId: string) {
    // Just refresh the cache
    this.clearUserCache(userId);
    await this.getUserShows(userId);
  }

  async migrateToFirestore(userId: string, force: boolean = false) {
    // No-op - we're already using Firestore
    console.log('Migrate to Firestore: Already using Firestore as primary storage');
  }

  // Optimistic update methods for better UX
  async markEpisodeWatchedOptimistic(
    userId: string, 
    showId: number, 
    season: number,
    episode: number
  ): Promise<void> {
    // First, update the local cache optimistically
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    
    if (showIndex >= 0) {
      const userShow = { ...cachedShows[showIndex] };
      const alreadyWatched = userShow.watchedEpisodes.some(
        ep => ep.seasonNumber === season && ep.episodeNumber === episode
      );

      if (!alreadyWatched) {
        userShow.watchedEpisodes = [...userShow.watchedEpisodes, {
          seasonNumber: season,
          episodeNumber: episode,
          watchedAt: new Date(),
        }];
        userShow.updatedAt = new Date();
        
        // Update cache immediately
        const updatedShows = [...cachedShows];
        updatedShows[showIndex] = userShow;
        this.userShows.set(userId, updatedShows);
        
        // Then save to Firestore in background
        try {
          await this.markEpisodeWatched(userId, showId, season, episode);
        } catch (error) {
          // Revert optimistic update on error
          this.userShows.set(userId, cachedShows);
          throw error;
        }
      }
    }
  }

  async markSeasonWatchedOptimistic(
    userId: string, 
    showId: number, 
    seasonNumber: number,
    episodes: { episode_number: number }[]
  ): Promise<void> {
    // Optimistic update
    const cachedShows = this.userShows.get(userId) || [];
    const showIndex = cachedShows.findIndex(s => s.showId === showId);
    
    if (showIndex >= 0) {
      const userShow = { ...cachedShows[showIndex] };
      const originalWatchedEpisodes = [...userShow.watchedEpisodes];
      
      // Add all episodes optimistically
      episodes.forEach(ep => {
        const alreadyWatched = userShow.watchedEpisodes.some(
          watchedEp => watchedEp.seasonNumber === seasonNumber && watchedEp.episodeNumber === ep.episode_number
        );

        if (!alreadyWatched) {
          userShow.watchedEpisodes.push({
            seasonNumber: seasonNumber,
            episodeNumber: ep.episode_number,
            watchedAt: new Date(),
          });
        }
      });
      
      userShow.updatedAt = new Date();
      if (episodes.length > 0) {
        const lastEpisode = episodes[episodes.length - 1];
        userShow.currentSeason = seasonNumber;
        userShow.currentEpisode = lastEpisode.episode_number;
      }
      
      // Update cache immediately
      const updatedShows = [...cachedShows];
      updatedShows[showIndex] = userShow;
      this.userShows.set(userId, updatedShows);
      
      // Save to Firestore in background
      try {
        await this.markSeasonWatched(userId, showId, seasonNumber, episodes);
      } catch (error) {
        // Revert optimistic update on error
        const revertedUserShow = { ...userShow };
        revertedUserShow.watchedEpisodes = originalWatchedEpisodes;
        updatedShows[showIndex] = revertedUserShow;
        this.userShows.set(userId, updatedShows);
        throw error;
      }
    }
  }

  setOnlineStatus(online: boolean) {
    const wasOffline = !this.isOnline;
    this.isOnline = online;
    
    // If coming back online, sync pending operations
    if (wasOffline && online) {
      this.syncPendingOperations();
    }
  }

  private async syncPendingOperations() {
    for (const [userId, operations] of this.pendingOperations) {
      try {
        for (const operation of operations) {
          await this.executeOperation(operation);
        }
        // Clear pending operations after successful sync
        this.pendingOperations.delete(userId);
      } catch (error) {
        console.error('Failed to sync pending operations for user:', userId, error);
      }
    }
  }

  private async executeOperation(operation: any) {
    switch (operation.type) {
      case 'markEpisodeWatched':
        await this.markEpisodeWatched(operation.userId, operation.showId, operation.season, operation.episode);
        break;
      case 'markSeasonWatched':
        await this.markSeasonWatched(operation.userId, operation.showId, operation.seasonNumber, operation.episodes);
        break;
      // Add more operation types as needed
    }
  }

  private addPendingOperation(userId: string, operation: any) {
    if (!this.pendingOperations.has(userId)) {
      this.pendingOperations.set(userId, []);
    }
    this.pendingOperations.get(userId)!.push(operation);
  }

  async markEpisodeWatchedOfflineAware(
    userId: string, 
    showId: number, 
    season: number,
    episode: number
  ): Promise<void> {
    // Always update local cache first
    await this.markEpisodeWatchedOptimistic(userId, showId, season, episode);
    
    if (!this.isOnline) {
      // Store operation for later sync
      this.addPendingOperation(userId, {
        type: 'markEpisodeWatched',
        userId,
        showId,
        season,
        episode,
        timestamp: Date.now()
      });
      return;
    }
    
    // If online, sync immediately
    try {
      await this.markEpisodeWatched(userId, showId, season, episode);
    } catch (error) {
      // If sync fails, add to pending operations
      this.addPendingOperation(userId, {
        type: 'markEpisodeWatched',
        userId,
        showId,
        season,
        episode,
        timestamp: Date.now()
      });
      throw error;
    }
  }
}

export const userLibraryService = new UserLibraryService();

import { ShowStatus, UserShow } from '@/types';
import { dbService } from './database';
import { firestoreService } from './firestore';
import { TMDbShow } from './tmdb';

class UserLibraryService {
  private userShows: Map<string, UserShow[]> = new Map(); // Cache by userId
  private initialized = false;
  private syncEnabled = true; // Can be toggled for offline mode

  async init() {
    if (!this.initialized) {
      await dbService.init();
      this.initialized = true;
    }
  }

  setSyncEnabled(enabled: boolean) {
    this.syncEnabled = enabled;
  }

  async getUserShows(userId: string): Promise<UserShow[]> {
    await this.init();
    
    // Check cache first
    if (this.userShows.has(userId)) {
      return this.userShows.get(userId)!;
    }

    let shows: UserShow[] = [];
    
    if (this.syncEnabled) {
      try {
        // Firestore is the authoritative source
        shows = await firestoreService.getUserShows(userId);
        
        // Try to replace local SQLite data with Firestore data
        try {
          await this.replaceLocalDataWithFirestore(userId, shows);
        } catch (dbError) {
          console.error('Failed to sync to local database, continuing with Firestore data only:', dbError);
        }
        
        console.log(`Loaded ${shows.length} shows from Firestore (authoritative source)`);
      } catch (error) {
        console.log('Failed to load from Firestore, trying local cache:', error);
        try {
          shows = await dbService.getUserShows(userId);
        } catch (dbError) {
          console.error('Failed to load from local database:', dbError);
          shows = []; // Return empty array if both sources fail
        }
      }
    } else {
      // Offline mode - use local SQLite cache
      try {
        shows = await dbService.getUserShows(userId);
      } catch (dbError) {
        console.error('Failed to load from local database in offline mode:', dbError);
        shows = []; // Return empty array if database fails
      }
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
    };

    // Try to save to local database first
    try {
      await dbService.saveUserShow(userShow);
    } catch (dbError) {
      console.error('Failed to save to local database:', dbError);
      // Continue with Firestore sync only
    }
    
    // Sync to Firestore if enabled
    if (this.syncEnabled) {
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to sync show to Firestore:', error);
        // If both local and cloud saves failed, throw error
        throw new Error('Failed to save show to both local and cloud storage');
      }
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

    // Try to cache the show data for offline access
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
    
    // Remove from local database
    await dbService.deleteUserShow(userShowId);
    
    // Sync removal to Firestore if enabled
    if (this.syncEnabled) {
      try {
        await firestoreService.deleteUserShow(userId, userShowId);
      } catch (error) {
        console.error('Failed to sync show removal to Firestore:', error);
        // Continue - local removal succeeded
      }
    }
    
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

    // Save to local database
    await dbService.saveUserShow(userShow);
    
    // Sync to Firestore if enabled
    if (this.syncEnabled) {
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to sync show status to Firestore:', error);
        // Continue - local save succeeded
      }
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

    // Save to local database
    await dbService.saveUserShow(userShow);
    
    // Sync to Firestore if enabled
    if (this.syncEnabled) {
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to sync show progress to Firestore:', error);
        // Continue - local save succeeded
      }
    }
    
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

    // Save to local database
    await dbService.saveUserShow(userShow);
    
    // Sync to Firestore if enabled
    if (this.syncEnabled) {
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to sync show rating to Firestore:', error);
        // Continue - local save succeeded
      }
    }
    
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

    // Save to local database
    await dbService.saveUserShow(userShow);
    
    // Sync to Firestore if enabled
    if (this.syncEnabled) {
      try {
        await firestoreService.saveUserShow(userShow);
      } catch (error) {
        console.error('Failed to sync show notes to Firestore:', error);
        // Continue - local save succeeded
      }
    }
    
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
    // Convert TMDbShow to CachedShow format with full data
    const cachedShow = {
      id: show.id,
      name: show.name,
      overview: show.overview || '',
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      first_air_date: show.first_air_date || '',
      last_air_date: show.last_air_date || '',
      number_of_episodes: show.number_of_episodes || 0,
      number_of_seasons: show.number_of_seasons || 0,
      status: show.status || '',
      vote_average: show.vote_average || 0,
      genres: show.genres || [],
      networks: show.networks || [],
      cachedAt: new Date(),
    };

    // Save to local database
    await dbService.saveCachedShow(cachedShow);
    
    // Sync to Firestore if enabled (for shared show cache)
    if (this.syncEnabled) {
      try {
        await firestoreService.saveCachedShow(cachedShow);
      } catch (error) {
        console.error('Failed to sync cached show to Firestore:', error);
        // Continue - local cache succeeded
      }
    }
  }

  async getCachedShowData(showId: number) {
    await this.init();
    return dbService.getCachedShow(showId);
  }

  async getUserShowsWithDetails(userId: string) {
    await this.init();
    
    const userShows = await this.getUserShows(userId);
    
    // Enhance each user show with cached show data
    const showsWithDetails = await Promise.all(
      userShows.map(async (userShow) => {
        const cachedShow = await this.getCachedShowData(userShow.showId);
        return {
          ...userShow,
          showDetails: cachedShow,
        };
      })
    );

    return showsWithDetails;
  }

  // Sync methods for cross-device functionality
  async syncToFirestore(userId: string): Promise<void> {
    if (!this.syncEnabled) return;
    
    await this.init();
    
    try {
      const localShows = await dbService.getUserShows(userId);
      await firestoreService.syncLocalDataToFirestore(userId, localShows);
      console.log('Successfully synced local data to Firestore');
    } catch (error) {
      console.error('Failed to sync to Firestore:', error);
      throw error;
    }
  }

  async syncFromFirestore(userId: string): Promise<void> {
    if (!this.syncEnabled) return;
    
    await this.init();
    
    try {
      const firestoreShows = await firestoreService.getUserShows(userId);
      
      // Update local database with Firestore data
      for (const show of firestoreShows) {
        await dbService.saveUserShow(show);
      }
      
      // Update cache
      this.userShows.set(userId, firestoreShows);
      console.log('Successfully synced data from Firestore');
    } catch (error) {
      console.error('Failed to sync from Firestore:', error);
      throw error;
    }
  }

  // Real-time sync listener
  subscribeToUpdates(userId: string, callback: (shows: UserShow[]) => void): () => void {
    if (!this.syncEnabled) {
      return () => {}; // Return empty unsubscribe function
    }

    return firestoreService.subscribeToUserShows(userId, (shows) => {
      // Update local cache
      this.userShows.set(userId, shows);
      
      // Update local database in background
      Promise.all(shows.map(show => dbService.saveUserShow(show)))
        .catch(error => console.error('Failed to sync updates to local database:', error));
      
      callback(shows);
    });
  }

  // Migration helper - optionally sync local data to Firestore on first login
  // This is now less aggressive and won't auto-migrate
  async migrateToFirestore(userId: string, force: boolean = false): Promise<void> {
    if (!this.syncEnabled || !force) return;
    
    await this.init();
    
    try {
      // Get all local shows
      const localShows = await dbService.getUserShows(userId);
      
      if (localShows.length > 0) {
        console.log(`Migrating ${localShows.length} shows to Firestore...`);
        await firestoreService.syncLocalDataToFirestore(userId, localShows);
        console.log('Migration to Firestore completed');
      }
    } catch (error) {
      console.error('Migration to Firestore failed:', error);
      // Don't throw - continue with local functionality
    }
  }

  // Clear cache when user signs out
  clearCache(userId?: string) {
    if (userId) {
      this.userShows.delete(userId);
    } else {
      this.userShows.clear();
    }
  }

  // Replace local SQLite data with Firestore data (make Firestore authoritative)
  private async replaceLocalDataWithFirestore(userId: string, firestoreShows: UserShow[]): Promise<void> {
    try {
      // Clear all local shows for this user
      await dbService.clearUserShows(userId);
      
      // Repopulate with Firestore data
      for (const show of firestoreShows) {
        await dbService.saveUserShow(show);
      }
      
      console.log(`Replaced local cache with ${firestoreShows.length} shows from Firestore`);
    } catch (error) {
      console.error('Failed to replace local data with Firestore data:', error);
      // Don't throw - we still have the Firestore data in memory
    }
  }
}

export const userLibraryService = new UserLibraryService();

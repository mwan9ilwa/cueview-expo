import { db } from '@/config/firebase';
import { CachedShow, UserShow } from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';

export class FirestoreService {
  // User Shows Collection
  private getUserShowsCollection(userId: string) {
    return collection(db, `users/${userId}/shows`);
  }

  // Cached Shows Collection (global)
  private getCachedShowsCollection() {
    return collection(db, 'user_shows');
  }

  // User Shows Methods
  async saveUserShow(userShow: UserShow): Promise<void> {
    try {
      const userShowRef = doc(this.getUserShowsCollection(userShow.userId), userShow.id);
      
      // Convert dates to Firestore timestamps and handle undefined values
      // Firestore doesn't support undefined, so we convert to null or omit
      const showData: any = {
        id: userShow.id,
        userId: userShow.userId,
        showId: userShow.showId,
        status: userShow.status,
        addedAt: Timestamp.fromDate(userShow.addedAt),
        updatedAt: serverTimestamp(),
        // Convert watched episodes dates and handle undefined fields
        watchedEpisodes: userShow.watchedEpisodes.map(episode => ({
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          watchedAt: Timestamp.fromDate(episode.watchedAt),
          ...(episode.rewatch !== undefined && { rewatch: episode.rewatch }),
          ...(episode.rating !== undefined && { rating: episode.rating }),
          ...(episode.notes !== undefined && { notes: episode.notes }),
        })),
        // Enhanced tracking fields
        totalRewatches: userShow.totalRewatches || 0,
        favoriteEpisodes: userShow.favoriteEpisodes || [],
        totalWatchTimeMinutes: userShow.totalWatchTimeMinutes || 0,
        reminderSettings: userShow.reminderSettings || {
          enabled: false,
          notifyOnNewEpisodes: false,
          notifyOnNewSeasons: false,
        },
      };

      // Only add optional fields if they have values (not undefined)
      if (userShow.rating !== undefined) {
        showData.rating = userShow.rating;
      }
      if (userShow.notes !== undefined) {
        showData.notes = userShow.notes;
      }
      if (userShow.currentSeason !== undefined) {
        showData.currentSeason = userShow.currentSeason;
      }
      if (userShow.currentEpisode !== undefined) {
        showData.currentEpisode = userShow.currentEpisode;
      }
      if (userShow.startedWatchingAt !== undefined) {
        showData.startedWatchingAt = Timestamp.fromDate(userShow.startedWatchingAt);
      }
      if (userShow.completedAt !== undefined) {
        showData.completedAt = Timestamp.fromDate(userShow.completedAt);
      }
      if (userShow.lastWatchedAt !== undefined) {
        showData.lastWatchedAt = Timestamp.fromDate(userShow.lastWatchedAt);
      }
      if (userShow.averageEpisodeRating !== undefined) {
        showData.averageEpisodeRating = userShow.averageEpisodeRating;
      }

      await setDoc(userShowRef, showData, { merge: true });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('Firestore permissions not configured. Please set up security rules. App will work locally.');
        // Don't throw for permission errors - let app work offline
        return;
      }
      console.error('Error saving user show to Firestore:', error);
      throw error;
    }
  }

  async getUserShows(userId: string): Promise<UserShow[]> {
    try {
      const q = query(
        this.getUserShowsCollection(userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const userShows: UserShow[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userShows.push({
          id: data.id,
          userId: data.userId,
          showId: data.showId,
          status: data.status,
          // Handle optional fields - they might not exist in Firestore if they were undefined
          rating: data.rating !== undefined ? data.rating : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          currentSeason: data.currentSeason !== undefined ? data.currentSeason : undefined,
          currentEpisode: data.currentEpisode !== undefined ? data.currentEpisode : undefined,
          addedAt: data.addedAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          // Convert watched episodes timestamps back to dates
          watchedEpisodes: data.watchedEpisodes?.map((episode: any) => ({
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            watchedAt: episode.watchedAt.toDate(),
            rewatch: episode.rewatch || false,
            rating: episode.rating,
            notes: episode.notes,
          })) || [],
          // Enhanced tracking fields with defaults
          startedWatchingAt: data.startedWatchingAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          lastWatchedAt: data.lastWatchedAt?.toDate(),
          totalRewatches: data.totalRewatches || 0,
          favoriteEpisodes: data.favoriteEpisodes || [],
          reminderSettings: data.reminderSettings || {
            enabled: false,
            notifyOnNewEpisodes: false,
            notifyOnNewSeasons: false,
          },
          totalWatchTimeMinutes: data.totalWatchTimeMinutes || 0,
          averageEpisodeRating: data.averageEpisodeRating,
        });
      });

      return userShows;
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('Firestore permissions not configured. Returning empty array. App will work locally.');
        return [];
      }
      console.error('Error getting user shows from Firestore:', error);
      throw error;
    }
  }

  async deleteUserShow(userId: string, userShowId: string): Promise<void> {
    try {
      const userShowRef = doc(this.getUserShowsCollection(userId), userShowId);
      await deleteDoc(userShowRef);
    } catch (error) {
      console.error('Error deleting user show from Firestore:', error);
      throw error;
    }
  }

  async getUserShow(userId: string, userShowId: string): Promise<UserShow | null> {
    try {
      const userShowRef = doc(this.getUserShowsCollection(userId), userShowId);
      const docSnap = await getDoc(userShowRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: data.id,
          userId: data.userId,
          showId: data.showId,
          status: data.status,
          // Handle optional fields - they might not exist in Firestore if they were undefined
          rating: data.rating !== undefined ? data.rating : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          currentSeason: data.currentSeason !== undefined ? data.currentSeason : undefined,
          currentEpisode: data.currentEpisode !== undefined ? data.currentEpisode : undefined,
          addedAt: data.addedAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          watchedEpisodes: data.watchedEpisodes?.map((episode: any) => ({
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            watchedAt: episode.watchedAt.toDate(),
            rewatch: episode.rewatch || false,
            rating: episode.rating,
            notes: episode.notes,
          })) || [],
          // Enhanced tracking fields with defaults
          startedWatchingAt: data.startedWatchingAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          lastWatchedAt: data.lastWatchedAt?.toDate(),
          totalRewatches: data.totalRewatches || 0,
          favoriteEpisodes: data.favoriteEpisodes || [],
          reminderSettings: data.reminderSettings || {
            enabled: false,
            notifyOnNewEpisodes: false,
            notifyOnNewSeasons: false,
          },
          totalWatchTimeMinutes: data.totalWatchTimeMinutes || 0,
          averageEpisodeRating: data.averageEpisodeRating,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user show from Firestore:', error);
      throw error;
    }
  }

  // Real-time listener for user shows
  subscribeToUserShows(userId: string, callback: (shows: UserShow[]) => void): () => void {
    const q = query(
      this.getUserShowsCollection(userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const userShows: UserShow[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userShows.push({
          id: data.id,
          userId: data.userId,
          showId: data.showId,
          status: data.status,
          // Handle optional fields - they might not exist in Firestore if they were undefined
          rating: data.rating !== undefined ? data.rating : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          currentSeason: data.currentSeason !== undefined ? data.currentSeason : undefined,
          currentEpisode: data.currentEpisode !== undefined ? data.currentEpisode : undefined,
          addedAt: data.addedAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          watchedEpisodes: data.watchedEpisodes?.map((episode: any) => ({
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            watchedAt: episode.watchedAt.toDate(),
            rewatch: episode.rewatch || false,
            rating: episode.rating,
            notes: episode.notes,
          })) || [],
          // Enhanced tracking fields with defaults
          startedWatchingAt: data.startedWatchingAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          lastWatchedAt: data.lastWatchedAt?.toDate(),
          totalRewatches: data.totalRewatches || 0,
          favoriteEpisodes: data.favoriteEpisodes || [],
          reminderSettings: data.reminderSettings || {
            enabled: false,
            notifyOnNewEpisodes: false,
            notifyOnNewSeasons: false,
          },
          totalWatchTimeMinutes: data.totalWatchTimeMinutes || 0,
          averageEpisodeRating: data.averageEpisodeRating,
        });
      });

      callback(userShows);
    }, (error) => {
      console.error('Error in user shows subscription:', error);
    });
  }

  // Cached Shows Methods
  async saveCachedShow(show: CachedShow): Promise<void> {
    try {
      const showRef = doc(this.getCachedShowsCollection(), show.id.toString());
      
      const showData = {
        ...show,
        cachedAt: serverTimestamp(),
      };

      await setDoc(showRef, showData, { merge: true });
    } catch (error) {
      console.error('Error saving cached show to Firestore:', error);
      throw error;
    }
  }

  async getCachedShow(showId: number): Promise<CachedShow | null> {
    try {
      const showRef = doc(this.getCachedShowsCollection(), showId.toString());
      const docSnap = await getDoc(showRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          cachedAt: data.cachedAt?.toDate() || new Date(),
        } as CachedShow;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached show from Firestore:', error);
      throw error;
    }
  }

  // Batch operations for syncing
  async batchSaveUserShows(userShows: UserShow[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      userShows.forEach((userShow) => {
        const userShowRef = doc(this.getUserShowsCollection(userShow.userId), userShow.id);
        
        // Convert data properly to avoid undefined values
        const showData: any = {
          id: userShow.id,
          userId: userShow.userId,
          showId: userShow.showId,
          status: userShow.status,
          addedAt: Timestamp.fromDate(userShow.addedAt),
          updatedAt: serverTimestamp(),
          watchedEpisodes: userShow.watchedEpisodes.map(episode => ({
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            watchedAt: Timestamp.fromDate(episode.watchedAt),
            ...(episode.rewatch !== undefined && { rewatch: episode.rewatch }),
            ...(episode.rating !== undefined && { rating: episode.rating }),
            ...(episode.notes !== undefined && { notes: episode.notes }),
          })),
          // Enhanced tracking fields
          totalRewatches: userShow.totalRewatches || 0,
          favoriteEpisodes: userShow.favoriteEpisodes || [],
          totalWatchTimeMinutes: userShow.totalWatchTimeMinutes || 0,
          reminderSettings: userShow.reminderSettings || {
            enabled: false,
            notifyOnNewEpisodes: false,
            notifyOnNewSeasons: false,
          },
        };

        // Only add optional fields if they have values (not undefined)
        if (userShow.rating !== undefined) {
          showData.rating = userShow.rating;
        }
        if (userShow.notes !== undefined) {
          showData.notes = userShow.notes;
        }
        if (userShow.currentSeason !== undefined) {
          showData.currentSeason = userShow.currentSeason;
        }
        if (userShow.currentEpisode !== undefined) {
          showData.currentEpisode = userShow.currentEpisode;
        }
        if (userShow.startedWatchingAt !== undefined) {
          showData.startedWatchingAt = Timestamp.fromDate(userShow.startedWatchingAt);
        }
        if (userShow.completedAt !== undefined) {
          showData.completedAt = Timestamp.fromDate(userShow.completedAt);
        }
        if (userShow.lastWatchedAt !== undefined) {
          showData.lastWatchedAt = Timestamp.fromDate(userShow.lastWatchedAt);
        }
        if (userShow.averageEpisodeRating !== undefined) {
          showData.averageEpisodeRating = userShow.averageEpisodeRating;
        }

        batch.set(userShowRef, showData, { merge: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error batch saving user shows to Firestore:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchUpdateUserShows(userId: string, updates: { userShow: UserShow; operation: 'save' | 'delete' }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ userShow, operation }) => {
        const userShowRef = doc(this.getUserShowsCollection(userId), userShow.id);
        
        if (operation === 'delete') {
          batch.delete(userShowRef);
        } else {
          const showData: any = {
            id: userShow.id,
            userId: userShow.userId,
            showId: userShow.showId,
            status: userShow.status,
            addedAt: Timestamp.fromDate(userShow.addedAt),
            updatedAt: serverTimestamp(),
            watchedEpisodes: userShow.watchedEpisodes.map(episode => ({
              seasonNumber: episode.seasonNumber,
              episodeNumber: episode.episodeNumber,
              watchedAt: Timestamp.fromDate(episode.watchedAt),
              ...(episode.rewatch !== undefined && { rewatch: episode.rewatch }),
              ...(episode.rating !== undefined && { rating: episode.rating }),
              ...(episode.notes !== undefined && { notes: episode.notes }),
            })),
            // Enhanced tracking fields
            totalRewatches: userShow.totalRewatches || 0,
            favoriteEpisodes: userShow.favoriteEpisodes || [],
            totalWatchTimeMinutes: userShow.totalWatchTimeMinutes || 0,
            reminderSettings: userShow.reminderSettings || {
              enabled: false,
              notifyOnNewEpisodes: false,
              notifyOnNewSeasons: false,
            },
          };

          // Only add optional fields if they have values (not undefined)
          if (userShow.rating !== undefined) {
            showData.rating = userShow.rating;
          }
          if (userShow.notes !== undefined) {
            showData.notes = userShow.notes;
          }
          if (userShow.currentSeason !== undefined) {
            showData.currentSeason = userShow.currentSeason;
          }
          if (userShow.currentEpisode !== undefined) {
            showData.currentEpisode = userShow.currentEpisode;
          }
          if (userShow.startedWatchingAt !== undefined) {
            showData.startedWatchingAt = Timestamp.fromDate(userShow.startedWatchingAt);
          }
          if (userShow.completedAt !== undefined) {
            showData.completedAt = Timestamp.fromDate(userShow.completedAt);
          }
          if (userShow.lastWatchedAt !== undefined) {
            showData.lastWatchedAt = Timestamp.fromDate(userShow.lastWatchedAt);
          }
          if (userShow.averageEpisodeRating !== undefined) {
            showData.averageEpisodeRating = userShow.averageEpisodeRating;
          }

          batch.set(userShowRef, showData, { merge: true });
        }
      });
      
      await batch.commit();
    } catch (error: any) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }

  // Sync local data to Firestore (for migration)
  async syncLocalDataToFirestore(userId: string, localShows: UserShow[]): Promise<void> {
    try {
      console.log(`Syncing ${localShows.length} shows to Firestore for user ${userId}`);
      
      // Check which shows already exist in Firestore
      const existingShows = await this.getUserShows(userId);
      const existingShowIds = new Set(existingShows.map(show => show.id));

      // Only sync shows that don't exist in Firestore
      const showsToSync = localShows.filter(show => !existingShowIds.has(show.id));
      
      if (showsToSync.length > 0) {
        await this.batchSaveUserShows(showsToSync);
        console.log(`Synced ${showsToSync.length} new shows to Firestore`);
      } else {
        console.log('No new shows to sync');
      }
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('Firestore permissions not configured. Sync skipped. App will work locally.');
        return;
      }
      console.error('Error syncing local data to Firestore:', error);
      throw error;
    }
  }

  // Clear all user data (for logout/reset)
  async clearUserData(userId: string): Promise<void> {
    try {
      const userShows = await this.getUserShows(userId);
      const batch = writeBatch(db);

      userShows.forEach((userShow) => {
        const userShowRef = doc(this.getUserShowsCollection(userId), userShow.id);
        batch.delete(userShowRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing user data from Firestore:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();

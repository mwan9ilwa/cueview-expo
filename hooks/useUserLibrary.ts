import { useAuth } from '@/contexts/SimpleAuthContext';
import { TMDbShow } from '@/services/tmdb';
import { userLibraryService } from '@/services/user-library';
import { ShowStatus, UserShow, UserShowWithDetails } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useUserLibrary() {
  const { user } = useAuth();
  const [userShows, setUserShows] = useState<UserShow[]>([]);
  const [userShowsWithDetails, setUserShowsWithDetails] = useState<UserShowWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalShows: 0,
    watching: 0,
    wantToWatch: 0,
    watched: 0,
    totalEpisodesWatched: 0,
    averageRating: 0,
  });

  const loadUserShows = useCallback(async () => {
    if (!user) {
      setUserShows([]);
      setUserShowsWithDetails([]);
      setStats({
        totalShows: 0,
        watching: 0,
        wantToWatch: 0,
        watched: 0,
        totalEpisodesWatched: 0,
        averageRating: 0,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load shows from Firestore (authoritative source) 
      // This will automatically sync to local cache
      const [shows, showsWithDetails, libraryStats] = await Promise.all([
        userLibraryService.getUserShows(user.id),
        userLibraryService.getUserShowsWithDetails(user.id),
        userLibraryService.getLibraryStats(user.id),
      ]);
      
      setUserShows(shows);
      setUserShowsWithDetails(showsWithDetails);
      setStats(libraryStats);
    } catch (err) {
      console.error('Error loading user shows:', err);
      setError('Failed to load your shows');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time sync when user changes
  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for Firestore changes
    const unsubscribe = userLibraryService.subscribeToUpdates(user.id, async (shows) => {
      setUserShows(shows);
      
      // Update detailed shows and stats
      try {
        const [showsWithDetails, libraryStats] = await Promise.all([
          userLibraryService.getUserShowsWithDetails(user.id),
          userLibraryService.getLibraryStats(user.id),
        ]);
        
        setUserShowsWithDetails(showsWithDetails);
        setStats(libraryStats);
      } catch (error) {
        console.error('Error updating detailed data after sync:', error);
      }
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    loadUserShows();
  }, [loadUserShows]);

  const addShow = useCallback(async (show: TMDbShow, status: ShowStatus = 'want-to-watch') => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userLibraryService.addShowToLibrary(user.id, show, status);
      await loadUserShows(); // Refresh the data
    } catch (err) {
      console.error('Error adding show:', err);
      setError('Failed to add show');
      throw err;
    }
  }, [user, loadUserShows]);

  const removeShow = useCallback(async (showId: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userLibraryService.removeShowFromLibrary(user.id, showId);
      await loadUserShows(); // Refresh the data
    } catch (err) {
      console.error('Error removing show:', err);
      setError('Failed to remove show');
      throw err;
    }
  }, [user, loadUserShows]);

  const updateShowStatus = useCallback(async (showId: number, status: ShowStatus) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userLibraryService.updateShowStatus(user.id, showId, status);
      await loadUserShows(); // Refresh the data
    } catch (err) {
      console.error('Error updating show status:', err);
      setError('Failed to update show status');
      throw err;
    }
  }, [user, loadUserShows]);

  const updateShowProgress = useCallback(async (showId: number, season: number, episode: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userLibraryService.updateShowProgress(user.id, showId, season, episode);
      await loadUserShows(); // Refresh the data
    } catch (err) {
      console.error('Error updating show progress:', err);
      setError('Failed to update progress');
      throw err;
    }
  }, [user, loadUserShows]);

  const rateShow = useCallback(async (showId: number, rating: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userLibraryService.rateShow(user.id, showId, rating);
      await loadUserShows(); // Refresh the data
    } catch (err) {
      console.error('Error rating show:', err);
      setError('Failed to rate show');
      throw err;
    }
  }, [user, loadUserShows]);

  const addNoteToShow = useCallback(async (showId: number, notes: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userLibraryService.addNoteToShow(user.id, showId, notes);
      await loadUserShows(); // Refresh the data
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
      throw err;
    }
  }, [user, loadUserShows]);

  const isShowInLibrary = useCallback(async (showId: number): Promise<boolean> => {
    if (!user) return false;
    return userLibraryService.isShowInLibrary(user.id, showId);
  }, [user]);

  const getUserShowForShow = useCallback(async (showId: number): Promise<UserShow | null> => {
    if (!user) return null;
    return userLibraryService.getUserShowForShow(user.id, showId);
  }, [user]);

  const getShowsByStatus = useCallback((status: ShowStatus): UserShow[] => {
    return userShows.filter(show => show.status === status);
  }, [userShows]);

  const getDetailedShowsByStatus = useCallback((status: ShowStatus) => {
    return userShowsWithDetails.filter(show => show.status === status);
  }, [userShowsWithDetails]);

  const refreshLibrary = useCallback(() => {
    return loadUserShows();
  }, [loadUserShows]);

  // Manual sync functions
  const syncToCloud = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await userLibraryService.syncToFirestore(user.id);
      await loadUserShows(); // Refresh after sync
    } catch (err) {
      console.error('Error syncing to cloud:', err);
      setError('Failed to sync to cloud');
      throw err;
    }
  }, [user, loadUserShows]);

  const syncFromCloud = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await userLibraryService.syncFromFirestore(user.id);
      await loadUserShows(); // Refresh after sync
    } catch (err) {
      console.error('Error syncing from cloud:', err);
      setError('Failed to sync from cloud');
      throw err;
    }
  }, [user, loadUserShows]);

  // Manual migration from local to Firestore (if needed)
  const migrateLocalToFirestore = useCallback(async () => {
    if (!user) throw new Error('No user authenticated');
    
    try {
      await userLibraryService.migrateToFirestore(user.id, true);
      await loadUserShows(); // Refresh after migration
    } catch (err) {
      console.error('Manual migration failed:', err);
      throw err;
    }
  }, [user, loadUserShows]);

  // Computed values
  const watchingShows = getShowsByStatus('watching');
  const wantToWatchShows = getShowsByStatus('want-to-watch');
  const watchedShows = getShowsByStatus('watched');

  // Detailed computed values
  const watchingShowsWithDetails = getDetailedShowsByStatus('watching');
  const wantToWatchShowsWithDetails = getDetailedShowsByStatus('want-to-watch');
  const watchedShowsWithDetails = getDetailedShowsByStatus('watched');

  return {
    // Data
    userShows,
    userShowsWithDetails,
    watchingShows,
    wantToWatchShows,
    watchedShows,
    watchingShowsWithDetails,
    wantToWatchShowsWithDetails,
    watchedShowsWithDetails,
    stats,
    
    // State
    loading,
    error,
    
    // Actions
    addShow,
    removeShow,
    updateShowStatus,
    updateShowProgress,
    rateShow,
    addNoteToShow,
    isShowInLibrary,
    getUserShowForShow,
    getShowsByStatus,
    getDetailedShowsByStatus,
    refreshLibrary,
    syncToCloud,
    syncFromCloud,
    migrateLocalToFirestore,
  };
}

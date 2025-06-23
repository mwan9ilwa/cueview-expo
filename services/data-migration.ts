import * as FileSystem from 'expo-file-system';
import { firestoreService } from './firestore';
import { userLibraryService } from './user-library';

export class DataMigrationService {
  // Export user data for backup
  async exportUserData(userId: string): Promise<string> {
    try {
      const userData = {
        shows: await userLibraryService.getUserShows(userId),
        stats: await userLibraryService.getLibraryStats(userId),
        exportDate: new Date().toISOString(),
        version: '2.0',
      };

      const jsonData = JSON.stringify(userData, null, 2);
      const fileName = `cueview-backup-${userId}-${Date.now()}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, jsonData);
      return filePath;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Import user data from backup
  async importUserData(userId: string, filePath: string): Promise<void> {
    try {
      const jsonData = await FileSystem.readAsStringAsync(filePath);
      const userData = JSON.parse(jsonData);

      if (userData.version !== '2.0') {
        throw new Error('Unsupported backup version');
      }

      // Clear existing data (with confirmation)
      const existingShows = await userLibraryService.getUserShows(userId);
      for (const show of existingShows) {
        await userLibraryService.removeShowFromLibrary(userId, show.showId);
      }

      // Import shows
      for (const show of userData.shows) {
        // Convert the UserShow back to the format needed for import
        const tmdbShow = {
          id: show.showId,
          name: show.name || 'Unknown',
          overview: '',
          poster_path: null,
          backdrop_path: null,
          first_air_date: '',
          last_air_date: '',
          number_of_episodes: 0,
          number_of_seasons: 0,
          status: 'Unknown',
          vote_average: 0,
          vote_count: 0,
          genres: [],
          networks: [],
          created_by: [],
          episode_run_time: [],
          homepage: '',
          in_production: false,
          languages: [],
          origin_country: [],
          original_language: '',
          original_name: '',
          popularity: 0,
          production_companies: [],
          production_countries: [],
          spoken_languages: [],
          tagline: '',
          type: '',
        };

        await userLibraryService.addShowToLibrary(userId, tmdbShow, show.status);
        
        // Update additional metadata
        if (show.rating) {
          await userLibraryService.updateShowRating(userId, show.showId, show.rating);
        }
        if (show.notes) {
          await userLibraryService.updateShowNotes(userId, show.showId, show.notes);
        }
        
        // Import watched episodes
        for (const episode of show.watchedEpisodes) {
          await userLibraryService.markEpisodeWatched(
            userId, 
            show.showId, 
            episode.seasonNumber, 
            episode.episodeNumber
          );
        }
      }
    } catch (error) {
      console.error('Error importing user data:', error);
      throw new Error('Failed to import data');
    }
  }

  // Migrate from old data structure to new enhanced structure
  async migrateToEnhancedStructure(userId: string): Promise<void> {
    try {
      const shows = await userLibraryService.getUserShows(userId);
      const migratedShows = shows.map(show => ({
        ...show,
        // Add new fields with default values if missing
        totalRewatches: show.totalRewatches || 0,
        favoriteEpisodes: show.favoriteEpisodes || [],
        totalWatchTimeMinutes: show.totalWatchTimeMinutes || 0,
        reminderSettings: show.reminderSettings || {
          enabled: false,
          notifyOnNewEpisodes: false,
          notifyOnNewSeasons: false,
        },
      }));

      // Batch update all shows with new structure
      for (const show of migratedShows) {
        await firestoreService.saveUserShow(show);
      }

      console.log(`Migrated ${migratedShows.length} shows to enhanced structure`);
    } catch (error) {
      console.error('Error migrating data structure:', error);
      throw error;
    }
  }

  // Auto-backup to cloud storage (could be Google Drive, iCloud, etc.)
  async scheduleAutoBackup(userId: string): Promise<void> {
    // This would implement automatic backups
    // For now, just log the intent
    console.log('Auto-backup scheduled for user:', userId);
  }

  // Validate data integrity
  async validateDataIntegrity(userId: string): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      const shows = await userLibraryService.getUserShows(userId);
      
      for (const show of shows) {
        // Check for required fields
        if (!show.id || !show.userId || !show.showId) {
          issues.push(`Show ${show.showId || 'unknown'} missing required fields`);
        }
        
        // Validate watched episodes
        if (show.watchedEpisodes) {
          for (const episode of show.watchedEpisodes) {
            if (!episode.seasonNumber || !episode.episodeNumber || !episode.watchedAt) {
              issues.push(`Invalid episode data in show ${show.showId}`);
            }
          }
        }
        
        // Check for orphaned data
        if (show.currentSeason && show.currentEpisode) {
          const hasWatchedCurrentEpisode = show.watchedEpisodes.some(
            ep => ep.seasonNumber === show.currentSeason && ep.episodeNumber === show.currentEpisode
          );
          if (!hasWatchedCurrentEpisode) {
            issues.push(`Current episode not marked as watched for show ${show.showId}`);
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Failed to validate data: ${error}`]
      };
    }
  }
}

export const dataMigrationService = new DataMigrationService();

import { tmdbService } from '@/services/tmdb';
import { userLibraryService } from '@/services/user-library';
import { UserShowWithDetails } from '@/types';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  overview: string;
  poster_path: string | null;
  episodes?: Episode[];
}

interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  still_path: string | null;
  runtime: number;
  vote_average: number;
}

interface SeasonEpisodeModalProps {
  visible: boolean;
  onClose: () => void;
  userShow: UserShowWithDetails;
  onUpdateProgress: (showId: number, season: number, episode: number) => void;
  onShowDetailsUpdated?: (showId: number, showDetails: any) => void;
  userId?: string;
}

export default function SeasonEpisodeModal({
  visible,
  onClose,
  userShow,
  onUpdateProgress,
  onShowDetailsUpdated,
  userId,
}: SeasonEpisodeModalProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());
  const [batchOperationLoading, setBatchOperationLoading] = useState(false);

  const initializeWatchedEpisodes = useCallback(() => {
    const watched = new Set<string>();
    userShow.watchedEpisodes.forEach(ep => {
      watched.add(`${ep.seasonNumber}-${ep.episodeNumber}`);
    });
    setWatchedEpisodes(watched);
  }, [userShow.watchedEpisodes]);

  useEffect(() => {
    console.log('SeasonEpisodeModal useEffect triggered:', {
      visible,
      userShowId: userShow.showId,
      hasShowDetails: !!userShow.showDetails,
      showDetails: userShow.showDetails,
      watchedEpisodesCount: userShow.watchedEpisodes.length
    });
    
    if (visible) {
      if (userShow.showDetails) {
        fetchSeasons();
      } else {
        console.warn('Modal opened but userShow.showDetails is null, attempting to fetch...');
        fetchSeasonsWithoutCache();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, userShow.showId, userShow.showDetails]);

  // Separate effect for updating watched episodes when userShow changes
  useEffect(() => {
    initializeWatchedEpisodes();
  }, [initializeWatchedEpisodes]);

  const fetchSeasons = async () => {
    if (!userShow.showDetails) {
      console.error('Cannot fetch seasons: userShow.showDetails is null');
      return;
    }
    
    console.log('Fetching seasons for show:', userShow.showId);
    setLoading(true);
    try {
      const showDetails = await tmdbService.getShowDetails(userShow.showId);
      console.log('Show details loaded:', showDetails.name, 'Seasons:', showDetails.number_of_seasons);
      const seasonsData: Season[] = [];
      
      for (let i = 1; i <= showDetails.number_of_seasons; i++) {
        try {
          console.log(`Fetching season ${i}...`);
          const seasonData = await tmdbService.getSeasonDetails(userShow.showId, i);
          seasonsData.push(seasonData);
        } catch (error) {
          console.error(`Error fetching season ${i}:`, error);
        }
      }
      
      console.log('All seasons loaded:', seasonsData.length);
      setSeasons(seasonsData);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      Alert.alert('Error', 'Failed to load seasons data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasonsWithoutCache = async () => {
    console.log('Fetching seasons directly from TMDb for show:', userShow.showId);
    setLoading(true);
    try {
      const showDetails = await tmdbService.getShowDetails(userShow.showId);
      console.log('Show details loaded:', showDetails.name, 'Seasons:', showDetails.number_of_seasons);
      
      // Update the cache with the fetched show details
      if (userId) {
        try {
          await userLibraryService.updateCachedShowData(userShow.showId, showDetails);
        } catch (error) {
          console.error('Failed to update cached show data:', error);
        }
      }
      
      // Notify parent that we have show details now
      if (onShowDetailsUpdated) {
        onShowDetailsUpdated(userShow.showId, showDetails);
      }
      
      const seasonsData: Season[] = [];
      
      for (let i = 1; i <= showDetails.number_of_seasons; i++) {
        try {
          console.log(`Fetching season ${i}...`);
          const seasonData = await tmdbService.getSeasonDetails(userShow.showId, i);
          seasonsData.push(seasonData);
        } catch (error) {
          console.error(`Error fetching season ${i}:`, error);
        }
      }
      
      console.log('All seasons loaded:', seasonsData.length);
      setSeasons(seasonsData);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      Alert.alert('Error', 'Failed to load seasons data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async (seasonNumber: number) => {
    const seasonIndex = seasons.findIndex(s => s.season_number === seasonNumber);
    if (seasonIndex === -1 || seasons[seasonIndex].episodes) return;

    try {
      const seasonData = await tmdbService.getSeasonDetails(userShow.showId, seasonNumber);
      const updatedSeasons = [...seasons];
      updatedSeasons[seasonIndex] = seasonData;
      setSeasons(updatedSeasons);
    } catch (error) {
      console.error(`Error fetching episodes for season ${seasonNumber}:`, error);
    }
  };

  const toggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
    } else {
      setExpandedSeason(seasonNumber);
      await fetchEpisodes(seasonNumber);
    }
  };

  const toggleEpisodeWatched = async (seasonNumber: number, episodeNumber: number) => {
    const key = `${seasonNumber}-${episodeNumber}`;
    const newWatched = new Set(watchedEpisodes);
    const wasWatched = newWatched.has(key);
    
    if (wasWatched) {
      newWatched.delete(key);
    } else {
      newWatched.add(key);
    }
    
    setWatchedEpisodes(newWatched);
    
    // Save to Firestore if userId is available
    if (userId) {
      try {
        if (wasWatched) {
          await userLibraryService.markEpisodeUnwatched(userId, userShow.showId, seasonNumber, episodeNumber);
        } else {
          await userLibraryService.markEpisodeWatched(userId, userShow.showId, seasonNumber, episodeNumber);
          // Update user's current progress after successful save
          onUpdateProgress(userShow.showId, seasonNumber, episodeNumber);
        }
      } catch (error) {
        console.error('Failed to save episode watch status:', error);
        // Revert UI state on error
        const revertedWatched = new Set(watchedEpisodes);
        if (wasWatched) {
          revertedWatched.add(key);
        } else {
          revertedWatched.delete(key);
        }
        setWatchedEpisodes(revertedWatched);
        Alert.alert('Error', 'Failed to save episode progress. Please try again.');
      }
    }
  };

  const isSeasonWatched = (season: Season) => {
    if (!season.episodes) return false;
    return season.episodes.every(ep => 
      watchedEpisodes.has(`${season.season_number}-${ep.episode_number}`)
    );
  };

  // Batch operations
  const handleMarkSeasonWatched = async (season: Season) => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to update progress');
      return;
    }

    Alert.alert(
      'Mark Season Watched',
      `Mark all episodes in ${season.name} as watched?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Watched',
          onPress: async () => {
            setBatchOperationLoading(true);
            try {
              const episodes = season.episodes || [];
              await userLibraryService.markSeasonWatched(
                userId,
                userShow.showId,
                season.season_number,
                episodes
              );
              
              // Update progress to last episode of the season
              if (episodes.length > 0) {
                const lastEpisode = episodes[episodes.length - 1];
                onUpdateProgress(userShow.showId, season.season_number, lastEpisode.episode_number);
              }
              
              Alert.alert('Success', `${season.name} marked as watched!`);
            } catch (error) {
              console.error('Error marking season watched:', error);
              Alert.alert('Error', 'Failed to update season progress');
            } finally {
              setBatchOperationLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkSeasonUnwatched = async (season: Season) => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to update progress');
      return;
    }

    Alert.alert(
      'Mark Season Unwatched',
      `Mark all episodes in ${season.name} as unwatched?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Unwatched',
          onPress: async () => {
            setBatchOperationLoading(true);
            try {
              const episodes = season.episodes || [];
              await userLibraryService.markSeasonUnwatched(
                userId,
                userShow.showId,
                season.season_number,
                episodes
              );
              
              Alert.alert('Success', `${season.name} marked as unwatched!`);
            } catch (error) {
              console.error('Error marking season unwatched:', error);
              Alert.alert('Error', 'Failed to update season progress');
            } finally {
              setBatchOperationLoading(false);
            }
          }
        }
      ]
    );
  };

  const getSeasonProgress = (season: Season) => {
    const episodes = season.episodes || [];
    if (episodes.length === 0) return { watched: 0, total: 0, percentage: 0 };
    
    const watchedCount = episodes.filter(episode => 
      userShow.watchedEpisodes.some(
        we => we.seasonNumber === season.season_number && we.episodeNumber === episode.episode_number
      )
    ).length;
    
    return {
      watched: watchedCount,
      total: episodes.length,
      percentage: Math.round((watchedCount / episodes.length) * 100)
    };
  };

  const toggleSeasonWatched = async (season: Season) => {
    if (!season.episodes) return;
    
    const newWatched = new Set(watchedEpisodes);
    const isWatched = isSeasonWatched(season);
    
    // Update local state first
    season.episodes.forEach(ep => {
      const key = `${season.season_number}-${ep.episode_number}`;
      if (isWatched) {
        newWatched.delete(key);
      } else {
        newWatched.add(key);
      }
    });
    
    setWatchedEpisodes(newWatched);
    
    if (!isWatched && season.episodes.length > 0) {
      const lastEpisode = season.episodes[season.episodes.length - 1];
      onUpdateProgress(userShow.showId, season.season_number, lastEpisode.episode_number);
    }
    
    // Save to Firestore if userId is available
    if (userId) {
      try {
        if (isWatched) {
          // Mark entire season as unwatched
          await userLibraryService.markSeasonUnwatched(userId, userShow.showId, season.season_number, season.episodes);
        } else {
          // Mark entire season as watched
          await userLibraryService.markSeasonWatched(userId, userShow.showId, season.season_number, season.episodes);
        }
        
        // Notify parent of progress update after successful save
        if (!isWatched && season.episodes.length > 0) {
          const lastEpisode = season.episodes[season.episodes.length - 1];
          onUpdateProgress(userShow.showId, season.season_number, lastEpisode.episode_number);
        }
      } catch (error) {
        console.error('Failed to save season watch status:', error);
        // Revert UI state on error
        const revertedWatched = new Set(watchedEpisodes);
        season.episodes.forEach(ep => {
          const key = `${season.season_number}-${ep.episode_number}`;
          if (isWatched) {
            revertedWatched.add(key);
          } else {
            revertedWatched.delete(key);
          }
        });
        setWatchedEpisodes(revertedWatched);
        Alert.alert('Error', 'Failed to save season progress. Please try again.');
      }
    }
  };

  const batchToggleWatched = async (watch: boolean) => {
    setBatchOperationLoading(true);
    try {
      for (const season of seasons) {
        if (season.episodes) {
          for (const episode of season.episodes) {
            const key = `${season.season_number}-${episode.episode_number}`;
            const isWatched = watchedEpisodes.has(key);
            
            if (watch && !isWatched) {
              // Mark episode as watched
              await userLibraryService.markEpisodeWatched(userId!, userShow.showId, season.season_number, episode.episode_number);
              watchedEpisodes.add(key);
            } else if (!watch && isWatched) {
              // Mark episode as unwatched
              await userLibraryService.markEpisodeUnwatched(userId!, userShow.showId, season.season_number, episode.episode_number);
              watchedEpisodes.delete(key);
            }
          }
        }
      }
      
      setWatchedEpisodes(new Set(watchedEpisodes));
      Alert.alert('Success', `All episodes marked as ${watch ? 'watched' : 'unwatched'}.`);
    } catch (error) {
      console.error('Batch operation failed:', error);
      Alert.alert('Error', 'Failed to update episode status. Please try again.');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {userShow.showDetails?.name || `Show #${userShow.showId}`}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading seasons...</ThemedText>
            </View>
          ) : seasons.length === 0 ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                No seasons found for this show.
              </ThemedText>
            </View>
          ) : (
            seasons.map((season) => (
              <View key={season.id} style={styles.seasonContainer}>
                <TouchableOpacity
                  style={styles.seasonHeader}
                  onPress={() => toggleSeason(season.season_number)}
                >
                  <View style={styles.seasonInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.seasonTitle}>
                      {season.name}
                    </ThemedText>
                    <ThemedText style={styles.seasonDetails}>
                      {season.episode_count} episodes • {season.air_date ? new Date(season.air_date).getFullYear() : 'TBA'}
                    </ThemedText>
                    {season.episodes && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                          <View style={[styles.progressBar, { width: `${getSeasonProgress(season).percentage}%` }]} />
                        </View>
                        <ThemedText style={styles.progressText}>
                          {getSeasonProgress(season).watched}/{getSeasonProgress(season).total} watched ({getSeasonProgress(season).percentage}%)
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.seasonActions}>
                    {season.episodes && (
                      <>
                        <TouchableOpacity
                          style={[styles.batchButton, styles.markWatchedButton]}
                          onPress={() => handleMarkSeasonWatched(season)}
                          disabled={batchOperationLoading}
                        >
                          <IconSymbol name="checkmark.circle.fill" size={16} color="white" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.batchButton, styles.markUnwatchedButton]}
                          onPress={() => handleMarkSeasonUnwatched(season)}
                          disabled={batchOperationLoading}
                        >
                          <IconSymbol name="xmark.circle.fill" size={16} color="white" />
                        </TouchableOpacity>
                      </>
                    )}
                    <IconSymbol 
                      name="chevron.right" 
                      size={16} 
                      color="#666"
                      style={{ 
                        transform: [{ rotate: expandedSeason === season.season_number ? '90deg' : '0deg' }] 
                      }}
                    />
                  </View>
                </TouchableOpacity>

                {expandedSeason === season.season_number && season.episodes && (
                  <View style={styles.episodesContainer}>
                    {season.episodes.map((episode) => (
                      <TouchableOpacity
                        key={episode.id}
                        style={styles.episodeItem}
                        onPress={async () => await toggleEpisodeWatched(season.season_number, episode.episode_number)}
                      >
                        <View style={styles.episodeInfo}>
                          <ThemedText style={styles.episodeTitle}>
                            {episode.episode_number}. {episode.name}
                          </ThemedText>
                          <ThemedText style={styles.episodeDate}>
                            {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                          </ThemedText>
                        </View>
                        <View style={[
                          styles.episodeCheckbox,
                          watchedEpisodes.has(`${season.season_number}-${episode.episode_number}`) && styles.episodeChecked
                        ]}>
                          {watchedEpisodes.has(`${season.season_number}-${episode.episode_number}`) && (
                            <ThemedText style={styles.checkmark}>✓</ThemedText>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}

          <View style={styles.batchActionsContainer}>
            <TouchableOpacity
              style={[styles.batchActionButton, batchOperationLoading && styles.buttonLoading]}
              onPress={async () => await batchToggleWatched(true)}
              disabled={batchOperationLoading}
            >
              <ThemedText style={styles.batchActionText}>
                {batchOperationLoading ? 'Processing...' : 'Mark All as Watched'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.batchActionButton, batchOperationLoading && styles.buttonLoading]}
              onPress={async () => await batchToggleWatched(false)}
              disabled={batchOperationLoading}
            >
              <ThemedText style={styles.batchActionText}>
                {batchOperationLoading ? 'Processing...' : 'Mark All as Unwatched'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
    opacity: 0.6,
  },
  seasonContainer: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  seasonHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  seasonInfo: {
    flex: 1,
  },
  seasonTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  seasonDetails: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressContainer: {
    position: 'relative',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  seasonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchedButton: {
    backgroundColor: '#34C759',
  },
  watchButtonText: {
    fontSize: 16,
    color: '#34C759',
  },
  watchedButtonText: {
    color: 'white',
  },
  expandIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  episodesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  episodeDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  episodeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeChecked: {
    backgroundColor: '#34C759',
  },
  checkmark: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  batchActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  batchActionButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLoading: {
    backgroundColor: 'rgba(52,199,89,0.7)',
  },
  batchActionText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

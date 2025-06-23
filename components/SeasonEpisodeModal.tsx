import { tmdbService } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import React, { useEffect, useState } from 'react';
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
}

export default function SeasonEpisodeModal({
  visible,
  onClose,
  userShow,
  onUpdateProgress,
}: SeasonEpisodeModalProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && userShow.showDetails) {
      fetchSeasons();
      initializeWatchedEpisodes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, userShow.showId]);

  const initializeWatchedEpisodes = () => {
    const watched = new Set<string>();
    userShow.watchedEpisodes.forEach(ep => {
      watched.add(`${ep.seasonNumber}-${ep.episodeNumber}`);
    });
    setWatchedEpisodes(watched);
  };

  const fetchSeasons = async () => {
    if (!userShow.showDetails) return;
    
    setLoading(true);
    try {
      const showDetails = await tmdbService.getShowDetails(userShow.showId);
      const seasonsData: Season[] = [];
      
      for (let i = 1; i <= showDetails.number_of_seasons; i++) {
        try {
          const seasonData = await tmdbService.getSeasonDetails(userShow.showId, i);
          seasonsData.push(seasonData);
        } catch (error) {
          console.error(`Error fetching season ${i}:`, error);
        }
      }
      
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

  const toggleEpisodeWatched = (seasonNumber: number, episodeNumber: number) => {
    const key = `${seasonNumber}-${episodeNumber}`;
    const newWatched = new Set(watchedEpisodes);
    
    if (newWatched.has(key)) {
      newWatched.delete(key);
    } else {
      newWatched.add(key);
      // Update user's current progress
      onUpdateProgress(userShow.showId, seasonNumber, episodeNumber);
    }
    
    setWatchedEpisodes(newWatched);
  };

  const isSeasonWatched = (season: Season) => {
    if (!season.episodes) return false;
    return season.episodes.every(ep => 
      watchedEpisodes.has(`${season.season_number}-${ep.episode_number}`)
    );
  };

  const getSeasonProgress = (season: Season) => {
    if (!season.episodes) return 0;
    const watchedCount = season.episodes.filter(ep => 
      watchedEpisodes.has(`${season.season_number}-${ep.episode_number}`)
    ).length;
    return (watchedCount / season.episodes.length) * 100;
  };

  const toggleSeasonWatched = (season: Season) => {
    if (!season.episodes) return;
    
    const newWatched = new Set(watchedEpisodes);
    const isWatched = isSeasonWatched(season);
    
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
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {userShow.showDetails?.name}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <ThemedText style={styles.loadingText}>Loading seasons...</ThemedText>
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
                        <View style={[styles.progressBar, { width: `${getSeasonProgress(season)}%` }]} />
                        <ThemedText style={styles.progressText}>
                          {season.episodes.filter(ep => watchedEpisodes.has(`${season.season_number}-${ep.episode_number}`)).length}/{season.episodes.length} watched
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.seasonActions}>
                    {season.episodes && (
                      <TouchableOpacity
                        style={[styles.watchButton, isSeasonWatched(season) && styles.watchedButton]}
                        onPress={() => toggleSeasonWatched(season)}
                      >
                        <ThemedText style={[styles.watchButtonText, isSeasonWatched(season) && styles.watchedButtonText]}>
                          {isSeasonWatched(season) ? '✓' : '○'}
                        </ThemedText>
                      </TouchableOpacity>
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
                        onPress={() => toggleEpisodeWatched(season.season_number, episode.episode_number)}
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
});

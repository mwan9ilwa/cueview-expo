import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import SeasonEpisodeModal from './SeasonEpisodeModal';

interface ShowCardProps {
  show?: TMDbShow;
  userShow?: UserShowWithDetails;
  onPress: (showIdOrShow: number | TMDbShow) => void;
  onUpdateProgress?: (showId: number, season: number, episode: number) => void;
  onShowDetailsUpdated?: (showId: number, showDetails: any) => void;
  showProgress?: boolean;
  progress?: number;
  layout?: 'grid' | 'list';
  userId?: string;
}

export default function ShowCard({ 
  show, 
  userShow, 
  onPress, 
  onUpdateProgress,
  onShowDetailsUpdated,
  showProgress = false, 
  progress = 0,
  layout = 'grid',
  userId
}: ShowCardProps) {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [nextAirDate, setNextAirDate] = useState<{ date: string; episodeInfo: string } | null>(null);
  
  // Determine which show data to use
  const displayShow = userShow?.showDetails || show;
  const isUserShow = !!userShow;

  const fetchNextAirDate = useCallback(async () => {
    if (!userShow || !displayShow) return;
    
    try {
      // Check if the show is still airing
      const showStatus = displayShow.status?.toLowerCase();
      if (showStatus === 'ended' || showStatus === 'canceled' || showStatus === 'cancelled') {
        setNextAirDate({ date: 'Series ended', episodeInfo: '' });
        return;
      }

      // Get next episode info based on current progress
      const currentSeason = userShow.currentSeason || 1;
      const currentEpisode = userShow.currentEpisode || 0;
      
      // Try to get the next episode in current season
      const seasonDetails = await tmdbService.getSeasonDetails(userShow.showId, currentSeason);
      const nextEpisodeInSeason = seasonDetails.episodes?.find(ep => ep.episode_number > currentEpisode);
      
      if (nextEpisodeInSeason && nextEpisodeInSeason.air_date) {
        const airDate = new Date(nextEpisodeInSeason.air_date);
        const now = new Date();
        
        if (airDate > now) {
          setNextAirDate({
            date: formatAirDateWithTime(airDate),
            episodeInfo: `S${currentSeason}E${nextEpisodeInSeason.episode_number}`
          });
          return;
        }
      }

      // If no next episode in current season, check next season
      if (currentSeason < displayShow.number_of_seasons) {
        try {
          const nextSeasonDetails = await tmdbService.getSeasonDetails(userShow.showId, currentSeason + 1);
          if (nextSeasonDetails.episodes?.[0]?.air_date) {
            const airDate = new Date(nextSeasonDetails.episodes[0].air_date);
            setNextAirDate({
              date: formatAirDateWithTime(airDate),
              episodeInfo: `S${currentSeason + 1}E1`
            });
            return;
          }
        } catch {
          // Next season might not be available yet
        }
      }

      // If show is ongoing but no specific air date
      if (showStatus === 'returning series' || showStatus === 'on the air') {
        setNextAirDate({ date: 'Date TBA', episodeInfo: 'Next episode' });
      } else {
        setNextAirDate(null);
      }
    } catch (error) {
      console.error('Error fetching next air date:', error);
      setNextAirDate(null);
    }
  }, [userShow, displayShow]);

  const formatAirDateWithTime = (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Already aired';
    } else if (diffDays === 0) {
      // Show time for today's episodes
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `Today at ${timeString}`;
    } else if (diffDays === 1) {
      // Show time for tomorrow's episodes
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `Tomorrow at ${timeString}`;
    } else if (diffDays < 7) {
      // Show day and time for this week
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dayName} at ${timeString}`;
    } else {
      // Show date and time for future episodes
      const dateString = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dateString} at ${timeString}`;
    }
  };

  // Fetch next air date for user shows in list layout
  useEffect(() => {
    if (layout === 'list' && isUserShow && userShow && displayShow) {
      fetchNextAirDate();
    }
  }, [layout, isUserShow, userShow, displayShow, fetchNextAirDate]);
  
  if (!displayShow) return null;
  
  const posterUrl = displayShow.poster_path 
    ? `https://image.tmdb.org/t/p/w300${displayShow.poster_path}`
    : null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).getFullYear().toString();
    } catch {
      return '';
    }
  };

  const handlePress = () => {
    if (userShow) {
      onPress(userShow.showId);
    } else if (show) {
      onPress(show);
    }
  };

  const handleEpisodeManagement = (e: any) => {
    e.stopPropagation(); // Prevent card press
    setShowProgressModal(true);
  };

  return (
    <TouchableOpacity 
      style={layout === 'list' ? styles.listContainer : styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={layout === 'list' ? styles.listPosterContainer : styles.posterContainer}>
        {posterUrl ? (
          <Image 
            source={{ uri: posterUrl }} 
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPoster}>
            <IconSymbol name="tv.fill" size={24} color="#999" />
          </View>
        )}
        
        {showProgress && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}

        {/* Episode management button for user shows */}
        {isUserShow && onUpdateProgress && layout === 'grid' && (
          <TouchableOpacity 
            style={styles.episodeButton}
            onPress={handleEpisodeManagement}
          >
            <IconSymbol name="tv.fill" size={14} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      <ThemedView style={layout === 'list' ? styles.listInfoContainer : styles.infoContainer}>
        <ThemedText style={layout === 'list' ? styles.listTitle : styles.title} numberOfLines={2}>
          {displayShow.name}
        </ThemedText>
        
        {/* Show year and rating for grid layout only */}
        {layout === 'grid' && (
          <>
            <ThemedText style={styles.year}>
              {formatDate(displayShow.first_air_date)}
            </ThemedText>
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={12} color="#FFD700" />
              <ThemedText style={styles.rating}>
                {displayShow.vote_average.toFixed(1)}
              </ThemedText>
            </View>
          </>
        )}
        
        {/* Show current episode progress for user shows */}
        {isUserShow && userShow.currentSeason && userShow.currentEpisode && (
          <ThemedText style={styles.progressText}>
            S{userShow.currentSeason}E{userShow.currentEpisode}
          </ThemedText>
        )}
        
        {/* Next air date for list layout */}
        {layout === 'list' && isUserShow && nextAirDate && (
          <View style={styles.airDateContainer}>
            <IconSymbol name="calendar" size={12} color="#007AFF" />
            <ThemedText style={styles.airDateText}>
              {nextAirDate.episodeInfo ? `${nextAirDate.episodeInfo} • ${nextAirDate.date}` : nextAirDate.date}
            </ThemedText>
          </View>
        )}

        {/* Episode management button for list layout */}
        {isUserShow && onUpdateProgress && layout === 'list' && (
          <TouchableOpacity 
            style={styles.listEpisodeButton}
            onPress={handleEpisodeManagement}
          >
            <IconSymbol name="tv.fill" size={16} color="#007AFF" />
            <ThemedText style={styles.episodeButtonText}>Episodes</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Season Episode Modal */}
      {showProgressModal && userShow && onUpdateProgress && (
        <SeasonEpisodeModal
          visible={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          userShow={userShow}
          onUpdateProgress={onUpdateProgress}
          onShowDetailsUpdated={onShowDetailsUpdated}
          userId={userId}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    marginRight: 12,
  },
  posterContainer: {
    position: 'relative',
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  placeholderPoster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  episodeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  year: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 2,
  },
  ratingContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    opacity: 0.8,
  },
  // List layout styles
  listContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    gap: 16,
    minHeight: 140,
  },
  listPosterContainer: {
    width: 90,
    height: 135,
    borderRadius: 8,
    overflow: 'hidden',
  },
  listInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  listEpisodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  episodeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  airDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  airDateText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});

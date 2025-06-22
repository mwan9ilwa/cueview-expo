import { formatCountdown, getNextEpisodeInfo, getShowStatusInfo } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import EpisodeProgressModal from './EpisodeProgressModal';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface EpisodeInfo {
  type: string;
  season: number;
  episode: number;
  name: string;
  airDate: string;
  overview?: string;
}

interface LibraryShowCardProps {
  userShow: UserShowWithDetails;
  onPress: (showId: number) => void;
  onUpdateProgress?: (showId: number, season: number, episode: number) => void;
  showProgress?: boolean;
}

function LibraryShowCard({ userShow, onPress, onUpdateProgress, showProgress }: LibraryShowCardProps) {
  const { showDetails } = userShow;
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [nextEpisode, setNextEpisode] = useState<EpisodeInfo | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  
  const posterUrl = showDetails?.poster_path
    ? `https://image.tmdb.org/t/p/w300${showDetails.poster_path}`
    : null;

  // Load next episode info
  useEffect(() => {
    if (showDetails && userShow.status === 'watching') {
      setLoadingNext(true);
      getNextEpisodeInfo(userShow.showId, userShow.currentSeason, userShow.currentEpisode)
        .then((result) => setNextEpisode(result))
        .catch(error => {
          console.error('Error loading next episode:', error);
          setNextEpisode(null);
        })
        .finally(() => setLoadingNext(false));
    }
  }, [showDetails, userShow.showId, userShow.currentSeason, userShow.currentEpisode, userShow.status]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      return new Date(dateString).getFullYear().toString();
    } catch {
      return '';
    }
  };

  const getProgressText = () => {
    if (!showProgress || !userShow.currentSeason || !userShow.currentEpisode) {
      return null;
    }
    return `S${userShow.currentSeason}E${userShow.currentEpisode}`;
  };

  const getStatusColor = () => {
    switch (userShow.status) {
      case 'watching': return '#34C759';
      case 'want-to-watch': return '#FF9500';
      case 'watched': return '#007AFF';
      default: return '#999';
    }
  };

  const showStatusInfo = showDetails ? getShowStatusInfo(showDetails) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(userShow.showId)}
      activeOpacity={0.7}
    >
      <ThemedView style={styles.card}>
        {/* Poster Image */}
        <View style={styles.posterContainer}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} />
          ) : (
            <View style={styles.placeholderPoster}>
              <ThemedText style={styles.placeholderText}>📺</ThemedText>
            </View>
          )}
          
          {/* Status Indicator */}
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        </View>

        {/* Show Information */}
        <View style={styles.info}>
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
            {showDetails?.name || `Show #${userShow.showId}`}
          </ThemedText>
          
          <View style={styles.metadata}>
            {showDetails?.first_air_date && (
              <ThemedText style={styles.year}>
                {formatDate(showDetails.first_air_date)}
              </ThemedText>
            )}
            
            {showDetails?.vote_average && showDetails.vote_average > 0 && (
              <ThemedText style={styles.rating}>
                ⭐ {showDetails.vote_average.toFixed(1)}
              </ThemedText>
            )}

            {/* Show Status */}
            {showStatusInfo && (
              <View style={[styles.showStatusBadge, { backgroundColor: showStatusInfo.color + '20' }]}>
                <ThemedText style={[styles.showStatusText, { color: showStatusInfo.color }]}>
                  {showStatusInfo.text}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Next Episode Info */}
          {nextEpisode && userShow.status === 'watching' && (
            <View style={styles.nextEpisodeContainer}>
              <ThemedText style={styles.nextEpisodeTitle} numberOfLines={1}>
                Next: S{nextEpisode.season}E{nextEpisode.episode} - {nextEpisode.name}
              </ThemedText>
              <ThemedText style={styles.countdown}>
                {formatCountdown(nextEpisode.airDate)}
              </ThemedText>
            </View>
          )}

          {/* Loading next episode */}
          {loadingNext && userShow.status === 'watching' && (
            <View style={styles.nextEpisodeContainer}>
              <ThemedText style={styles.loadingText}>Loading next episode...</ThemedText>
            </View>
          )}

          {/* Progress or Status */}
          <View style={styles.statusContainer}>
            <ThemedText style={[styles.status, { color: getStatusColor() }]}>
              {userShow.status.replace('-', ' ').toUpperCase()}
            </ThemedText>
            
            {getProgressText() && (
              <TouchableOpacity 
                style={styles.progressButton}
                onPress={() => setShowProgressModal(true)}
              >
                <ThemedText style={styles.progress}>
                  {getProgressText()}
                </ThemedText>
              </TouchableOpacity>
            )}

            {showProgress && !getProgressText() && userShow.status === 'watching' && (
              <TouchableOpacity 
                style={styles.addProgressButton}
                onPress={() => setShowProgressModal(true)}
              >
                <ThemedText style={styles.addProgressText}>
                  Add Progress
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* User Rating */}
          {userShow.rating && (
            <View style={styles.userRating}>
              <ThemedText style={styles.userRatingText}>
                {'⭐'.repeat(userShow.rating)} ({userShow.rating}/5)
              </ThemedText>
            </View>
          )}

          {/* User Notes */}
          {userShow.notes && (
            <ThemedText style={styles.notes} numberOfLines={2}>
              &ldquo;{userShow.notes}&rdquo;
            </ThemedText>
          )}

          {/* Show Overview (for want-to-watch) */}
          {userShow.status === 'want-to-watch' && showDetails?.overview && (
            <ThemedText style={styles.overview} numberOfLines={3}>
              {showDetails.overview}
            </ThemedText>
          )}
        </View>
      </ThemedView>

      {/* Episode Progress Modal */}
      {showProgressModal && onUpdateProgress && (
        <EpisodeProgressModal
          visible={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          showName={showDetails?.name || `Show #${userShow.showId}`}
          currentSeason={userShow.currentSeason || 1}
          currentEpisode={userShow.currentEpisode || 0}
          onUpdate={(season: number, episode: number) => {
            onUpdateProgress(userShow.showId, season, episode);
            setShowProgressModal(false);
          }}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  placeholderPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  statusDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  year: {
    fontSize: 12,
    opacity: 0.7,
  },
  rating: {
    fontSize: 12,
    opacity: 0.7,
  },
  showStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  showStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nextEpisodeContainer: {
    backgroundColor: 'rgba(52,199,89,0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  nextEpisodeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  countdown: {
    fontSize: 11,
    color: '#34C759',
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressButton: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  addProgressButton: {
    backgroundColor: 'rgba(52,199,89,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  addProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  userRating: {
    alignSelf: 'flex-start',
  },
  userRatingText: {
    fontSize: 12,
  },
  overview: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 16,
  },
  notes: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 6,
    borderRadius: 6,
  },
});

export default LibraryShowCard;

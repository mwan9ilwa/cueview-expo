import { formatCountdown, getNextEpisodeInfo, getShowStatusInfo } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import SeasonEpisodeModal from './SeasonEpisodeModal';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

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

  const getProgressText = () => {
    if (!showProgress || !userShow.currentSeason || !userShow.currentEpisode) {
      return null;
    }
    return `S${userShow.currentSeason}E${userShow.currentEpisode}`;
  };

  const showStatusInfo = showDetails ? getShowStatusInfo(showDetails) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(userShow.showId)}
      activeOpacity={0.7}
    >
      <ThemedView style={[styles.card, Platform.OS === 'ios' ? styles.iosBox : styles.androidCard]}>
        {/* Poster Image */}
        <View style={styles.posterContainer}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} />
          ) : (
            <View style={styles.placeholderPoster}>
              <IconSymbol name="tv.fill" size={24} color="#999" />
            </View>
          )}
          
          {/* Show Status Badge */}
          {showStatusInfo && (
            <View style={[styles.showStatusBadgeFloating, { backgroundColor: showStatusInfo.color }]}>
              <IconSymbol 
                name={
                  showStatusInfo.isBetweenSeasons ? 'pause.circle.fill' :
                  showStatusInfo.isWaitingForRelease ? 'clock.fill' : 
                  showStatusInfo.isActive ? 'tv.fill' : 
                  showStatusInfo.text === 'Ended' || showStatusInfo.text === 'Canceled' ? 'flag.checkered.fill' : 'question.circle.fill'
                } 
                size={12} 
                color="white" 
              />
            </View>
          )}
        </View>

        {/* Show Information */}
        <View style={styles.info}>
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
            {showDetails?.name || `Show #${userShow.showId}`}
          </ThemedText>

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

          {/* Waiting for Release Date Info */}
          {showStatusInfo?.isWaitingForRelease && !showStatusInfo?.isBetweenSeasons && (
            <View style={styles.waitingContainer}>
              <View style={styles.statusWithIcon}>
                <IconSymbol name="clock.fill" size={14} color="#5856D6" />
                <ThemedText style={styles.waitingTitle}>
                  {showStatusInfo.text}
                </ThemedText>
              </View>
              <ThemedText style={styles.waitingDate}>
                Check back for updates!
              </ThemedText>
            </View>
          )}

          {/* Show Ended Info */}
          {(showStatusInfo?.text === 'Ended' || showStatusInfo?.text === 'Canceled') && showDetails?.last_air_date && (
            <View style={styles.endedContainer}>
              <View style={styles.statusWithIcon}>
                <IconSymbol name="flag.checkered.fill" size={14} color="#FF3B30" />
                <ThemedText style={styles.endedTitle}>
                  {showStatusInfo.text}
                </ThemedText>
              </View>
              <ThemedText style={styles.endedDate}>
                Last aired: {new Date(showDetails.last_air_date).getFullYear()}
              </ThemedText>
            </View>
          )}

          {/* Loading next episode */}
          {loadingNext && userShow.status === 'watching' && (
            <View style={styles.nextEpisodeContainer}>
              <ThemedText style={styles.loadingText}>Loading next episode...</ThemedText>
            </View>
          )}

          {/* Episode management button for all shows */}
          {onUpdateProgress && (
            <TouchableOpacity 
              style={styles.manageEpisodesButton}
              onPress={() => setShowProgressModal(true)}
            >
              <View style={styles.manageButtonContent}>
                <IconSymbol name="tv.fill" size={14} color="#5856D6" />
                <ThemedText style={styles.manageEpisodesText}>
                  Manage Episodes
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}

          {/* User Rating */}
          {userShow.rating && (
            <View style={styles.userRating}>
              <View style={styles.ratingContainer}>
                {Array.from({ length: userShow.rating }, (_, i) => (
                  <IconSymbol key={i} name="star.fill" size={12} color="#FFD700" />
                ))}
                <ThemedText style={styles.ratingText}>
                  ({userShow.rating}/5)
                </ThemedText>
              </View>
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

      {/* Season Episode Modal */}
      {showProgressModal && onUpdateProgress && (
        <SeasonEpisodeModal
          visible={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          userShow={userShow}
          onUpdateProgress={onUpdateProgress}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 8, // Reduced to allow more width for cards
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    // borderColor: 'rgba(0,0,0,0.08)',
    // Remove fixed height constraints to let it match poster height
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: 90,   // Reduced from 120
    height: 145, // Reduced from 180 (maintaining 2:3 aspect ratio)
    borderRadius: 12,
  },
  placeholderPoster: {
    width: 90,   // Reduced from 120
    height: 145, // Reduced from 180
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  placeholderText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    padding: 10, // Increased back to 20 for taller cards
    gap: 10, // Increased back to 10 for better spacing
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
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
    padding: 5,
    borderRadius: 8,
  },
  nextEpisodeTitle: {
    fontSize: 10,
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
  progress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  manageEpisodesButton: {
    backgroundColor: 'rgba(88,86,214,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  manageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manageEpisodesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5856D6',
  },
  userRating: {
    alignSelf: 'flex-start',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
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
  showStatusBadgeFloating: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  showStatusTextFloating: {
    fontSize: 12,
    color: 'white',
  },
  waitingContainer: {
    backgroundColor: 'rgba(88,86,214,0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  waitingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5856D6',
  },
  waitingDate: {
    fontSize: 11,
    color: '#5856D6',
    opacity: 0.8,
  },
  betweenSeasonsContainer: {
    backgroundColor: 'rgba(255,149,0,0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  betweenSeasonsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  betweenSeasonsDate: {
    fontSize: 11,
    color: '#FF9500',
    opacity: 0.8,
  },
  endedContainer: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  endedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  endedDate: {
    fontSize: 11,
    color: '#FF3B30',
    opacity: 0.8,
  },
  statusWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Platform-specific styles
  iosBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 0, // Remove Android elevation for iOS
  },
  androidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 1,
    shadowColor: 'transparent', // Remove iOS shadow for Android
  },
});

export default LibraryShowCard;

import { UserShowWithDetails } from '@/types';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import EpisodeProgressModal from './EpisodeProgressModal';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface LibraryShowCardProps {
  userShow: UserShowWithDetails;
  onPress: (showId: number) => void;
  onUpdateProgress?: (showId: number, season: number, episode: number) => void;
  showProgress?: boolean;
}

export default function LibraryShowCard({ userShow, onPress, onUpdateProgress, showProgress }: LibraryShowCardProps) {
  const { showDetails } = userShow;
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  const posterUrl = showDetails?.poster_path
    ? `https://image.tmdb.org/t/p/w300${showDetails.poster_path}`
    : null;

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
          </View>

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
            
            {showProgress && !getProgressText() && onUpdateProgress && (
              <TouchableOpacity 
                style={styles.addProgressButton}
                onPress={() => setShowProgressModal(true)}
              >
                <ThemedText style={styles.addProgressText}>
                  + Progress
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Rating */}
          {userShow.rating && (
            <View style={styles.userRating}>
              <ThemedText style={styles.userRatingText}>
                {'⭐'.repeat(userShow.rating)}
              </ThemedText>
            </View>
          )}

          {/* Overview */}
          {showDetails?.overview && (
            <ThemedText style={styles.overview} numberOfLines={2}>
              {showDetails.overview}
            </ThemedText>
          )}

          {/* Notes */}
          {userShow.notes && (
            <ThemedText style={styles.notes} numberOfLines={1}>
              💭 {userShow.notes}
            </ThemedText>
          )}
        </View>
      </ThemedView>

      {/* Episode Progress Modal */}
      <EpisodeProgressModal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onUpdate={(season, episode) => {
          if (onUpdateProgress) {
            onUpdateProgress(userShow.showId, season, episode);
          }
        }}
        showName={showDetails?.name || `Show #${userShow.showId}`}
        currentSeason={userShow.currentSeason}
        currentEpisode={userShow.currentEpisode}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: 100,
    height: 150,
  },
  placeholderPoster: {
    width: 100,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.5,
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    gap: 12,
  },
  year: {
    fontSize: 12,
    opacity: 0.7,
  },
  rating: {
    fontSize: 12,
    opacity: 0.7,
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
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  progressButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    fontSize: 14,
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

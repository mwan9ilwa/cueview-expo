import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TMDbShow } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import SeasonEpisodeModal from './SeasonEpisodeModal';

interface ShowCardProps {
  show?: TMDbShow;
  userShow?: UserShowWithDetails;
  onPress: (showIdOrShow: number | TMDbShow) => void;
  onUpdateProgress?: (showId: number, season: number, episode: number) => void;
  showProgress?: boolean;
  progress?: number;
}

export default function ShowCard({ 
  show, 
  userShow, 
  onPress, 
  onUpdateProgress,
  showProgress = false, 
  progress = 0 
}: ShowCardProps) {
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  // Determine which show data to use
  const displayShow = userShow?.showDetails || show;
  const isUserShow = !!userShow;
  
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
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.posterContainer}>
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
        {isUserShow && onUpdateProgress && (
          <TouchableOpacity 
            style={styles.episodeButton}
            onPress={handleEpisodeManagement}
          >
            <IconSymbol name="tv.fill" size={14} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {displayShow.name}
        </ThemedText>
        <ThemedText style={styles.year}>
          {formatDate(displayShow.first_air_date)}
        </ThemedText>
        
        {/* Show current episode progress for user shows */}
        {isUserShow && userShow.currentSeason && userShow.currentEpisode && (
          <ThemedText style={styles.progressText}>
            S{userShow.currentSeason}E{userShow.currentEpisode}
          </ThemedText>
        )}
        
        <View style={styles.ratingContainer}>
          <IconSymbol name="star.fill" size={12} color="#FFD700" />
          <ThemedText style={styles.rating}>
            {displayShow.vote_average.toFixed(1)}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Season Episode Modal */}
      {showProgressModal && userShow && onUpdateProgress && (
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
});

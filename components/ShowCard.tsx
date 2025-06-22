import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbShow } from '@/services/tmdb';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ShowCardProps {
  show: TMDbShow;
  onPress: (show: TMDbShow) => void;
  showProgress?: boolean;
  progress?: number;
}

export default function ShowCard({ show, onPress, showProgress = false, progress = 0 }: ShowCardProps) {
  const posterUrl = show.poster_path 
    ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
    : null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).getFullYear().toString();
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(show)}
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
            <ThemedText style={styles.placeholderText}>📺</ThemedText>
          </View>
        )}
        
        {showProgress && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}
      </View>
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {show.name}
        </ThemedText>
        <ThemedText style={styles.year}>
          {formatDate(show.first_air_date)}
        </ThemedText>
        <View style={styles.ratingContainer}>
          <ThemedText style={styles.rating}>
            ⭐ {show.vote_average.toFixed(1)}
          </ThemedText>
        </View>
      </ThemedView>
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
  ratingContainer: {
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    opacity: 0.8,
  },
});

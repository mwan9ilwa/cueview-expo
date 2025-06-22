import LoadingScreen from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { ShowStatus } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ShowDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    addShow, 
    removeShow, 
    updateShowStatus, 
    isShowInLibrary, 
    getUserShowForShow 
  } = useUserLibrary();
  
  const [show, setShow] = useState<TMDbShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<ShowStatus | null>(null);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadShowDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const showData = await tmdbService.getShowDetails(parseInt(id!));
      setShow(showData);
      
      // Check if show is in user's library
      if (user) {
        const [inLibrary, userShow] = await Promise.all([
          isShowInLibrary(showData.id),
          getUserShowForShow(showData.id),
        ]);
        
        setIsInLibrary(inLibrary);
        setUserStatus(userShow?.status || null);
      }
      
    } catch (error) {
      console.error('Error loading show details:', error);
      setError('Failed to load show details');
    } finally {
      setLoading(false);
    }
  }, [id, user, isShowInLibrary, getUserShowForShow]);

  useEffect(() => {
    if (id) {
      loadShowDetails();
    }
  }, [id, loadShowDetails]);

  const handleAddToLibrary = async (status: ShowStatus) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add shows to your library.');
      return;
    }

    if (!show) return;

    try {
      setActionLoading(true);
      await addShow(show, status);
      setIsInLibrary(true);
      setUserStatus(status);
      
      Alert.alert(
        'Added to Library',
        `${show.name} has been added to your ${status.replace('-', ' ')} list.`
      );
    } catch (error) {
      console.error('Error adding show to library:', error);
      Alert.alert(
        'Error', 
        'Failed to add show to library. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!show || !user) return;
    
    Alert.alert(
      'Remove from Library',
      `Are you sure you want to remove "${show.name}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await removeShow(show.id);
              setIsInLibrary(false);
              setUserStatus(null);
              
              Alert.alert(
                'Removed from Library',
                `${show.name} has been removed from your library.`
              );
            } catch (error) {
              console.error('Error removing show from library:', error);
              Alert.alert(
                'Error', 
                'Failed to remove show from library. Please try again.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading show details..." />;
  }

  if (error || !show) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          {error || 'Show not found'}
        </ThemedText>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={loadShowDetails}
        >
          <ThemedText style={styles.retryText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}`
    : null;

  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatRuntime = (runtime: number[]) => {
    if (runtime.length === 0) return 'Unknown';
    return `${runtime[0]} min`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Backdrop Image */}
      {backdropUrl && (
        <View style={styles.backdropContainer}>
          <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
          <View style={styles.backdropOverlay} />
        </View>
      )}

      {/* Header with Poster and Basic Info */}
      <ThemedView style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backText}>← Back</ThemedText>
        </TouchableOpacity>

        <View style={styles.mainInfo}>
          {posterUrl && (
            <Image source={{ uri: posterUrl }} style={styles.poster} />
          )}
          
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              {show.name}
            </ThemedText>
            
            <View style={styles.metaInfo}>
              <ThemedText style={styles.year}>
                {formatDate(show.first_air_date)} • {show.status}
              </ThemedText>
              <ThemedText style={styles.rating}>
                ⭐ {show.vote_average.toFixed(1)} ({show.vote_count} votes)
              </ThemedText>
              <ThemedText style={styles.episodes}>
                {show.number_of_seasons} seasons • {show.number_of_episodes} episodes
              </ThemedText>
              <ThemedText style={styles.runtime}>
                {formatRuntime(show.episode_run_time)} per episode
              </ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>

      {/* Action Buttons */}
      <ThemedView style={styles.actionsContainer}>
        {isInLibrary ? (
          <>
            <View style={styles.statusContainer}>
              <ThemedText style={styles.statusText}>
                In your library: {userStatus?.replace('-', ' ')}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.removeButton, actionLoading && styles.disabledButton]}
              onPress={handleRemoveFromLibrary}
              disabled={actionLoading}
            >
              <ThemedText style={styles.removeButtonText}>
                {actionLoading ? 'Removing...' : 'Remove from Library'}
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.addButtonsContainer}>
            <TouchableOpacity 
              style={[styles.addButton, styles.watchingButton, actionLoading && styles.disabledButton]}
              onPress={() => handleAddToLibrary('watching')}
              disabled={actionLoading}
            >
              <ThemedText style={styles.addButtonText}>
                {actionLoading ? '...' : 'Watching'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.addButton, styles.wantToWatchButton, actionLoading && styles.disabledButton]}
              onPress={() => handleAddToLibrary('want-to-watch')}
              disabled={actionLoading}
            >
              <ThemedText style={styles.addButtonText}>
                {actionLoading ? '...' : 'Want to Watch'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.addButton, styles.watchedButton, actionLoading && styles.disabledButton]}
              onPress={() => handleAddToLibrary('watched')}
              disabled={actionLoading}
            >
              <ThemedText style={styles.addButtonText}>
                {actionLoading ? '...' : 'Watched'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>

      {/* Overview */}
      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Overview
        </ThemedText>
        <ThemedText style={styles.overview}>
          {show.overview || 'No overview available.'}
        </ThemedText>
      </ThemedView>

      {/* Genres */}
      {show.genres && show.genres.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Genres
          </ThemedText>
          <View style={styles.genresContainer}>
            {show.genres.map((genre) => (
              <View key={genre.id} style={styles.genreTag}>
                <ThemedText style={styles.genreText}>{genre.name}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>
      )}

      {/* Networks */}
      {show.networks && show.networks.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Networks
          </ThemedText>
          <View style={styles.networksContainer}>
            {show.networks.map((network) => (
              <ThemedText key={network.id} style={styles.networkText}>
                {network.name}
              </ThemedText>
            ))}
          </View>
        </ThemedView>
      )}

      {/* Creators */}
      {show.created_by && show.created_by.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Created By
          </ThemedText>
          <View style={styles.creatorsContainer}>
            {show.created_by.map((creator) => (
              <ThemedText key={creator.id} style={styles.creatorText}>
                {creator.name}
              </ThemedText>
            ))}
          </View>
        </ThemedView>
      )}

      <ThemedView style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdropContainer: {
    position: 'relative',
    height: 200,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContainer: {
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    opacity: 0.8,
  },
  mainInfo: {
    flexDirection: 'row',
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  metaInfo: {
    gap: 4,
  },
  year: {
    fontSize: 14,
    opacity: 0.8,
  },
  rating: {
    fontSize: 14,
    opacity: 0.8,
  },
  episodes: {
    fontSize: 14,
    opacity: 0.8,
  },
  runtime: {
    fontSize: 14,
    opacity: 0.8,
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  statusContainer: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '600',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  watchingButton: {
    backgroundColor: '#34C759',
  },
  wantToWatchButton: {
    backgroundColor: '#FF9500',
  },
  watchedButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  overview: {
    lineHeight: 20,
    opacity: 0.9,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    fontSize: 14,
  },
  networksContainer: {
    gap: 4,
  },
  networkText: {
    fontSize: 14,
    opacity: 0.8,
  },
  creatorsContainer: {
    gap: 4,
  },
  creatorText: {
    fontSize: 14,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

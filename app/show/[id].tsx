import LoadingScreen from '@/components/LoadingScreen';
import RatingNotesModal from '@/components/RatingNotesModal';
import SeasonEpisodeModal from '@/components/SeasonEpisodeModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
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
    isShowInLibrary, 
    getUserShowForShow,
    rateShow,
    addNoteToShow,
    updateShowProgress,
  } = useUserLibrary();
  
  const [show, setShow] = useState<TMDbShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<ShowStatus | null>(null);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [userShow, setUserShow] = useState<any>(null);

  const loadShowDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const showData = await tmdbService.getShowDetails(parseInt(id!));
      setShow(showData);
      
      // Check if show is in user's library
      if (user) {
        const [inLibrary, userShowData] = await Promise.all([
          isShowInLibrary(showData.id),
          getUserShowForShow(showData.id),
        ]);
        
        setIsInLibrary(inLibrary);
        setUserStatus(userShowData?.status || null);
        setUserShow(userShowData);
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
      
      // Update userShow to include the new show data
      const newUserShow = await getUserShowForShow(show.id);
      setUserShow(newUserShow);
      
      Alert.alert(
        'Added to Library',
        `${show.name} has been added to your ${status.replace('-', ' ')} list. Would you like to track your progress?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Track Progress',
            onPress: () => setShowProgressModal(true)
          }
        ]
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

  const handleUpdateProgress = async (showId: number, season: number, episode: number) => {
    try {
      await updateShowProgress(showId, season, episode);
      // Refresh user show data
      const updatedUserShow = await getUserShowForShow(showId);
      setUserShow(updatedUserShow);
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Failed to update progress. Please try again.');
    }
  };

  const handleRatingNotesUpdate = async (rating?: number, notes?: string) => {
    if (!show || !user) return;
    
    try {
      setActionLoading(true);
      
      if (rating !== undefined) {
        await rateShow(show.id, rating);
      }
      
      if (notes !== undefined) {
        await addNoteToShow(show.id, notes);
      }
      
      // Refresh user show data
      const updatedUserShow = await getUserShowForShow(show.id);
      setUserShow(updatedUserShow);
      
    } catch (error) {
      console.error('Error updating rating/notes:', error);
      Alert.alert('Error', 'Failed to update rating/notes. Please try again.');
    } finally {
      setActionLoading(false);
    }
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

  const formatRuntime = (runtime: number[] | null | undefined) => {
    if (!runtime || !Array.isArray(runtime) || runtime.length === 0) return 'Unknown';
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
              {show.name || 'Unknown Show'}
            </ThemedText>
            
            <View style={styles.metaInfo}>
              <ThemedText style={styles.year}>
                {formatDate(show.first_air_date || '')} • {show.status || 'Unknown'}
              </ThemedText>
              <View style={styles.ratingInfo}>
                <IconSymbol name="star.fill" size={14} color="#FFD700" />
                <ThemedText style={styles.rating}>
                  {show.vote_average?.toFixed(1) || 'N/A'} ({show.vote_count || 0} votes)
                </ThemedText>
              </View>
              <ThemedText style={styles.episodes}>
                {show.number_of_seasons || 0} seasons • {show.number_of_episodes || 0} episodes
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
            
            <View style={styles.libraryActionsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.manageEpisodesButton]}
                onPress={() => setShowProgressModal(true)}
                disabled={actionLoading}
              >
                <View style={styles.buttonContent}>
                  <IconSymbol name="tv.fill" size={16} color="white" />
                  <ThemedText style={styles.actionButtonText}>
                    Manage Episodes
                  </ThemedText>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.rateButton]}
                onPress={() => setShowRatingModal(true)}
                disabled={actionLoading}
              >
                <View style={styles.buttonContent}>
                  <IconSymbol name="star.fill" size={16} color="white" />
                  <ThemedText style={styles.actionButtonText}>
                    {userShow?.rating ? `${userShow.rating}` : 'Rate'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.removeButton, actionLoading && styles.disabledButton]}
                onPress={handleRemoveFromLibrary}
                disabled={actionLoading}
              >
                <ThemedText style={styles.removeButtonText}>
                  {actionLoading ? 'Removing...' : 'Remove'}
                </ThemedText>
              </TouchableOpacity>
            </View>
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

      {/* Rating & Notes Modal */}
      {show && (
        <RatingNotesModal
          visible={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSave={handleRatingNotesUpdate}
          showName={show.name || 'Unknown Show'}
          currentRating={userShow?.rating}
          currentNotes={userShow?.notes}
        />
      )}

      {/* Season Episode Progress Modal */}
      {userShow && (
        <SeasonEpisodeModal
          visible={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          userShow={userShow}
          onUpdateProgress={handleUpdateProgress}
        />
      )}
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
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  libraryActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manageEpisodesButton: {
    backgroundColor: '#5856D6',
  },
  rateButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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

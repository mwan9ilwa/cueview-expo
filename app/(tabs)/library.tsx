import LibraryShowCard from '@/components/LibraryShowCard';
import LoadingScreen from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';


type LibraryTab = 'watching' | 'want-to-watch' | 'watched';

export default function LibraryScreen() {
  const { user } = useAuth();
  const { 
    watchingShowsWithDetails, 
    wantToWatchShowsWithDetails, 
    watchedShowsWithDetails, 
    stats, 
    loading, 
    error, 
    refreshLibrary,
    updateShowProgress,
    syncToCloud,
    syncFromCloud,
  } = useUserLibrary();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('watching');
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    try {
      await syncToCloud();
      Alert.alert('Success', 'Your library has been synced to the cloud!');
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      Alert.alert('Error', 'Failed to sync to cloud. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromCloud = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      Alert.alert('Success', 'Your library has been synced from the cloud!');
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      Alert.alert('Error', 'Failed to sync from cloud. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleShowPress = (showId: number) => {
    router.push(`/show/${showId}`);
  };

  const handleUpdateProgress = async (showId: number, season: number, episode: number) => {
    try {
      await updateShowProgress(showId, season, episode);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Map user shows status to component-compatible data
  const userShows = {
    watching: watchingShowsWithDetails,
    'want-to-watch': wantToWatchShowsWithDetails,
    watched: watchedShowsWithDetails,
  };

  const tabs: { key: LibraryTab; label: string; color: string }[] = [
    { key: 'watching', label: 'Watching', color: '#34C759' },
    { key: 'want-to-watch', label: 'Want to Watch', color: '#FF9500' },
    { key: 'watched', label: 'Watched', color: '#007AFF' },
  ];

  const renderEmptyState = (status: LibraryTab) => {
    const messages = {
      'watching': 'No shows currently being watched.\nStart watching a show to see it here!',
      'want-to-watch': 'No shows in your watchlist.\nAdd shows you want to watch later!',
      'watched': 'No completed shows yet.\nMark shows as watched to track your progress!',
    };

    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>📺</ThemedText>
        <ThemedText style={styles.emptyMessage}>
          {messages[status]}
        </ThemedText>
        <ThemedText style={styles.emptyHint}>
          Browse trending shows in the Home tab to get started!
        </ThemedText>
      </ThemedView>
    );
  };

  const renderTabContent = () => {
    const shows = userShows[activeTab];
    
    if (loading) {
      return <LoadingScreen message="Loading your shows..." />;
    }
    
    if (shows.length === 0) {
      return renderEmptyState(activeTab);
    }

    return (
      <ScrollView
        style={styles.showsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.showsList}>
          <ThemedText type="defaultSemiBold" style={styles.statsText}>
            {shows.length} show{shows.length !== 1 ? 's' : ''} in {activeTab.replace('-', ' ')}
          </ThemedText>
          
          {shows.map((userShow) => (
            <LibraryShowCard
              key={userShow.id}
              userShow={userShow}
              onPress={handleShowPress}
              onUpdateProgress={handleUpdateProgress}
              showProgress={activeTab === 'watching'}
            />
          ))}
        </ThemedView>
      </ScrollView>
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">My Shows</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.signInPrompt}>
          <ThemedText style={styles.signInText}>📺</ThemedText>
          <ThemedText type="subtitle" style={styles.signInTitle}>
            Sign In Required
          </ThemedText>
          <ThemedText style={styles.signInMessage}>
            Sign in to create your personal show library and track your watching progress.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText type="title">My Shows</ThemedText>
            <ThemedText style={styles.subtitle}>
              Welcome back, {user.username}!
            </ThemedText>
          </View>
          
          {/* Sync Buttons */}
          <View style={styles.syncButtons}>
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncToCloud}
              disabled={syncing}
            >
              <ThemedText style={styles.syncButtonText}>
                {syncing ? '⏳' : '☁️ ↑'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncFromCloud}
              disabled={syncing}
            >
              <ThemedText style={styles.syncButtonText}>
                {syncing ? '⏳' : '☁️ ↓'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <ThemedText style={styles.syncHint}>
          ☁️ Your shows sync automatically across devices. Use sync buttons to force sync.
        </ThemedText>
        
        {error && (
          <ThemedText style={styles.errorText}>
            ⚠️ {error}
          </ThemedText>
        )}
      </ThemedView>

      {/* Tab Selector */}
      <ThemedView style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: tab.color },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </ThemedText>
              <ThemedText
                style={[
                  styles.tabCount,
                  activeTab === tab.key && styles.activeTabCount,
                ]}
              >
                {userShows[tab.key].length}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {renderTabContent()}
      </ScrollView>

      {/* Quick Stats */}
      <ThemedView style={styles.statsContainer}>
        <ThemedText type="defaultSemiBold">Library Stats</ThemedText>
        <View style={styles.statsRow}>
          <ThemedText style={styles.statItem}>
            📺 {stats.watching} watching
          </ThemedText>
          <ThemedText style={styles.statItem}>
            📋 {stats.wantToWatch} planned
          </ThemedText>
          <ThemedText style={styles.statItem}>
            ✅ {stats.watched} completed
          </ThemedText>
        </View>
        <View style={styles.statsRow}>
          <ThemedText style={styles.statItem}>
            🎬 {stats.totalEpisodesWatched} episodes
          </ThemedText>
          <ThemedText style={styles.statItem}>
            ⭐ {stats.averageRating > 0 ? stats.averageRating : 'No'} avg rating
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    gap: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  syncButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  syncHint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  subtitle: {
    opacity: 0.8,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  tabCount: {
    fontSize: 12,
    opacity: 0.7,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTabCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: 'white',
    opacity: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    opacity: 0.8,
  },
  emptyHint: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.6,
  },
  showsContainer: {
    padding: 16,
  },
  signInPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  signInText: {
    fontSize: 48,
    marginBottom: 16,
  },
  signInTitle: {
    marginBottom: 8,
  },
  signInMessage: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    fontSize: 14,
    opacity: 0.8,
  },
  showsList: {
    padding: 16,
  },
  statsText: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.8,
  },
  showItem: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  showItemContent: {
    padding: 16,
    gap: 4,
  },
  showStatus: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  showDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  showRating: {
    fontSize: 14,
  },
  showNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});

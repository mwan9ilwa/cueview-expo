import LoadingScreen from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';


type LibraryTab = 'watching' | 'want-to-watch' | 'watched';

export default function LibraryScreen() {
  const { user } = useAuth();
  const { 
    watchingShows, 
    wantToWatchShows, 
    watchedShows, 
    stats, 
    loading, 
    error, 
    refreshLibrary 
  } = useUserLibrary();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('watching');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  };

  const handleShowPress = (showId: number) => {
    router.push(`/show/${showId}`);
  };

  // Map user shows status to component-compatible data
  const userShows = {
    watching: watchingShows,
    'want-to-watch': wantToWatchShows,
    watched: watchedShows,
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
          
          {/* For now, show a simple list until we implement proper show data caching */}
          {shows.map((userShow) => (
            <TouchableOpacity
              key={userShow.id}
              style={styles.showItem}
              onPress={() => handleShowPress(userShow.showId)}
            >
              <ThemedView style={styles.showItemContent}>
                <ThemedText type="defaultSemiBold">
                  Show ID: {userShow.showId}
                </ThemedText>
                <ThemedText style={styles.showStatus}>
                  Status: {userShow.status.replace('-', ' ')}
                </ThemedText>
                <ThemedText style={styles.showDate}>
                  Added: {new Date(userShow.addedAt).toLocaleDateString()}
                </ThemedText>
                {userShow.rating && (
                  <ThemedText style={styles.showRating}>
                    Rating: {'⭐'.repeat(userShow.rating)}
                  </ThemedText>
                )}
                {userShow.notes && (
                  <ThemedText style={styles.showNotes}>
                    Notes: {userShow.notes}
                  </ThemedText>
                )}
              </ThemedView>
            </TouchableOpacity>
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
        <ThemedText type="title">My Shows</ThemedText>
        <ThemedText style={styles.subtitle}>
          Welcome back, {user.username}!
        </ThemedText>
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
        <ThemedText type="defaultSemiBold">Quick Stats</ThemedText>
        <View style={styles.statsRow}>
          <ThemedText style={styles.statItem}>
            📺 {userShows.watching.length} watching
          </ThemedText>
          <ThemedText style={styles.statItem}>
            📋 {userShows['want-to-watch'].length} planned
          </ThemedText>
          <ThemedText style={styles.statItem}>
            ✅ {userShows.watched.length} completed
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
    gap: 4,
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

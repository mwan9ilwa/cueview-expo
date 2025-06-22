import React from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import ShowList from '@/components/ShowList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useHomeScreenData } from '@/hooks/useHomeScreenData';
import { TMDbShow } from '@/services/tmdb';

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    trendingShows,
    popularShows,
    topRatedShows,
    continueWatching,
    loading: dataLoading,
    error,
  } = useHomeScreenData();

  const [refreshing, setRefreshing] = React.useState(false);

  if (authLoading) {
    return <LoadingScreen message="Initializing CueView..." />;
  }

  const handleShowPress = (show: TMDbShow) => {
    // TODO: Navigate to show details screen
    Alert.alert('Show Details', `You tapped on "${show.name}". Show details screen coming soon!`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // The useHomeScreenData hook will reload data when user changes
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Welcome to CueView</ThemedText>
        {user && (
          <ThemedText type="subtitle">Hello, {user.username}! 👋</ThemedText>
        )}
      </ThemedView>

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <ShowList
          title="Continue Watching"
          shows={continueWatching}
          onShowPress={handleShowPress}
          showProgress={true}
        />
      )}

      {/* Trending Shows */}
      <ShowList
        title="Trending This Week"
        shows={trendingShows}
        onShowPress={handleShowPress}
        loading={dataLoading}
        error={error || undefined}
      />

      {/* Popular Shows */}
      <ShowList
        title="Popular Shows"
        shows={popularShows}
        onShowPress={handleShowPress}
        loading={dataLoading}
        error={error || undefined}
      />

      {/* Top Rated Shows */}
      <ShowList
        title="Top Rated"
        shows={topRatedShows}
        onShowPress={handleShowPress}
        loading={dataLoading}
        error={error || undefined}
      />

      {/* Quick Stats */}
      <ThemedView style={styles.statsSection}>
        <ThemedText type="defaultSemiBold">Quick Stats</ThemedText>
        <ThemedText>• Shows in library: {continueWatching.length}</ThemedText>
        <ThemedText>• Episodes watched: Coming soon</ThemedText>
        <ThemedText>• Watch time: Coming soon</ThemedText>
      </ThemedView>

      <ThemedView style={styles.bottomPadding} />
    </ScrollView>
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
  statsSection: {
    padding: 16,
    margin: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    gap: 8,
  },
  bottomPadding: {
    height: 20,
  },
});

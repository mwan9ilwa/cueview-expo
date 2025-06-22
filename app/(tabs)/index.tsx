import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/contexts/AppContext';

export default function HomeScreen() {
  const { state } = useApp();

  if (state.isLoading) {
    return <LoadingScreen message="Initializing CueView..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Welcome to CueView</ThemedText>
        <ThemedText type="subtitle">Your TV Show Companion</ThemedText>
        {state.user && (
          <ThemedText>Hello, {state.user.username}!</ThemedText>
        )}
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Continue Watching</ThemedText>
          <ThemedText>Pick up where you left off with your current shows</ThemedText>
          {state.userShows.length > 0 ? (
            <ThemedText>You have {state.userShows.length} shows in your library</ThemedText>
          ) : (
            <ThemedText>No shows in your library yet. Start by discovering some great shows!</ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Upcoming Episodes</ThemedText>
          <ThemedText>Don&apos;t miss the latest episodes of your favorite shows</ThemedText>
          <ThemedText>Coming soon: Episode air date tracking</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Trending Now</ThemedText>
          <ThemedText>Discover what everyone is watching</ThemedText>
          <ThemedText>Coming soon: Trending shows from TMDb</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Quick Stats</ThemedText>
          <ThemedText>• Shows in library: {state.userShows.length}</ThemedText>
          <ThemedText>• Episodes watched: Coming soon</ThemedText>
          <ThemedText>• Watch time: Coming soon</ThemedText>
        </ThemedView>

        {!state.user && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">Get Started</ThemedText>
            <ThemedText>Sign in to start tracking your favorite TV shows</ThemedText>
            <ThemedText>Coming soon: Authentication screens</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
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
  content: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
});

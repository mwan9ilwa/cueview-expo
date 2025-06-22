import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function LibraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">My Shows</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Your Library</ThemedText>
        <ThemedText>
          Track your favorite TV shows, manage your watchlist, and keep track of your progress.
        </ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Coming Soon:</ThemedText>
          <ThemedText>• Currently Watching shows</ThemedText>
          <ThemedText>• Want to Watch list</ThemedText>
          <ThemedText>• Completed shows</ThemedText>
          <ThemedText>• Episode progress tracking</ThemedText>
        </ThemedView>
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
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  section: {
    gap: 8,
    marginTop: 16,
  },
});

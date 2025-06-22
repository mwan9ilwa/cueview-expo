import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function DiscoverScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Discover</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Find Your Next Favorite Show</ThemedText>
        <ThemedText>
          Explore trending shows, search by genre, and discover new series to add to your watchlist.
        </ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Coming Soon:</ThemedText>
          <ThemedText>• Trending shows</ThemedText>
          <ThemedText>• Popular series</ThemedText>
          <ThemedText>• Search functionality</ThemedText>
          <ThemedText>• Genre filters</ThemedText>
          <ThemedText>• Network filters</ThemedText>
          <ThemedText>• Personalized recommendations</ThemedText>
        </ThemedView>
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

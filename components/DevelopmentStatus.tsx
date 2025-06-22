import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function DevelopmentStatus() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>🚧 Development Status</ThemedText>
      
      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.phaseTitle}>✅ Phase 1: Core Infrastructure (Completed)</ThemedText>
        <ThemedText style={styles.item}>• Project setup with Expo and TypeScript</ThemedText>
        <ThemedText style={styles.item}>• Firebase configuration</ThemedText>
        <ThemedText style={styles.item}>• TMDb API integration</ThemedText>
        <ThemedText style={styles.item}>• Basic navigation structure</ThemedText>
        <ThemedText style={styles.item}>• Database services (SQLite + Firestore)</ThemedText>
        <ThemedText style={styles.item}>• Authentication service</ThemedText>
        <ThemedText style={styles.item}>• Global state management</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.phaseTitle}>🔄 Phase 2: Core Features (In Progress)</ThemedText>
        <ThemedText style={styles.item}>• Authentication screens (Coming Next)</ThemedText>
        <ThemedText style={styles.item}>• Show discovery and search</ThemedText>
        <ThemedText style={styles.item}>• Show details screen</ThemedText>
        <ThemedText style={styles.item}>• Library management</ThemedText>
        <ThemedText style={styles.item}>• Episode tracking</ThemedText>
      </ThemedView>

      <ThemedText style={styles.note}>
        The app is currently in early development. Core infrastructure is in place and ready for feature implementation.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  section: {
    gap: 6,
  },
  phaseTitle: {
    marginBottom: 8,
    fontSize: 16,
  },
  item: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 8,
  },
});

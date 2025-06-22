import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function DevelopmentStatus() {
  return (
    <ThemedView style={styles.container}>
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

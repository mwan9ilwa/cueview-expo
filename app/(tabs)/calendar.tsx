import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function CalendarScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Calendar</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Upcoming Episodes</ThemedText>
        <ThemedText>
          Stay up to date with air dates for your favorite shows and never miss a new episode.
        </ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Coming Soon:</ThemedText>
          <ThemedText>• Calendar view of upcoming episodes</ThemedText>
          <ThemedText>• Episode air date notifications</ThemedText>
          <ThemedText>• Season premiere alerts</ThemedText>
          <ThemedText>• Customizable reminders</ThemedText>
          <ThemedText>• Integration with device calendar</ThemedText>
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

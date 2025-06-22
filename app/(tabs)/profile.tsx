import DevelopmentStatus from '@/components/DevelopmentStatus';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Your Account & Settings</ThemedText>
        <ThemedText>
          Manage your profile, preferences, and account settings.
        </ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Coming Soon:</ThemedText>
          <ThemedText>• User profile management</ThemedText>
          <ThemedText>• Theme selection (Light/Dark)</ThemedText>
          <ThemedText>• Notification preferences</ThemedText>
          <ThemedText>• Account settings</ThemedText>
          <ThemedText>• Statistics and insights</ThemedText>
          <ThemedText>• Data export/import</ThemedText>
        </ThemedView>

        <DevelopmentStatus />
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

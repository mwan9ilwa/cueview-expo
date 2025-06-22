import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function FirestoreSyncDemo() {
  const { user } = useAuth();
  const { stats, syncToCloud, syncFromCloud } = useUserLibrary();
  const [syncing, setSyncing] = useState(false);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>🔥 Firestore Sync Demo</ThemedText>
        <ThemedText style={styles.message}>Please sign in to test sync functionality</ThemedText>
      </ThemedView>
    );
  }

  const handleSyncToCloud = async () => {
    setSyncing(true);
    try {
      await syncToCloud();
      Alert.alert(
        'Sync Complete!', 
        `Successfully synced ${stats.totalShows} shows to Firestore cloud database. Your data is now available on all your devices!`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error: any) {
      const isPermissionError = error?.message?.includes('permission') || 
                               error?.code === 'permission-denied';
      
      if (isPermissionError) {
        Alert.alert(
          'Firestore Setup Required', 
          'Firestore security rules need to be configured. Check the FIRESTORE_SETUP.md file for instructions. Your data will work locally until setup is complete.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Sync Failed', 'Could not sync to cloud. Check your internet connection.');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromCloud = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      Alert.alert(
        'Sync Complete!', 
        'Successfully synced your library from Firestore cloud database. Your data is now up to date!',
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error: any) {
      const isPermissionError = error?.message?.includes('permission') || 
                               error?.code === 'permission-denied';
      
      if (isPermissionError) {
        Alert.alert(
          'Firestore Setup Required', 
          'Firestore security rules need to be configured. Check the FIRESTORE_SETUP.md file for instructions. Your data will work locally until setup is complete.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Sync Failed', 'Could not sync from cloud. Check your internet connection.');
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🔥 Firestore Sync Demo</ThemedText>
      
      <ThemedText style={styles.subtitle}>
        Cross-Device Library Sync
      </ThemedText>
      
      <ThemedText style={styles.description}>
        Your show library automatically syncs to Firebase Firestore, allowing you to access 
        your shows, progress, ratings, and notes across all your devices.
      </ThemedText>
      
      <ThemedView style={styles.setupNotice}>
        <ThemedText style={styles.setupTitle}>⚠️ Setup Required</ThemedText>
        <ThemedText style={styles.setupText}>
          If you see permission errors, Firestore security rules need to be configured. 
          Check the FIRESTORE_SETUP.md file in the project root for detailed instructions.
        </ThemedText>
        <ThemedText style={styles.setupHint}>
          💡 Your app works perfectly offline until Firestore is set up!
        </ThemedText>
      </ThemedView>
      
      <View style={styles.statsContainer}>
        <ThemedText style={styles.statsTitle}>Current Library Stats:</ThemedText>
        <ThemedText style={styles.stat}>📺 {stats.totalShows} shows total</ThemedText>
        <ThemedText style={styles.stat}>🎬 {stats.watching} currently watching</ThemedText>
        <ThemedText style={styles.stat}>📋 {stats.wantToWatch} want to watch</ThemedText>
        <ThemedText style={styles.stat}>✅ {stats.watched} completed</ThemedText>
        <ThemedText style={styles.stat}>🎭 {stats.totalEpisodesWatched} episodes watched</ThemedText>
        <ThemedText style={styles.stat}>⭐ {stats.averageRating || 'No'} average rating</ThemedText>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.syncButton, styles.uploadButton, syncing && styles.disabledButton]}
          onPress={handleSyncToCloud}
          disabled={syncing}
        >
          <ThemedText style={styles.buttonText}>
            {syncing ? '⏳' : '☁️ ↑'} Sync to Cloud
          </ThemedText>
          <ThemedText style={styles.buttonSubtext}>
            Push your library to Firestore
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.syncButton, styles.downloadButton, syncing && styles.disabledButton]}
          onPress={handleSyncFromCloud}
          disabled={syncing}
        >
          <ThemedText style={styles.buttonText}>
            {syncing ? '⏳' : '☁️ ↓'} Sync from Cloud  
          </ThemedText>
          <ThemedText style={styles.buttonSubtext}>
            Pull your library from Firestore
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <ThemedText style={styles.note}>
        💡 Tip: Changes to your library (adding shows, updating progress, etc.) 
        automatically sync in real-time when you have an internet connection.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  statsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  stat: {
    fontSize: 14,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 12,
  },
  syncButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  uploadButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  downloadButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  setupNotice: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    gap: 8,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  setupText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  setupHint: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { notificationService } from '@/services/notifications';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { stats, watchingShowsWithDetails, wantToWatchShowsWithDetails, watchedShowsWithDetails } = useUserLibrary();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleSetupNotifications = async () => {
    try {
      const hasPermissions = await notificationService.requestPermissions();
      
      if (hasPermissions) {
        // Schedule notifications for all watching shows
        await notificationService.scheduleNotificationsForWatchingShows(watchingShowsWithDetails);
        setNotificationsEnabled(true);
        
        Alert.alert(
          'Notifications Enabled!',
          `Set up episode reminders for ${watchingShowsWithDetails.length} shows. You'll get notified 30 minutes before new episodes air.`,
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive episode reminders.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert('Error', 'Failed to set up notifications. Please try again.');
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotificationsEnabled(false);
      
      Alert.alert(
        'Notifications Disabled',
        'All episode reminder notifications have been cancelled.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error disabling notifications:', error);
      Alert.alert('Error', 'Failed to disable notifications. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendImmediateNotification({
        title: 'Test Notification',
        body: 'This is a test notification from CueView!',
        data: { type: 'test' },
      });
      
      Alert.alert('Test Sent', 'Check your notifications!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const calculateStats = () => {
    const totalShows = watchingShowsWithDetails.length + wantToWatchShowsWithDetails.length + watchedShowsWithDetails.length;
    const totalEpisodes = stats.totalEpisodesWatched || 0;
    // Mock calculation for total minutes watched (in real app, this would be tracked)
    const totalMinutes = totalEpisodes * 45; // Assuming 45 min average per episode
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // Calculate genre distribution
    const genreCounts: { [key: string]: number } = {};
    [...watchingShowsWithDetails, ...wantToWatchShowsWithDetails, ...watchedShowsWithDetails].forEach(show => {
      if (show.showDetails?.genres) {
        show.showDetails.genres.forEach(genre => {
          genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    return {
      totalShows,
      totalEpisodes,
      totalHours,
      remainingMinutes,
      topGenres,
      watchingCount: watchingShowsWithDetails.length,
      wantToWatchCount: wantToWatchShowsWithDetails.length,
      watchedCount: watchedShowsWithDetails.length,
    };
  };

  const userStats = calculateStats();

  const renderStatCard = (title: string, value: string | number, subtitle?: string) => (
    <View style={styles.statCard}>
      <ThemedText type="defaultSemiBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText style={styles.statTitle}>{title}</ThemedText>
      {subtitle && (
        <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>
      )}
    </View>
  );

  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Profile</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.signInPrompt}>
          <ThemedText style={styles.signInIcon}>👤</ThemedText>
          <ThemedText type="subtitle" style={styles.signInTitle}>
            Sign In Required
          </ThemedText>
          <ThemedText style={styles.signInMessage}>
            Sign in to view your profile, statistics, and manage your account settings.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText style={styles.welcomeText}>Welcome back, {user.username}!</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        {/* Account Information */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Account Information</ThemedText>
          <View style={styles.accountInfo}>
            <ThemedText style={styles.accountDetail}>📧 {user.email}</ThemedText>
            <ThemedText style={styles.accountDetail}>👤 {user.username}</ThemedText>
            <ThemedText style={styles.accountDetail}>
              📅 Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'today'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Statistics & Insights */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Your Watching Statistics</ThemedText>
          
          <View style={styles.statsGrid}>
            {renderStatCard('Total Shows', userStats.totalShows, 'in your library')}
            {renderStatCard('Episodes Watched', userStats.totalEpisodes, 'and counting')}
            {renderStatCard('Watch Time', `${userStats.totalHours}h ${userStats.remainingMinutes}m`, 'total viewing time')}
          </View>

          <View style={styles.libraryBreakdown}>
            <ThemedText type="defaultSemiBold" style={styles.breakdownTitle}>Library Breakdown</ThemedText>
            <View style={styles.breakdownStats}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#34C759' }]} />
                <ThemedText style={styles.breakdownText}>
                  {userStats.watchingCount} Currently Watching
                </ThemedText>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#FF9500' }]} />
                <ThemedText style={styles.breakdownText}>
                  {userStats.wantToWatchCount} Want to Watch
                </ThemedText>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#007AFF' }]} />
                <ThemedText style={styles.breakdownText}>
                  {userStats.watchedCount} Completed
                </ThemedText>
              </View>
            </View>
          </View>

          {userStats.topGenres.length > 0 && (
            <View style={styles.genrePreferences}>
              <ThemedText type="defaultSemiBold" style={styles.genreTitle}>Top Genres</ThemedText>
              <View style={styles.genreList}>
                {userStats.topGenres.map((genre, index) => (
                  <View key={genre} style={styles.genreItem}>
                    <ThemedText style={styles.genreRank}>{index + 1}</ThemedText>
                    <ThemedText style={styles.genreName}>{genre}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ThemedView>

        {/* Notifications Management */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Notifications</ThemedText>
          
          <View style={styles.notificationControls}>
            <ThemedText style={styles.notificationDescription}>
              Get reminded 30 minutes before your shows air. Perfect for never missing an episode!
            </ThemedText>
            
            <View style={styles.notificationButtons}>
              <TouchableOpacity
                style={[styles.notificationButton, styles.enableButton]}
                onPress={handleSetupNotifications}
              >
                <ThemedText style={styles.enableButtonText}>
                  🔔 Enable Episode Reminders
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.notificationButton, styles.disableButton]}
                onPress={handleDisableNotifications}
              >
                <ThemedText style={styles.disableButtonText}>
                  🔕 Disable All Notifications
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.notificationButton, styles.testButton]}
                onPress={handleTestNotification}
              >
                <ThemedText style={styles.testButtonText}>
                  🧪 Send Test Notification
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.notificationNote}>
              📱 Notifications for {watchingShowsWithDetails.length} shows in your watching list
            </ThemedText>
          </View>
        </ThemedView>

        {/* Settings */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Settings</ThemedText>
          <ThemedView style={styles.settingsPreview}>
            <ThemedText style={styles.comingSoonText}>⚙️ Settings coming soon:</ThemedText>
            <ThemedText style={styles.featureItem}>• Theme selection (Light/Dark)</ThemedText>
            <ThemedText style={styles.featureItem}>• Notification preferences</ThemedText>
            <ThemedText style={styles.featureItem}>• Privacy settings</ThemedText>
            <ThemedText style={styles.featureItem}>• Data export/import</ThemedText>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
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
    gap: 4,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  section: {
    gap: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  accountInfo: {
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  accountDetail: {
    fontSize: 16,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  statSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 2,
  },
  libraryBreakdown: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  breakdownStats: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownText: {
    fontSize: 16,
  },
  genrePreferences: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  genreTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  genreList: {
    gap: 8,
  },
  genreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genreRank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
    color: '#007AFF',
  },
  genreName: {
    fontSize: 16,
  },
  settingsPreview: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  signInPrompt: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  signInIcon: {
    fontSize: 48,
  },
  signInTitle: {
    textAlign: 'center',
  },
  signInMessage: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  notificationControls: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  notificationButtons: {
    gap: 12,
  },
  notificationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: '#34C759',
  },
  disableButton: {
    backgroundColor: '#FF9500',
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationNote: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemeSelector } from '@/components/ThemeSelector';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { notificationService } from '@/services/notifications';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { watchingShowsWithDetails } = useUserLibrary();

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

  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Profile</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.signInPrompt}>
          <View style={styles.signInIconContainer}>
            <IconSymbol name="person.fill" size={48} color="#999" />
          </View>
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
            <View style={styles.accountDetailItem}>
              <IconSymbol name="envelope.fill" size={16} color="#5856D6" />
              <ThemedText style={styles.accountDetailText}>{user.email}</ThemedText>
            </View>
            <View style={styles.accountDetailItem}>
              <IconSymbol name="person.fill" size={16} color="#5856D6" />
              <ThemedText style={styles.accountDetailText}>{user.username}</ThemedText>
            </View>
            <View style={styles.accountDetailItem}>
              <IconSymbol name="calendar" size={16} color="#5856D6" />
              <ThemedText style={styles.accountDetailText}>
                Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'today'}
              </ThemedText>
            </View>
          </View>
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
                <View style={styles.testButtonContent}>
                  <IconSymbol name="flask.fill" size={16} color="#5856D6" />
                  <ThemedText style={styles.testButtonText}>
                    Send Test Notification
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationNote}>
              <IconSymbol name="bell.fill" size={16} color="#5856D6" />
              <ThemedText style={styles.notificationNoteText}>
                Notifications for {watchingShowsWithDetails.length} shows in your watching list
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Settings */}
        <ThemedView style={styles.section}>
          <ThemeSelector />
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
  accountDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accountDetailText: {
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
  signInIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
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
  testButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  notificationNoteText: {
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

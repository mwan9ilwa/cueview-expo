import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { notificationService } from '@/services/notifications';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, setThemeMode } = useTheme();
  const { watchingShowsWithDetails } = useUserLibrary();
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

  const handleToggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        await notificationService.clearAllNotifications();
        setNotificationsEnabled(false);
        Alert.alert('Notifications Disabled', 'All notifications have been turned off.');
      } else {
        const hasPermissions = await notificationService.requestPermissions();
        if (hasPermissions) {
          await notificationService.scheduleNotificationsForWatchingShows(watchingShowsWithDetails);
          setNotificationsEnabled(true);
          Alert.alert('Notifications Enabled', 'You\'ll receive episode reminders for your shows.');
        } else {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  if (!user) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.signInContainer}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
            <IconSymbol name="person.fill" size={40} color={colors.icon} />
          </View>
          <ThemedText type="title" style={styles.signInTitle}>
            Sign In Required
          </ThemedText>
          <ThemedText style={styles.signInSubtitle}>
            Sign in to access your profile and settings
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Today';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
          <IconSymbol name="person.fill" size={40} color={colors.tint} />
        </View>
        <ThemedText type="title" style={styles.name}>
          {user.username}
        </ThemedText>
        <ThemedText style={styles.email}>
          {user.email}
        </ThemedText>
        <ThemedText style={styles.joinDate}>
          Member since {joinDate}
        </ThemedText>
      </View>

      {/* Settings Sections */}
      <View style={styles.content}>
        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleToggleTheme}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#007AFF' }]}>
                <IconSymbol name={isDark ? "moon.fill" : "sun.max.fill"} size={18} color="white" />
              </View>
              <View>
                <ThemedText style={styles.settingTitle}>Appearance</ThemedText>
                <ThemedText style={styles.settingSubtitle}>
                  {isDark ? 'Dark' : 'Light'} mode
                </ThemedText>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF3B30' }]}>
                <IconSymbol name="bell.fill" size={18} color="white" />
              </View>
              <View>
                <ThemedText style={styles.settingTitle}>Notifications</ThemedText>
                <ThemedText style={styles.settingSubtitle}>
                  Episode reminders
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: '#34C759' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF3B30' }]}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="white" />
              </View>
              <ThemedText style={[styles.settingTitle, { color: '#FF3B30' }]}>
                Sign Out
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signInContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60, // Platform-specific top padding
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Platform-specific top padding
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  email: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});


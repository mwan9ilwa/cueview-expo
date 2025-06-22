import DevelopmentStatus from '@/components/DevelopmentStatus';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

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

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        {/* {user && <ThemedText>Welcome, {user.username}!</ThemedText>} */}
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Your Account & Settings</ThemedText>
        <ThemedText>
          Manage your profile, preferences, and account settings.
        </ThemedText>
        
        {user && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">Account Info:</ThemedText>
            <ThemedText>Email: {user.email}</ThemedText>
            <ThemedText>Username: {user.username}</ThemedText>
            <ThemedText>Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Just now'}</ThemedText>
          </ThemedView>
        )}
        
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Coming Soon:</ThemedText>
          <ThemedText>• User profile management</ThemedText>
          <ThemedText>• Theme selection (Light/Dark)</ThemedText>
          <ThemedText>• Notification preferences</ThemedText>
          <ThemedText>• Account settings</ThemedText>
        </ThemedView>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>

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

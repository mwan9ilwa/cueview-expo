import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function WelcomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>Welcome to CueView</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Your personal TV show companion
          </ThemedText>
          <ThemedText style={styles.description}>
            Track your favorite shows, discover new series, and never miss an episode again.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.features}>
          <ThemedView style={styles.feature}>
            <ThemedText style={styles.featureIcon}>📺</ThemedText>
            <ThemedText style={styles.featureText}>Track your watching progress</ThemedText>
          </ThemedView>

          <ThemedView style={styles.feature}>
            <ThemedText style={styles.featureIcon}>🔍</ThemedText>
            <ThemedText style={styles.featureText}>Discover trending shows</ThemedText>
          </ThemedView>

          <ThemedView style={styles.feature}>
            <ThemedText style={styles.featureIcon}>📅</ThemedText>
            <ThemedText style={styles.featureText}>Get episode reminders</ThemedText>
          </ThemedView>

          <ThemedView style={styles.feature}>
            <ThemedText style={styles.featureIcon}>⭐</ThemedText>
            <ThemedText style={styles.featureText}>Rate and review shows</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.buttons}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <ThemedText style={styles.secondaryButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <ThemedText style={styles.skipText}>Continue without account</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  features: {
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  buttons: {
    gap: 16,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    opacity: 0.6,
    textDecorationLine: 'underline',
  },
});

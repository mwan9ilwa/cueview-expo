import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

export default function WelcomeScreen() {
  return (
    <ScrollView style={GlobalStyles.container}>
      <ThemedView style={GlobalStyles.content}>
        <ThemedView style={GlobalStyles.header}>
          <ThemedText type="title" style={GlobalStyles.title}>CueView</ThemedText>
          <ThemedText type="subtitle" style={GlobalStyles.subtitle}>
            Your personal TV show companion
          </ThemedText>
          <ThemedText style={GlobalStyles.description}>
            Track your favorite shows, discover new series, and never miss an episode again.
          </ThemedText>
        </ThemedView>

        <ThemedView style={GlobalStyles.featureList}>
          <ThemedView style={GlobalStyles.featureItem}>
            <IconSymbol name="tv.fill" size={24} color="#007AFF" />
            <ThemedText style={GlobalStyles.featureText}>Track your watching progress</ThemedText>
          </ThemedView>

          <ThemedView style={GlobalStyles.featureItem}>
            <IconSymbol name="magnifyingglass" size={24} color="#007AFF" />
            <ThemedText style={GlobalStyles.featureText}>Discover trending shows</ThemedText>
          </ThemedView>

          <ThemedView style={GlobalStyles.featureItem}>
            <IconSymbol name="calendar" size={24} color="#007AFF" />
            <ThemedText style={GlobalStyles.featureText}>Get episode reminders</ThemedText>
          </ThemedView>

          <ThemedView style={GlobalStyles.featureItem}>
            <IconSymbol name="star.fill" size={24} color="#007AFF" />
            <ThemedText style={GlobalStyles.featureText}>Rate and review shows</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={GlobalStyles.buttonGroup}>
          <Pressable
            style={({ pressed }) => [
              GlobalStyles.primaryButton,
              pressed && GlobalStyles.buttonPressed
            ]}
            onPress={() => {
              console.log('🎯 Get Started button pressed!');
              router.push('/(auth)/sign-in');
            }}>
            <Text style={GlobalStyles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </ThemedView>

        <Pressable
          style={({ pressed }) => [
            GlobalStyles.secondaryButton,
            pressed && GlobalStyles.buttonPressed
          ]}
          onPress={() => {
            console.log('🎯 Continue as Guest button pressed!');
            router.replace('/(tabs)');
          }}>
          <Text style={GlobalStyles.secondaryButtonText}>Continue as Guest</Text>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

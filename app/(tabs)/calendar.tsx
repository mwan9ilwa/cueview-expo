import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { GlobalStyles } from '@/styles/GlobalStyles';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function CalendarScreen() {
  return (
    <ScrollView style={GlobalStyles.screen}>
      <ThemedView style={GlobalStyles.screenHeader}>
        <ThemedText type="title" style={GlobalStyles.title}>Calendar</ThemedText>
        <ThemedText style={GlobalStyles.subtitle}>Your show schedule</ThemedText>
      </ThemedView>

      <ThemedView style={GlobalStyles.screenContent}>
        <View style={GlobalStyles.emptyContainer}>
          <IconSymbol name="calendar" size={64} color="#007AFF" />
          <ThemedText type="subtitle" style={GlobalStyles.emptyMessage}>
            Coming Soon
          </ThemedText>
          <ThemedText style={GlobalStyles.emptyHint}>
            Track upcoming episodes, air dates, and never miss your favorite shows.
          </ThemedText>
          
          <View style={GlobalStyles.featureList}>
            <View style={GlobalStyles.featureItem}>
              <IconSymbol name="tv.fill" size={20} color="#007AFF" />
              <ThemedText style={GlobalStyles.featureText}>Episode air dates</ThemedText>
            </View>
            <View style={GlobalStyles.featureItem}>
              <IconSymbol name="bell.fill" size={20} color="#007AFF" />
              <ThemedText style={GlobalStyles.featureText}>Custom reminders</ThemedText>
            </View>
            <View style={GlobalStyles.featureItem}>
              <IconSymbol name="calendar.badge.plus" size={20} color="#007AFF" />
              <ThemedText style={GlobalStyles.featureText}>Calendar integration</ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}


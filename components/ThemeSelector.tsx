import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

export function ThemeSelector() {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const themeOptions: { key: ThemeMode; label: string; icon: string; description: string }[] = [
    { 
      key: 'light', 
      label: 'Light', 
      icon: 'sun.max.fill',
      description: 'Always use light theme'
    },
    { 
      key: 'dark', 
      label: 'Dark', 
      icon: 'moon.fill',
      description: 'Always use dark theme'
    },
    { 
      key: 'auto', 
      label: 'Auto', 
      icon: 'circle.lefthalf.filled',
      description: 'Match system setting'
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Appearance
      </ThemedText>
      <ThemedText style={styles.description}>
        Choose how CueView looks to you. Select a single theme, or sync with your system and automatically switch between day and night themes.
      </ThemedText>
      
      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.option,
              themeMode === option.key && styles.optionSelected,
              isDark && styles.optionDark,
              themeMode === option.key && isDark && styles.optionSelectedDark,
            ]}
            onPress={() => setThemeMode(option.key)}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <View style={[
                  styles.iconContainer,
                  themeMode === option.key && styles.iconContainerSelected,
                  isDark && styles.iconContainerDark,
                  themeMode === option.key && isDark && styles.iconContainerSelectedDark,
                ]}>
                  <IconSymbol 
                    name={option.icon as any} 
                    size={20} 
                    color={themeMode === option.key ? '#007AFF' : (isDark ? '#999' : '#666')} 
                  />
                </View>
                <View style={styles.optionText}>
                  <ThemedText style={[
                    styles.optionLabel,
                    themeMode === option.key && styles.optionLabelSelected
                  ]}>
                    {option.label}
                  </ThemedText>
                  <ThemedText style={styles.optionDescription}>
                    {option.description}
                  </ThemedText>
                </View>
              </View>
              
              {themeMode === option.key && (
                <IconSymbol 
                  name="checkmark.circle.fill" 
                  size={20} 
                  color="#007AFF" 
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionDark: {
    backgroundColor: '#1c1c1e',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  optionSelectedDark: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  iconContainerSelectedDark: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
});

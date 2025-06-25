import { ThemedView } from '@/components/ThemedView';
import { useAdaptiveTheme } from '@/contexts/AdaptiveThemeContext';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

interface AdaptiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
  variant?: 'elevated' | 'filled' | 'outlined';
  onPress?: () => void;
}

export default function AdaptiveCard({
  children,
  style,
  elevation = 2,
  variant = 'elevated',
  onPress,
}: AdaptiveCardProps) {
  const { isAndroid, materialTheme, colors } = useAdaptiveTheme();

  if (isAndroid && materialTheme) {
    // Use Material Design 3 card for Android
    const mode = variant === 'elevated' ? 'elevated' : variant === 'outlined' ? 'outlined' : 'contained';
    
    return (
      <PaperCard
        mode={mode}
        onPress={onPress}
        style={[styles.androidCard, style]}
        theme={materialTheme}
      >
        <PaperCard.Content>
          {children}
        </PaperCard.Content>
      </PaperCard>
    );
  }

  // Use iOS-style card for iOS
  const getIOSCardStyle = () => {
    const baseStyle = [styles.iosCard];
    
    switch (variant) {
      case 'elevated':
        return [
          ...baseStyle,
          {
            backgroundColor: colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: elevation },
            shadowOpacity: 0.1,
            shadowRadius: elevation * 2,
            elevation: elevation,
          }
        ];
      case 'outlined':
        return [
          ...baseStyle,
          {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.outline || 'rgba(0,0,0,0.12)',
          }
        ];
      case 'filled':
        return [
          ...baseStyle,
          {
            backgroundColor: colors.surfaceVariant || colors.background,
          }
        ];
      default:
        return baseStyle;
    }
  };

  return (
    <ThemedView 
      style={[getIOSCardStyle(), style]}
      {...(onPress && {
        onTouchEnd: onPress,
      })}
    >
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  androidCard: {
    marginVertical: 4,
  },
  iosCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
});

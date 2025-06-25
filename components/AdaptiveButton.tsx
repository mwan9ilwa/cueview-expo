import { ThemedText } from '@/components/ThemedText';
import { useAdaptiveTheme } from '@/contexts/AdaptiveThemeContext';
import React from 'react';
import { StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

interface AdaptiveButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function AdaptiveButton({
  title,
  onPress,
  variant = 'filled',
  disabled = false,
  icon,
  style,
  textStyle,
  loading = false,
  size = 'medium',
}: AdaptiveButtonProps) {
  const { isAndroid, materialTheme, colors } = useAdaptiveTheme();

  if (isAndroid && materialTheme) {
    // Use Material Design 3 button for Android
    const mode = variant === 'filled' ? 'contained' : variant === 'outlined' ? 'outlined' : 'text';
    
    return (
      <PaperButton
        mode={mode}
        onPress={onPress}
        disabled={disabled || loading}
        icon={icon}
        loading={loading}
        style={[styles.androidButton, style]}
        labelStyle={textStyle}
        theme={materialTheme}
        compact={size === 'small'}
      >
        {title}
      </PaperButton>
    );
  }

  // Use iOS-style button for iOS
  const getIOSButtonStyle = () => {
    let sizeStyle;
    switch (size) {
      case 'small':
        sizeStyle = styles.iosSmall;
        break;
      case 'large':
        sizeStyle = styles.iosLarge;
        break;
      default:
        sizeStyle = styles.iosMedium;
    }
    
    const baseStyle = [styles.iosButton, sizeStyle];
    
    switch (variant) {
      case 'filled':
        return [
          ...baseStyle,
          {
            backgroundColor: colors.primary || '#007AFF',
            borderWidth: 0,
          }
        ];
      case 'outlined':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary || '#007AFF',
          }
        ];
      case 'text':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderWidth: 0,
          }
        ];
      default:
        return baseStyle;
    }
  };

  const getIOSTextStyle = () => {
    let sizeTextStyle;
    switch (size) {
      case 'small':
        sizeTextStyle = styles.iosSmallText;
        break;
      case 'large':
        sizeTextStyle = styles.iosLargeText;
        break;
      default:
        sizeTextStyle = styles.iosMediumText;
    }
    
    const baseTextStyle = [styles.iosButtonText, sizeTextStyle];
    
    switch (variant) {
      case 'filled':
        return [
          ...baseTextStyle,
          { color: 'white' }
        ];
      case 'outlined':
      case 'text':
        return [
          ...baseTextStyle,
          { color: colors.primary || '#007AFF' }
        ];
      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getIOSButtonStyle(),
        disabled && styles.iosDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <ThemedText style={[getIOSTextStyle(), textStyle]}>
        {loading ? 'Loading...' : title}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  androidButton: {
    marginVertical: 4,
  },
  iosButton: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  iosSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  iosMedium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  iosLarge: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 50,
  },
  iosButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iosSmallText: {
    fontSize: 14,
  },
  iosMediumText: {
    fontSize: 16,
  },
  iosLargeText: {
    fontSize: 18,
  },
  iosDisabled: {
    opacity: 0.5,
  },
});

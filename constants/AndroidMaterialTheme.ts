import { Platform } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Android-specific Material Design 3 customizations
export const AndroidMaterialThemeLight: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors optimized for Android
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    
    // Surface colors with Android-specific elevation
    surface: '#FFFBFE',
    surfaceVariant: '#E7E0EC',
    
    // Android-specific accent colors
    secondary: '#625B71',
    tertiary: '#7D5260',
    
    // Enhanced contrast for Android readability
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    
    // Android system colors
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
  },
  // Android-specific roundness
  roundness: 16,
};

export const AndroidMaterialThemeDark: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors optimized for Android dark mode
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    
    // Dark surface colors with proper Android elevation
    surface: '#1C1B1F',
    surfaceVariant: '#49454F',
    
    // Android dark mode specific colors
    secondary: '#CCC2DC',
    tertiary: '#EFB8C8',
    
    // Enhanced contrast for dark mode
    onSurface: '#E6E0E9',
    onSurfaceVariant: '#CAC4D0',
    outline: '#938F99',
    
    // Android system dark colors
    error: '#FFB4AB',
    errorContainer: '#93000A',
  },
  // Android-specific roundness for dark mode
  roundness: 16,
};

// iOS-specific theme (keeping current approach)
const iOSThemeLight = {
  primary: '#007AFF',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  border: '#C6C6C8',
  card: '#FFFFFF',
  notification: '#FF3B30',
  // iOS specific styling
  roundness: 8, // iOS prefers smaller corner radius
};

const iOSThemeDark = {
  primary: '#0A84FF',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  border: '#38383A',
  card: '#1C1C1E',
  notification: '#FF453A',
  roundness: 8,
};

export const PlatformThemes = {
  android: {
    light: AndroidMaterialThemeLight,
    dark: AndroidMaterialThemeDark,
  },
  ios: {
    light: iOSThemeLight,
    dark: iOSThemeDark,
  },
};

// Get platform-specific theme
export const getPlatformTheme = (colorScheme: 'light' | 'dark') => {
  if (Platform.OS === 'android') {
    return PlatformThemes.android[colorScheme];
  }
  return PlatformThemes.ios[colorScheme];
};

// Android-specific component styles
export const AndroidStyles = {
  // Material Design 3 elevation tokens
  elevation: {
    level0: {
      elevation: 0,
      shadowColor: 'transparent',
    },
    level1: {
      elevation: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    level2: {
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    level3: {
      elevation: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    level4: {
      elevation: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
    },
    level5: {
      elevation: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
  },
  
  // Material Design 3 spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  // Android-specific typography
  typography: {
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400' as const,
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400' as const,
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400' as const,
    },
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400' as const,
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400' as const,
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400' as const,
    },
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '500' as const,
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
  },
};

// Helper function to apply Android-specific styles conditionally
export const androidStyle = (style: any) => Platform.OS === 'android' ? style : {};
export const iosStyle = (style: any) => Platform.OS === 'ios' ? style : {};

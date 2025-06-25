import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useRNColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';
export type PlatformTheme = 'ios' | 'android';

// Material Design 3 color tokens
const MD3Colors = {
  light: {
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FFFBFE',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#D0BCFF',
  },
  dark: {
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    tertiary: '#EFB8C8',
    onTertiary: '#492532',
    tertiaryContainer: '#633B48',
    onTertiaryContainer: '#FFD8E4',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#1C1B1F',
    onBackground: '#E6E1E5',
    surface: '#1C1B1F',
    onSurface: '#E6E1E5',
    surfaceVariant: '#49454F',
    onSurfaceVariant: '#CAC4D0',
    outline: '#938F99',
    outlineVariant: '#49454F',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#E6E1E5',
    inverseOnSurface: '#313033',
    inversePrimary: '#6750A4',
  },
};

// iOS-style colors (keeping existing)
const iOSColors = Colors;

interface AdaptiveThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  platformTheme: PlatformTheme;
  setThemeMode: (mode: ThemeMode) => void;
  colors: any;
  isDark: boolean;
  materialTheme?: any;
  isAndroid: boolean;
  isiOS: boolean;
}

const AdaptiveThemeContext = createContext<AdaptiveThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cueview_adaptive_theme_mode';

export function AdaptiveThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  const isAndroid = Platform.OS === 'android';
  const isiOS = Platform.OS === 'ios';
  const platformTheme: PlatformTheme = isAndroid ? 'android' : 'ios';

  // Determine the actual color scheme based on theme mode
  const colorScheme: ColorScheme = 
    themeMode === 'auto' 
      ? (systemColorScheme ?? 'light')
      : themeMode === 'dark' 
        ? 'dark' 
        : 'light';

  const isDark = colorScheme === 'dark';

  // Get platform-specific colors
  const colors = isAndroid ? MD3Colors[colorScheme] : iOSColors[colorScheme];

  // Create Material Theme for Android
  const materialTheme = isAndroid ? {
    ...isDark ? MD3DarkTheme : MD3LightTheme,
    colors: {
      ...isDark ? MD3DarkTheme.colors : MD3LightTheme.colors,
      ...MD3Colors[colorScheme],
    },
  } : undefined;

  // Load saved theme mode on app start
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme mode:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemeMode();
  }, []);

  // Save theme mode when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <AdaptiveThemeContext.Provider value={{
      themeMode,
      colorScheme,
      platformTheme,
      setThemeMode,
      colors,
      isDark,
      materialTheme,
      isAndroid,
      isiOS,
    }}>
      {children}
    </AdaptiveThemeContext.Provider>
  );
}

export function useAdaptiveTheme() {
  const context = useContext(AdaptiveThemeContext);
  if (context === undefined) {
    throw new Error('useAdaptiveTheme must be used within an AdaptiveThemeProvider');
  }
  return context;
}

// Enhanced theme color hook for adaptive themes
export function useAdaptiveThemeColor(
  props: { light?: string; dark?: string; android?: string; ios?: string },
  fallbackColorName?: string
) {
  const { colors, colorScheme, isAndroid } = useAdaptiveTheme();
  
  // Platform-specific color override
  const platformColor = isAndroid ? props.android : props.ios;
  if (platformColor) {
    return platformColor;
  }
  
  // Color scheme-specific color
  const colorFromProps = props[colorScheme];
  if (colorFromProps) {
    return colorFromProps;
  }
  
  // Fallback to theme colors
  if (fallbackColorName && colors[fallbackColorName]) {
    return colors[fallbackColorName];
  }
  
  return colors.primary || '#007AFF';
}

// Backward compatibility - keep the original hooks
export const useTheme = useAdaptiveTheme;
export const useThemeColor = useAdaptiveThemeColor;

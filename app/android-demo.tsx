import { AndroidMaterialButton, AndroidMaterialCard, AndroidMaterialSurface } from '@/components/AndroidMaterialComponents';
import { AndroidStyles, androidStyle } from '@/constants/AndroidMaterialTheme';
import { useAdaptiveTheme } from '@/contexts/AdaptiveThemeContext';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';

export default function AndroidMaterialDemo() {
  const [switchValue, setSwitchValue] = useState(false);
  const theme = useTheme();
  const { isDark, setThemeMode } = useAdaptiveTheme();

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, textAlign: 'center', margin: 20 }}>
          This demo is designed for Android devices
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', margin: 20 }}>
          The Material Design 3 components will still work on iOS, but are optimized for Android.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text 
        variant="headlineMedium" 
        style={[
          styles.title,
          androidStyle(AndroidStyles.typography.headlineMedium),
          { color: theme.colors.onBackground }
        ]}
      >
        Android Material Design 3
      </Text>
      
      <Text 
        variant="bodyLarge" 
        style={[
          styles.subtitle,
          { color: theme.colors.onSurfaceVariant }
        ]}
      >
        Components optimized for Android with proper Material Design 3 styling
      </Text>

      <AndroidMaterialSurface elevation={2} style={styles.section}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Theme Controls
        </Text>
        
        <View style={styles.themeControl}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            Dark Mode: {isDark ? 'On' : 'Off'}
          </Text>
          <AndroidMaterialButton
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            onPress={toggleTheme}
            mode="outlined"
            size="small"
          />
        </View>
      </AndroidMaterialSurface>

      <AndroidMaterialCard
        title="Material Design Cards"
        description="Cards use proper elevation, spacing, and typography according to Material Design 3 guidelines."
        elevation={1}
        action={{
          label: 'Learn More',
          onPress: () => console.log('Card action pressed'),
        }}
      />

      <AndroidMaterialCard
        title="Notification Features"
        description="Your CueView app now supports proper push notifications with Material Design styling."
        elevation={2}
      >
        <View style={styles.cardContent}>
          <View style={styles.switchRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Enable Notifications
            </Text>
            <Switch
              value={switchValue}
              onValueChange={setSwitchValue}
              trackColor={{ 
                false: theme.colors.surfaceVariant, 
                true: theme.colors.primaryContainer 
              }}
              thumbColor={switchValue ? theme.colors.primary : theme.colors.outline}
            />
          </View>
        </View>
      </AndroidMaterialCard>

      <AndroidMaterialSurface elevation={3} style={styles.section}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Button Variants
        </Text>
        
        <View style={styles.buttonGrid}>
          <AndroidMaterialButton
            title="Contained"
            onPress={() => console.log('Contained pressed')}
            mode="contained"
            size="medium"
          />
          
          <AndroidMaterialButton
            title="Outlined"
            onPress={() => console.log('Outlined pressed')}
            mode="outlined"
            size="medium"
          />
          
          <AndroidMaterialButton
            title="Text"
            onPress={() => console.log('Text pressed')}
            mode="text"
            size="medium"
          />
        </View>

        <View style={styles.buttonGrid}>
          <AndroidMaterialButton
            title="Small"
            onPress={() => console.log('Small pressed')}
            mode="contained"
            size="small"
          />
          
          <AndroidMaterialButton
            title="Large"
            onPress={() => console.log('Large pressed')}
            mode="contained"
            size="large"
          />
        </View>
      </AndroidMaterialSurface>

      <AndroidMaterialCard
        title="Elevation Levels"
        description="Material Design 3 uses 6 elevation levels (0-5) for proper depth and hierarchy."
        elevation={4}
      >
        <View style={styles.elevationDemo}>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <AndroidMaterialSurface
              key={level}
              elevation={level as 0 | 1 | 2 | 3 | 4 | 5}
              style={styles.elevationItem}
            >
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                Level {level}
              </Text>
            </AndroidMaterialSurface>
          ))}
        </View>
      </AndroidMaterialCard>

      <Text 
        variant="bodySmall" 
        style={[
          styles.footer,
          { color: theme.colors.onSurfaceVariant }
        ]}
      >
        These components automatically adapt between Android Material Design and iOS styling based on the platform.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.87,
  },
  section: {
    marginBottom: 16,
  },
  themeControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    gap: 8,
  },
  elevationDemo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  elevationItem: {
    width: '30%',
    marginBottom: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

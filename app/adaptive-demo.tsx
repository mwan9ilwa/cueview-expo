import AdaptiveButton from '@/components/AdaptiveButton';
import AdaptiveCard from '@/components/AdaptiveCard';
import AdaptiveTextInput from '@/components/AdaptiveTextInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAdaptiveTheme } from '@/contexts/AdaptiveThemeContext';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function AdaptiveThemeDemo() {
  const { colors, themeMode, setThemeMode, isAndroid, isiOS } = useAdaptiveTheme();
  const [textInput, setTextInput] = React.useState('');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <ThemedText type="title" style={styles.title}>
          Adaptive Theme Demo
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Platform: {isAndroid ? 'Android (Material Design 3)' : 'iOS (iOS Design)'}
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Current Theme: {themeMode}
        </ThemedText>

        {/* Theme Controls */}
        <AdaptiveCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Theme Controls</ThemedText>
          
          <View style={styles.buttonRow}>
            <AdaptiveButton 
              title="Light" 
              onPress={() => setThemeMode('light')}
              variant={themeMode === 'light' ? 'filled' : 'outlined'}
              style={styles.themeButton}
            />
            <AdaptiveButton 
              title="Dark" 
              onPress={() => setThemeMode('dark')}
              variant={themeMode === 'dark' ? 'filled' : 'outlined'}
              style={styles.themeButton}
            />
            <AdaptiveButton 
              title="Auto" 
              onPress={() => setThemeMode('auto')}
              variant={themeMode === 'auto' ? 'filled' : 'outlined'}
              style={styles.themeButton}
            />
          </View>
        </AdaptiveCard>

        {/* Components Demo */}
        <AdaptiveCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Adaptive Components</ThemedText>
          
          <AdaptiveTextInput
            style={styles.input}
            placeholder="Try typing here..."
            value={textInput}
            onChangeText={setTextInput}
            label={isAndroid ? "Material TextInput" : undefined}
          />

          <View style={styles.buttonRow}>
            <AdaptiveButton 
              title="Filled" 
              onPress={() => {}}
              variant="filled"
              style={styles.demoButton}
            />
            <AdaptiveButton 
              title="Outlined" 
              onPress={() => {}}
              variant="outlined"
              style={styles.demoButton}
            />
            <AdaptiveButton 
              title="Text" 
              onPress={() => {}}
              variant="text"
              style={styles.demoButton}
            />
          </View>
        </AdaptiveCard>

        {/* Color Palette */}
        <AdaptiveCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Color Palette</ThemedText>
          
          <View style={styles.colorGrid}>
            {Object.entries(colors).slice(0, 12).map(([colorName, colorValue]) => (
              <View key={colorName} style={styles.colorItem}>
                <View 
                  style={[
                    styles.colorSwatch, 
                    { backgroundColor: colorValue as string }
                  ]} 
                />
                <ThemedText style={styles.colorName}>{colorName}</ThemedText>
              </View>
            ))}
          </View>
        </AdaptiveCard>

        {/* Platform Features */}
        <AdaptiveCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Platform Features</ThemedText>
          
          {isAndroid && (
            <ThemedText style={styles.featureText}>
              ✓ Material Design 3 components
              {'\n'}✓ Material You dynamic colors
              {'\n'}✓ Adaptive MD3 color tokens
              {'\n'}✓ Paper Provider integration
            </ThemedText>
          )}
          
          {isiOS && (
            <ThemedText style={styles.featureText}>
              ✓ iOS native feel
              {'\n'}✓ iOS design language
              {'\n'}✓ Cupertino-style components
              {'\n'}✓ iOS color system
            </ThemedText>
          )}
        </AdaptiveCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  themeButton: {
    flex: 1,
  },
  demoButton: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    alignItems: 'center',
    width: 80,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  colorName: {
    fontSize: 10,
    textAlign: 'center',
  },
  featureText: {
    lineHeight: 20,
  },
});

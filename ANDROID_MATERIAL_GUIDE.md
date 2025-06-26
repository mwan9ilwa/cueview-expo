# Android Material Design 3 Integration Guide

## Overview

This guide explains how to integrate Android-specific Material Design 3 styling into your CueView app using React Native Paper, while maintaining iOS styling.

## What We've Added

### 1. Android Material Theme (`constants/AndroidMaterialTheme.ts`)
- **Complete Material Design 3 color palette** for light and dark modes
- **Android-specific elevation system** (6 levels: 0-5)
- **Material Design 3 typography scale** (Display, Headline, Title, Body, Label)
- **Helper functions** for platform-specific styling

### 2. Android Material Components (`components/AndroidMaterialComponents.tsx`)
- **AndroidMaterialCard**: Material Design 3 cards with proper elevation
- **AndroidMaterialButton**: Buttons that follow Android design guidelines
- **AndroidMaterialSurface**: Surfaces with proper elevation and styling

### 3. Enhanced Show Card (`components/AndroidShowCard.tsx`)
- **Material Design optimized** show cards
- **Proper elevation and spacing** for Android
- **Status chips and progress indicators** using Material components
- **Both grid and list layouts** with Android-specific styling

### 4. Demo Page (`app/android-demo.tsx`)
- **Complete showcase** of Android Material components
- **Theme switching** demonstration
- **Elevation levels** and **button variants** examples

## How to Use

### Basic Usage

```tsx
import { AndroidMaterialCard, AndroidMaterialButton } from '@/components/AndroidMaterialComponents';

export default function MyScreen() {
  return (
    <AndroidMaterialCard
      title="My Card Title"
      description="This card uses Material Design 3 styling on Android"
      elevation={2}
      action={{
        label: "Action",
        onPress: () => console.log('Pressed')
      }}
    >
      <AndroidMaterialButton
        title="Material Button"
        onPress={() => {}}
        mode="contained"
        size="medium"
      />
    </AndroidMaterialCard>
  );
}
```

### Platform-Specific Styling

```tsx
import { androidStyle, iosStyle, AndroidStyles } from '@/constants/AndroidMaterialTheme';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    ...androidStyle({
      // Android-specific styles
      elevation: AndroidStyles.elevation.level2,
      borderRadius: AndroidStyles.spacing.md,
    }),
    ...iosStyle({
      // iOS-specific styles
      shadowOpacity: 0.1,
      borderRadius: 8,
    }),
  },
});
```

### Using the Enhanced Show Card

Replace your existing ShowCard with AndroidShowCard for Material Design compliance:

```tsx
import { AndroidShowCard } from '@/components/AndroidShowCard';

// In your component
<AndroidShowCard
  show={show}
  userShow={userShow}
  onPress={handlePress}
  layout="grid" // or "list"
  showProgress={true}
  progress={watchProgress}
/>
```

## Key Features

### 1. **Automatic Platform Detection**
- Components automatically apply Android Material Design on Android devices
- iOS devices continue to use iOS-appropriate styling
- No manual platform checking required in your components

### 2. **Material Design 3 Compliance**
- **Proper elevation system**: 6 levels with correct shadow implementation
- **Color system**: Full MD3 color tokens with proper contrast ratios
- **Typography scale**: All 13 Material Design type styles
- **Spacing system**: Consistent spacing tokens (4, 8, 16, 24, 32, 40dp)

### 3. **Theme Integration**
- Works seamlessly with your existing AdaptiveThemeContext
- Supports light and dark mode switching
- React Native Paper integration for consistent theming

### 4. **Performance Optimized**
- Platform checks are done once at component level
- No runtime theme switching overhead
- Leverages React Native Paper's optimized components

## Benefits for Android Users

1. **Native Feel**: Your app will feel like a native Android app with proper Material Design
2. **Better UX**: Proper elevation, spacing, and visual hierarchy
3. **Accessibility**: Material Design 3 includes built-in accessibility improvements
4. **Consistency**: Matches Android system UI patterns and user expectations

## Next Steps

1. **Test the demo**: Run the app and navigate to `/android-demo` to see all components
2. **Gradual adoption**: Start replacing existing cards/buttons with Material versions
3. **Customize colors**: Adjust the Material Design color palette in `AndroidMaterialTheme.ts`
4. **Extend components**: Create more Material components following the same patterns

## Example Migration

### Before (Basic styling):
```tsx
<View style={{ padding: 16, backgroundColor: '#fff', elevation: 2 }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Title</Text>
  <TouchableOpacity style={{ backgroundColor: '#007AFF', padding: 12 }}>
    <Text style={{ color: 'white' }}>Action</Text>
  </TouchableOpacity>
</View>
```

### After (Material Design):
```tsx
<AndroidMaterialCard
  title="Title"
  elevation={2}
  action={{ label: "Action", onPress: handleAction }}
/>
```

The Material Design version automatically handles:
- ✅ Proper elevation shadows
- ✅ Platform-appropriate styling
- ✅ Theme-aware colors
- ✅ Accessibility
- ✅ Typography scale
- ✅ Touch feedback

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [Android Material Components](https://developer.android.com/develop/ui/views/theming/look-and-feel)

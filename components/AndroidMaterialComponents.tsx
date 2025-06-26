import { AndroidStyles, androidStyle, iosStyle } from '@/constants/AndroidMaterialTheme';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Button, Card, Surface, Text, useTheme } from 'react-native-paper';

interface AndroidMaterialCardProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  children?: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

export function AndroidMaterialCard({
  title,
  description,
  action,
  children,
  elevation = 1,
}: AndroidMaterialCardProps) {
  const theme = useTheme();

  return (
    <Card 
      style={[
        styles.card,
        androidStyle(AndroidStyles.elevation[`level${elevation}`]),
        { backgroundColor: theme.colors.surface }
      ]}
      contentStyle={styles.cardContent}
    >
      <Card.Content>
        <Text 
          variant="titleLarge"
          style={[
            styles.title,
            androidStyle(AndroidStyles.typography.titleLarge),
            { color: theme.colors.onSurface }
          ]}
        >
          {title}
        </Text>
        
        {description && (
          <Text 
            variant="bodyMedium"
            style={[
              styles.description,
              androidStyle(AndroidStyles.typography.bodyMedium),
              { color: theme.colors.onSurfaceVariant }
            ]}
          >
            {description}
          </Text>
        )}
        
        {children}
      </Card.Content>
      
      {action && (
        <Card.Actions style={styles.actions}>
          <Button 
            mode={Platform.OS === 'android' ? 'contained' : 'outlined'}
            onPress={action.onPress}
            style={[
              androidStyle({ borderRadius: AndroidStyles.spacing.md }),
              iosStyle({ borderRadius: 8 })
            ]}
          >
            {action.label}
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

interface AndroidMaterialButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text';
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: string;
}

export function AndroidMaterialButton({
  title,
  onPress,
  mode = 'contained',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
}: AndroidMaterialButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: Platform.OS === 'android' ? AndroidStyles.spacing.md : 8,
      paddingHorizontal: AndroidStyles.spacing.md,
    };

    if (size === 'small') {
      return { ...baseStyle, minHeight: 32 };
    } else if (size === 'large') {
      return { ...baseStyle, minHeight: 56 };
    }
    return { ...baseStyle, minHeight: 40 };
  };

  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      icon={icon}
      style={[
        getButtonStyle(),
        androidStyle(AndroidStyles.elevation.level1),
      ]}
      labelStyle={[
        androidStyle(AndroidStyles.typography.labelLarge),
      ]}
      contentStyle={{
        paddingVertical: AndroidStyles.spacing.sm,
      }}
    >
      {title}
    </Button>
  );
}

interface AndroidMaterialSurfaceProps {
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  style?: any;
}

export function AndroidMaterialSurface({
  children,
  elevation = 1,
  style,
}: AndroidMaterialSurfaceProps) {
  const theme = useTheme();

  return (
    <Surface
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: Platform.OS === 'android' ? AndroidStyles.spacing.md : 8,
          padding: AndroidStyles.spacing.md,
        },
        androidStyle(AndroidStyles.elevation[`level${elevation}`]),
        style,
      ]}
      elevation={Platform.OS === 'android' ? elevation : 0}
    >
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  cardContent: {
    padding: 0,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    opacity: 0.87,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

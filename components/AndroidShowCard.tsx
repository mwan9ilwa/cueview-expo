import CachedImage from '@/components/CachedImage';
import { AndroidStyles, androidStyle } from '@/constants/AndroidMaterialTheme';
import { TMDbShow } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, ProgressBar, Text, useTheme } from 'react-native-paper';

interface AndroidShowCardProps {
  show?: TMDbShow;
  userShow?: UserShowWithDetails;
  onPress: (showIdOrShow: number | TMDbShow) => void;
  showProgress?: boolean;
  progress?: number;
  layout?: 'grid' | 'list';
}

export function AndroidShowCard({
  show,
  userShow,
  onPress,
  showProgress = false,
  progress = 0,
  layout = 'grid',
}: AndroidShowCardProps) {
  const theme = useTheme();
  const displayShow = userShow?.showDetails || show;
  
  if (!displayShow) return null;

  const handlePress = () => {
    if (userShow) {
      onPress(userShow.showId);
    } else if (show) {
      onPress(show);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'watching':
        return theme.colors.primary;
      case 'want-to-watch':
        return theme.colors.secondary;
      case 'watched':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'watching':
        return 'Watching';
      case 'want-to-watch':
        return 'Want to Watch';
      case 'watched':
        return 'Watched';
      case 'on-hold':
        return 'On Hold';
      case 'dropped':
        return 'Dropped';
      default:
        return '';
    }
  };

  if (layout === 'list') {
    return (
      <Card
        style={[
          styles.listCard,
          androidStyle(AndroidStyles.elevation.level1),
          { backgroundColor: theme.colors.surface }
        ]}
        onPress={handlePress}
      >
        <Card.Content style={styles.listContent}>
          <View style={styles.listImageContainer}>
            <CachedImage
              uri={displayShow.poster_path ? 
                `https://image.tmdb.org/t/p/w200${displayShow.poster_path}` : 
                ''
              }
              style={styles.listImage}
            />
          </View>
          
          <View style={styles.listTextContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.listTitle,
                androidStyle(AndroidStyles.typography.titleMedium),
                { color: theme.colors.onSurface }
              ]}
              numberOfLines={2}
            >
              {displayShow.name}
            </Text>
            
            <Text
              variant="bodySmall"
              style={[
                styles.listOverview,
                { color: theme.colors.onSurfaceVariant }
              ]}
              numberOfLines={3}
            >
              {displayShow.overview}
            </Text>
            
            <View style={styles.listFooter}>
              {userShow?.status && (
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(userShow.status) + '20' }
                  ]}
                  textStyle={{ 
                    color: getStatusColor(userShow.status),
                    fontSize: 12 
                  }}
                >
                  {getStatusLabel(userShow.status)}
                </Chip>
              )}
              
              {showProgress && (
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={progress / 100}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {Math.round(progress)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Grid layout
  return (
    <Card
      style={[
        styles.gridCard,
        androidStyle(AndroidStyles.elevation.level2),
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={handlePress}
    >
      <View style={styles.gridImageContainer}>
        <CachedImage
          uri={displayShow.poster_path ? 
            `https://image.tmdb.org/t/p/w300${displayShow.poster_path}` : 
            ''
          }
          style={styles.gridImage}
        />
        
        {userShow?.status && (
          <Chip
            style={[
              styles.gridStatusChip,
              { backgroundColor: getStatusColor(userShow.status) }
            ]}
            textStyle={{ 
              color: theme.colors.onPrimary,
              fontSize: 10 
            }}
          >
            {getStatusLabel(userShow.status)}
          </Chip>
        )}
      </View>
      
      <Card.Content style={styles.gridContent}>
        <Text
          variant="titleSmall"
          style={[
            styles.gridTitle,
            androidStyle(AndroidStyles.typography.titleSmall),
            { color: theme.colors.onSurface }
          ]}
          numberOfLines={2}
        >
          {displayShow.name}
        </Text>
        
        <Text
          variant="bodySmall"
          style={[
            styles.gridYear,
            { color: theme.colors.onSurfaceVariant }
          ]}
        >
          {displayShow.first_air_date ? 
            new Date(displayShow.first_air_date).getFullYear() : 
            'Unknown'
          }
        </Text>
        
        {showProgress && (
          <ProgressBar
            progress={progress / 100}
            color={theme.colors.primary}
            style={styles.gridProgressBar}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  // List layout styles
  listCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  listContent: {
    padding: 16,
    flexDirection: 'row',
  },
  listImageContainer: {
    marginRight: 16,
  },
  listImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  listTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listTitle: {
    marginBottom: 8,
  },
  listOverview: {
    flex: 1,
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    height: 24,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 60,
    marginBottom: 4,
  },
  
  // Grid layout styles
  gridCard: {
    margin: 8,
    width: 160,
  },
  gridImageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridStatusChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    height: 20,
  },
  gridContent: {
    padding: 12,
    minHeight: 80,
  },
  gridTitle: {
    marginBottom: 4,
    minHeight: 32,
  },
  gridYear: {
    marginBottom: 8,
  },
  gridProgressBar: {
    marginTop: 8,
  },
});

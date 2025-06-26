import { router } from 'expo-router';
import React from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';

import { AndroidShowCard } from '@/components/AndroidShowCard';
import LoadingScreen from '@/components/LoadingScreen';
import ShowCard from '@/components/ShowCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useHomeScreenData } from '@/hooks/useHomeScreenData';
import { useRealTimeEpisodes } from '@/hooks/useRealTimeEpisodes';
import { TMDbShow } from '@/services/tmdb';
export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    trendingShows,
    popularShows,
    topRatedShows,
    continueWatching,
    loading: dataLoading,
    error,
  } = useHomeScreenData();
  
  const {
    episodesAiringToday,
    loading: realTimeLoading,
  } = useRealTimeEpisodes();

  const [refreshing, setRefreshing] = React.useState(false);

  if (authLoading) {
    return <LoadingScreen message="Initializing CueView..." />;
  }

  const handleShowPress = (showIdOrShow: number | TMDbShow) => {
    // Navigate to show details screen
    const showId = typeof showIdOrShow === 'number' ? showIdOrShow : showIdOrShow.id;
    router.push(`/show/${showId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // The useHomeScreenData hook will reload data when user changes
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Create sections for the FlatList
  const createSections = () => {
    const sections = [];

    // Episodes Airing Today Section
    if (episodesAiringToday.length > 0) {
      sections.push({
        type: 'airing_today',
        title: 'Airing Today',
        data: episodesAiringToday,
        loading: realTimeLoading,
      });
    }

    // Continue Watching Section
    if (continueWatching.length > 0) {
      sections.push({
        type: 'horizontal_list',
        title: 'Continue Watching',
        data: continueWatching,
        showProgress: true,
      });
    }

    // Trending Shows
    sections.push({
      type: 'horizontal_list',
      title: 'Trending This Week',
      data: trendingShows,
      loading: dataLoading,
      error: error,
    });

    // Popular Shows
    sections.push({
      type: 'horizontal_list',
      title: 'Popular Shows',
      data: popularShows,
      loading: dataLoading,
      error: error,
    });

    // Top Rated Shows
    sections.push({
      type: 'horizontal_list',
      title: 'Top Rated',
      data: topRatedShows,
      loading: dataLoading,
      error: error,
    });

    return sections;
  };

  const renderSectionItem = ({ item: section }: { item: any }) => {
    switch (section.type) {
      case 'airing_today':
        if (section.loading) {
          return (
            <View style={styles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={styles.loadingContainer}>
                <IconSymbol name="tv.fill" size={16} color="#FF3B30" />
                <ThemedText style={styles.loadingText}>Loading episodes...</ThemedText>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.horizontalSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <FlatList
              data={section.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => `${item.showId}-${item.seasonNumber}-${item.episodeNumber}`}
              renderItem={({ item }) => (
                <View style={styles.airingTodayCard}>
                  <ThemedText style={styles.airingTodayShow}>{item.showName}</ThemedText>
                  <ThemedText style={styles.airingTodayEpisode}>
                    S{item.seasonNumber}E{item.episodeNumber}
                  </ThemedText>
                  <ThemedText style={styles.airingTodayTitle} numberOfLines={2}>
                    {item.episodeName}
                  </ThemedText>
                  <View style={styles.airingTodayBadge}>
                    <IconSymbol name="tv.fill" size={12} color="white" />
                    <ThemedText style={styles.airingTodayBadgeText}>LIVE</ThemedText>
                  </View>
                </View>
              )}
            />
          </View>
        );
      case 'horizontal_list':
        if (section.loading) {
          return (
            <View style={styles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={styles.loadingContainer}>
                <IconSymbol name="clock.fill" size={16} color="#999" />
                <ThemedText style={styles.loadingText}>Loading shows...</ThemedText>
              </View>
            </View>
          );
        }

        if (section.error) {
          return (
            <View style={styles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={styles.errorContainer}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FF3B30" />
                <ThemedText style={styles.errorText}>{section.error}</ThemedText>
              </View>
            </View>
          );
        }

        if (section.data.length === 0) {
          return (
            <View style={styles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={styles.emptyContainer}>
                <IconSymbol name="tv.fill" size={16} color="#999" />
                <ThemedText style={styles.emptyText}>No shows available</ThemedText>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.horizontalSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <FlatList
              data={section.data}
              renderItem={({ item }) => {
                const ShowComponent = Platform.OS === 'android' ? AndroidShowCard : ShowCard;
                return (
                  <ShowComponent 
                    show={item} 
                    onPress={handleShowPress}
                    showProgress={section.showProgress}
                    progress={section.showProgress ? Math.random() * 100 : 0} // TODO: Get real progress
                  />
                );
              }}
              keyExtractor={(item) => `${section.title}-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <ThemedText type="title">CueView</ThemedText>
            {user && (
              <ThemedText style={styles.subtitle}>Hello, {user.username}!</ThemedText>
            )}
          </View>
        </View>
      </ThemedView>

      {/* Single FlatList for all content */}
      <FlatList
        data={createSections()}
        renderItem={renderSectionItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  horizontalSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  errorText: {
    opacity: 0.6,
    color: '#FF3B30',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  emptyText: {
    opacity: 0.6,
  },
  statsSection: {
    padding: 16,
    margin: 16,
    backgroundColor: 'rgba(233, 76, 76, 0.05)',
    borderRadius: 8,
    gap: 8,
  },
  bottomPadding: {
    height: 20,
  },
  airingTodayCard: {
    width: 200,
    marginRight: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  airingTodayShow: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  airingTodayEpisode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF3B30',
    marginBottom: 6,
  },
  airingTodayTitle: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 8,
  },
  airingTodayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  airingTodayBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
});

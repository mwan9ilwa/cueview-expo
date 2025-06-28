import { router } from 'expo-router';
import React from 'react';
import { FlatList, Platform, RefreshControl, View } from 'react-native';

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
import { GlobalStyles } from '@/styles/GlobalStyles';

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
            <View style={GlobalStyles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={GlobalStyles.loadingContainer}>
                <IconSymbol name="tv.fill" size={16} color="#FF3B30" />
                <ThemedText style={GlobalStyles.loadingText}>Loading episodes...</ThemedText>
              </View>
            </View>
          );
        }

        return (
          <View style={GlobalStyles.horizontalSection}>
            <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
              {section.title}
            </ThemedText>
            <FlatList
              data={section.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={GlobalStyles.horizontalList}
              keyExtractor={(item) => `${item.showId}-${item.seasonNumber}-${item.episodeNumber}`}
              renderItem={({ item }) => (
                <View style={GlobalStyles.airingTodayCard}>
                  <ThemedText style={GlobalStyles.airingTodayShow}>{item.showName}</ThemedText>
                  <ThemedText style={GlobalStyles.airingTodayEpisode}>
                    S{item.seasonNumber}E{item.episodeNumber}
                  </ThemedText>
                  <ThemedText style={GlobalStyles.airingTodayTitle} numberOfLines={2}>
                    {item.episodeName}
                  </ThemedText>
                  <View style={GlobalStyles.airingTodayBadge}>
                    <IconSymbol name="tv.fill" size={12} color="white" />
                    <ThemedText style={GlobalStyles.airingTodayBadgeText}>LIVE</ThemedText>
                  </View>
                </View>
              )}
            />
          </View>
        );
      case 'horizontal_list':
        if (section.loading) {
          return (
            <View style={GlobalStyles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={GlobalStyles.loadingContainer}>
                <IconSymbol name="clock.fill" size={16} color="#999" />
                <ThemedText style={GlobalStyles.loadingText}>Loading shows...</ThemedText>
              </View>
            </View>
          );
        }

        if (section.error) {
          return (
            <View style={GlobalStyles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={GlobalStyles.errorContainer}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FF3B30" />
                <ThemedText style={GlobalStyles.errorText}>{section.error}</ThemedText>
              </View>
            </View>
          );
        }

        if (section.data.length === 0) {
          return (
            <View style={GlobalStyles.horizontalSection}>
              <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
                {section.title}
              </ThemedText>
              <View style={GlobalStyles.emptyContainer}>
                <IconSymbol name="tv.fill" size={16} color="#999" />
                <ThemedText style={GlobalStyles.emptyText}>No shows available</ThemedText>
              </View>
            </View>
          );
        }

        return (
          <View style={GlobalStyles.horizontalSection}>
            <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
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
              contentContainerStyle={GlobalStyles.horizontalList}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={GlobalStyles.container}>
      <ThemedView style={GlobalStyles.header}>
        <View style={GlobalStyles.headerContent}>
          <View style={GlobalStyles.titleSection}>
            <ThemedText type="title">CueView</ThemedText>
            {user && (
              <ThemedText style={GlobalStyles.subtitle}>Hello, {user.username}!</ThemedText>
            )}
          </View>
        </View>
      </ThemedView>

      {/* Single FlatList for all content */}
      <FlatList
        data={createSections()}
        renderItem={renderSectionItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={GlobalStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={GlobalStyles.flatListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ThemedView>
  );
}

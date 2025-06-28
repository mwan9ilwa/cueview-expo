import LoadingScreen from '@/components/LoadingScreen';
import ShowCard from '@/components/ShowCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { getShowStatusInfo, TMDbShow } from '@/services/tmdb';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { UserShowWithDetails } from '@/types';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';


type LibraryTab = 'watching' | 'want-to-watch' | 'watched';
type SortOption = 'name' | 'date-added' | 'next-episode' | 'rating';

export default function LibraryScreen() {
  const { user } = useAuth();
  const { 
    watchingShowsWithDetails, 
    wantToWatchShowsWithDetails, 
    watchedShowsWithDetails, 
    loading, 
    error, 
    refreshLibrary,
    updateShowProgress,
  } = useUserLibrary();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('watching');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  };

  const handleShowPress = (showIdOrShow: number | TMDbShow) => {
    const showId = typeof showIdOrShow === 'number' ? showIdOrShow : showIdOrShow.id;
    router.push(`/show/${showId}`);
  };

  const handleUpdateProgress = async (showId: number, season: number, episode: number) => {
    try {
      await updateShowProgress(showId, season, episode);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleShowDetailsUpdated = async (showId: number, showDetails: any) => {
    // Refresh the library to get updated show details
    await refreshLibrary();
  };

  // Group shows by their status for better organization
  const groupShowsByStatus = (shows: UserShowWithDetails[]) => {
    const groups = {
      active: [] as UserShowWithDetails[], // Currently airing/returning
      betweenSeasons: [] as UserShowWithDetails[], // Between seasons (waiting for renewal/new season)
      upcoming: [] as UserShowWithDetails[], // Waiting for release/in production
      ended: [] as UserShowWithDetails[], // Completed/canceled
      unknown: [] as UserShowWithDetails[], // Unknown status
    };

    shows.forEach(show => {
      if (!show.showDetails) {
        groups.unknown.push(show);
        return;
      }

      const status = show.showDetails.status?.toLowerCase() || '';
      const statusInfo = getShowStatusInfo(show.showDetails);
      
      if (statusInfo.isBetweenSeasons) {
        groups.betweenSeasons.push(show);
      } else if (status === 'returning series' || status === 'on the air') {
        groups.active.push(show);
      } else if (status === 'in production' || status === 'planned' || status === 'pilot' || status === 'post production') {
        groups.upcoming.push(show);
      } else if (status === 'ended' || status === 'canceled' || status === 'cancelled') {
        groups.ended.push(show);
      } else {
        groups.unknown.push(show);
      }
    });

    return groups;
  };

  // Filter and sort shows based on search and sort options
  const getFilteredAndSortedShows = useMemo(() => {
    let shows: UserShowWithDetails[] = [];
    
    // Get shows for current tab
    switch (activeTab) {
      case 'watching':
        shows = watchingShowsWithDetails;
        break;
      case 'want-to-watch':
        shows = wantToWatchShowsWithDetails;
        break;
      case 'watched':
        shows = watchedShowsWithDetails;
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      shows = shows.filter(show => 
        show.showDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show.showDetails?.overview?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort shows
    shows.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.showDetails?.name || '').localeCompare(b.showDetails?.name || '');
        case 'date-added':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'rating':
          return (b.showDetails?.vote_average || 0) - (a.showDetails?.vote_average || 0);
        case 'next-episode':
          // Sort by show status priority, then by other criteria
          const getShowPriority = (show: UserShowWithDetails) => {
            if (!show.showDetails) return 999;
            const status = show.showDetails.status?.toLowerCase() || '';
            const statusInfo = getShowStatusInfo(show.showDetails);
            
            // Higher priority shows come first (lower number = higher priority)
            if (status === 'returning series' || status === 'on the air') return 1;
            if (statusInfo.isBetweenSeasons) return 2;
            if (status === 'in production' || status === 'planned') return 3;
            if (status === 'ended' || status === 'canceled') return 4;
            return 5;
          };
          
          const priorityA = getShowPriority(a);
          const priorityB = getShowPriority(b);
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // If same priority, sort by last air date (more recent first for ongoing shows)
          const lastAirA = a.showDetails?.last_air_date;
          const lastAirB = b.showDetails?.last_air_date;
          
          if (lastAirA && lastAirB) {
            return new Date(lastAirB).getTime() - new Date(lastAirA).getTime();
          }
          
          // Fallback to name sort
          return (a.showDetails?.name || '').localeCompare(b.showDetails?.name || '');
        default:
          return 0;
      }
    });

    return shows;
  }, [activeTab, watchingShowsWithDetails, wantToWatchShowsWithDetails, watchedShowsWithDetails, searchQuery, sortBy]);

  // Sort shows by next episode air date (future feature)
  /* 
  const sortShowsByNextEpisode = async (shows: UserShowWithDetails[]) => {
    const showsWithDates = await Promise.all(
      shows.map(async (show) => {
        try {
          const nextEpisode = await getNextEpisodeInfo(show.showId, show.currentSeason, show.currentEpisode);
          return {
            ...show,
            nextEpisodeDate: nextEpisode?.airDate ? new Date(nextEpisode.airDate) : null,
            nextEpisode
          };
        } catch {
          return {
            ...show,
            nextEpisodeDate: null,
            nextEpisode: null
          };
        }
      })
    );

    // Sort: shows with upcoming episodes first (by air date), then shows without dates
    return showsWithDates.sort((a, b) => {
      if (a.nextEpisodeDate && b.nextEpisodeDate) {
        return a.nextEpisodeDate.getTime() - b.nextEpisodeDate.getTime();
      }
      if (a.nextEpisodeDate && !b.nextEpisodeDate) return -1;
      if (!a.nextEpisodeDate && b.nextEpisodeDate) return 1;
      return 0;
    });
  };
  */

  const tabs: { key: LibraryTab; label: string; color: string; icon: string }[] = [
    { key: 'watching', label: 'Watching', color: '#34C759', icon: 'tv.fill' },
    { key: 'want-to-watch', label: 'Watchlist', color: '#FF9500', icon: 'plus' },
    { key: 'watched', label: 'Watched', color: '#007AFF', icon: 'checkmark' },
  ];

  const segmentedControlValues = tabs.map(tab => tab.label);
  const getTabIndex = (tabKey: LibraryTab) => tabs.findIndex(tab => tab.key === tabKey);
  const getTabFromIndex = (index: number) => tabs[index]?.key || 'watching';

  const renderEmptyState = (status: LibraryTab) => {
    const messages = {
      'watching': 'No shows currently being watched.\nStart watching a show to see it here!',
      'want-to-watch': 'No shows in your watchlist.\nAdd shows you want to watch later!',
      'watched': 'No completed shows yet.\nMark shows as watched to track your progress!',
    };

    return (
      <ThemedView style={GlobalStyles.emptyContainer}>
        {/* <ThemedText style={GlobalStyles.emptyText}>📺</ThemedText> */}
        <ThemedText style={GlobalStyles.emptyMessage}>
          {messages[status]}
        </ThemedText>
        <ThemedText style={GlobalStyles.emptyHint}>
          Browse trending shows in the Home tab to get started!
        </ThemedText>
      </ThemedView>
    );
  };

  const renderTabContent = () => {
    const filteredShows = getFilteredAndSortedShows;
    
    if (loading) {
      return <LoadingScreen message="Loading your shows..." />;
    }
    
    if (filteredShows.length === 0) {
      if (searchQuery.trim()) {
        return (
          <ThemedView style={GlobalStyles.emptyContainer}>
            <ThemedText style={GlobalStyles.emptyMessage}>
              No shows found matching &quot;{searchQuery}&quot;
            </ThemedText>
            <ThemedText style={GlobalStyles.emptyHint}>
              Try adjusting your search terms or browse all shows.
            </ThemedText>
          </ThemedView>
        );
      }
      return renderEmptyState(activeTab);
    }

    // Group shows by status for better organization
    const groupedShows = groupShowsByStatus(filteredShows);
    
    const renderShowGroup = (title: string | null, shows: UserShowWithDetails[], color: string, iconName: string) => {
      if (shows.length === 0) return null;
      
      return (
        <View style={GlobalStyles.showGroup}>
          {title && (
            <View style={GlobalStyles.groupHeader}>
              <View style={[GlobalStyles.groupIcon, { backgroundColor: color + '20' }]}>
                <IconSymbol name={iconName as any} size={16} color={color} />
              </View>
              <ThemedText type="defaultSemiBold" style={GlobalStyles.groupTitle}>
                {title}
              </ThemedText>
              <ThemedText style={GlobalStyles.groupCount}>
                {shows.length}
              </ThemedText>
            </View>
          )}
          
          <View style={GlobalStyles.showsList}>
            {shows.map((userShow) => (
              <ShowCard
                key={userShow.id}
                userShow={userShow}
                onPress={handleShowPress}
                onUpdateProgress={handleUpdateProgress}
                onShowDetailsUpdated={handleShowDetailsUpdated}
                showProgress={activeTab === 'watching'}
                userId={user?.id}
                layout="list"
              />
            ))}
          </View>
        </View>
      );
    };

    return (
      <ScrollView
        style={GlobalStyles.showsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={GlobalStyles.showsList}>
          {/* Active Shows - no title, just shows */}
          {renderShowGroup(null, groupedShows.active, '#34C759', 'tv.fill')}
          
          {/* Between Seasons Shows */}
          {renderShowGroup('Between Seasons', groupedShows.betweenSeasons, '#FF9500', 'pause.circle.fill')}
          
          {/* Upcoming Shows */}
          {renderShowGroup('Upcoming & In Production', groupedShows.upcoming, '#5856D6', 'clock.fill')}
          
          {/* Ended Shows */}
          {renderShowGroup('Completed', groupedShows.ended, '#FF3B30', 'checkmark.circle.fill')}
          
          {/* Unknown Status Shows */}
          {renderShowGroup('Other', groupedShows.unknown, '#999', 'question.circle.fill')}
        </ThemedView>
      </ScrollView>
    );
  };

  if (!user) {
    return (
      <ThemedView style={GlobalStyles.container}>
        <ThemedView style={GlobalStyles.header}>
          <ThemedText type="title">My Shows</ThemedText>
        </ThemedView>
        
        <ThemedView style={GlobalStyles.signInPrompt}>
          <View style={GlobalStyles.signInIconContainer}>
            <IconSymbol name="tv.fill" size={48} color="#999" />
          </View>
          <ThemedText type="subtitle" style={GlobalStyles.signInTitle}>
            Sign In Required
          </ThemedText>
          <ThemedText style={GlobalStyles.signInMessage}>
            Sign in to create your personal show library and track your watching progress.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={GlobalStyles.container}>
      <ThemedView style={GlobalStyles.header}>
        <View style={GlobalStyles.headerContent}>
          <View>
            <ThemedText type="title">My Shows</ThemedText>
          </View>
        </View>
        
        {error && (
          <View style={GlobalStyles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#FF3B30" />
            <ThemedText style={GlobalStyles.errorText}>
              {error}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Segmented Control */}
      <ThemedView style={GlobalStyles.segmentedContainer}>
        <SegmentedControl
          values={segmentedControlValues}
          selectedIndex={getTabIndex(activeTab)}
          onChange={(event) => {
            const selectedIndex = event.nativeEvent.selectedSegmentIndex;
            setActiveTab(getTabFromIndex(selectedIndex));
          }}
          style={GlobalStyles.segmentedControl}
          tintColor={tabs[getTabIndex(activeTab)].color}
          backgroundColor="#f8f9fa"
          fontStyle={{ fontSize: 14, fontWeight: '600' }}
          activeFontStyle={{ fontSize: 14, fontWeight: '700', color: 'white' }}
        />
      </ThemedView>

      {/* Search and Filter Controls */}
      <ThemedView style={GlobalStyles.searchContainer}>
        <View style={GlobalStyles.searchInputContainer}>
          <IconSymbol name="magnifyingglass" size={16} color="#999" style={GlobalStyles.searchIcon} />
          <TextInput
            style={GlobalStyles.searchInput}
            placeholder="Search shows..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <TouchableOpacity
          style={[GlobalStyles.filterButton, showFilters && GlobalStyles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <IconSymbol name="slider.horizontal.3" size={16} color={showFilters ? '#007AFF' : '#666'} />
        </TouchableOpacity>
      </ThemedView>

      {/* Filter Panel */}
      {showFilters && (
        <ThemedView style={styles.filterPanel}>
          <View style={styles.filterRow}>
            <ThemedText style={styles.filterLabel}>Sort by:</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.sortOptions}
              contentContainerStyle={styles.sortOptionsContent}
            >
              {([
                { key: 'name', label: 'Name', icon: 'textformat.alt' },
                { key: 'date-added', label: 'Date Added', icon: 'calendar' },
                { key: 'rating', label: 'Rating', icon: 'star.fill' },
                { key: 'next-episode', label: 'Next Episode', icon: 'clock' },
              ] as const).map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive
                  ]}
                  onPress={() => setSortBy(option.key)}
                >
                  <IconSymbol 
                    name={option.icon} 
                    size={14} 
                    color={sortBy === option.key ? '#007AFF' : '#666'} 
                  />
                  <ThemedText style={[
                    styles.sortOptionText,
                    sortBy === option.key && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ThemedView>
      )}

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {renderTabContent()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  filterPanel: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 16,
    minWidth: 80,
  },
  sortOptions: {
    flex: 1,
  },
  sortOptionsContent: {
    paddingRight: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  // Profile screen styles that might be missing
  container: {
    flex: 1,
  },
  signInContainer: {
    alignItems: 'center',
    padding: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  email: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});

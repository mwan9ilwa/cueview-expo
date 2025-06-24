import LoadingScreen from '@/components/LoadingScreen';
import ShowCard from '@/components/ShowCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { getShowStatusInfo, TMDbShow } from '@/services/tmdb';
import { UserShowWithDetails } from '@/types';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';


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
    syncToCloud,
    syncFromCloud,
  } = useUserLibrary();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('watching');
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    try {
      await syncToCloud();
      Alert.alert('Success', 'Your library has been synced to the cloud!');
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      Alert.alert('Error', 'Failed to sync to cloud. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromCloud = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      Alert.alert('Success', 'Your library has been synced from the cloud!');
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      Alert.alert('Error', 'Failed to sync from cloud. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
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
      <ThemedView style={styles.emptyContainer}>
        {/* <ThemedText style={styles.emptyText}>📺</ThemedText> */}
        <ThemedText style={styles.emptyMessage}>
          {messages[status]}
        </ThemedText>
        <ThemedText style={styles.emptyHint}>
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
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyMessage}>
              No shows found matching &quot;{searchQuery}&quot;
            </ThemedText>
            <ThemedText style={styles.emptyHint}>
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
        <View style={styles.showGroup}>
          {title && (
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: color + '20' }]}>
                <IconSymbol name={iconName as any} size={16} color={color} />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.groupTitle}>
                {title}
              </ThemedText>
              <ThemedText style={styles.groupCount}>
                {shows.length}
              </ThemedText>
            </View>
          )}
          
          <View style={styles.showsList}>
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
        style={styles.showsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.showsList}>
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
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">My Shows</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.signInPrompt}>
          <View style={styles.signInIconContainer}>
            <IconSymbol name="tv.fill" size={48} color="#999" />
          </View>
          <ThemedText type="subtitle" style={styles.signInTitle}>
            Sign In Required
          </ThemedText>
          <ThemedText style={styles.signInMessage}>
            Sign in to create your personal show library and track your watching progress.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText type="title">My Shows</ThemedText>
          </View>
          
          {/* Sync Buttons */}
          <View style={styles.syncButtons}>
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncToCloud}
              disabled={syncing}
            >
              <View style={styles.syncButtonContent}>
                {syncing ? (
                  <IconSymbol name="clock.fill" size={14} color="#007AFF" />
                ) : (
                  <>
                    <IconSymbol name="icloud.fill" size={12} color="#007AFF" />
                    <IconSymbol name="arrow.up" size={10} color="#007AFF" />
                  </>
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncFromCloud}
              disabled={syncing}
            >
              <View style={styles.syncButtonContent}>
                {syncing ? (
                  <IconSymbol name="clock.fill" size={14} color="#007AFF" />
                ) : (
                  <>
                    <IconSymbol name="icloud.fill" size={12} color="#007AFF" />
                    <IconSymbol name="arrow.down" size={10} color="#007AFF" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#FF3B30" />
            <ThemedText style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Segmented Control */}
      <ThemedView style={styles.segmentedContainer}>
        <SegmentedControl
          values={segmentedControlValues}
          selectedIndex={getTabIndex(activeTab)}
          onChange={(event) => {
            const selectedIndex = event.nativeEvent.selectedSegmentIndex;
            setActiveTab(getTabFromIndex(selectedIndex));
          }}
          style={styles.segmentedControl}
          tintColor={tabs[getTabIndex(activeTab)].color}
          backgroundColor="#f8f9fa"
          fontStyle={{ fontSize: 14, fontWeight: '600' }}
          activeFontStyle={{ fontSize: 14, fontWeight: '700', color: 'white' }}
        />
      </ThemedView>

      {/* Search and Filter Controls */}
      <ThemedView style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol name="magnifyingglass" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shows..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
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
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    gap: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  syncButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  syncButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  syncHint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    flex: 1,
  },
  subtitle: {
    opacity: 0.8,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  tabCount: {
    fontSize: 12,
    opacity: 0.7,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTabCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: 'white',
    opacity: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    opacity: 0.8,
  },
  emptyHint: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.6,
  },
  showsContainer: {
    padding: 0,
    
  },
  signInPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  signInText: {
    fontSize: 48,
    marginBottom: 16,
  },
  signInTitle: {
    marginBottom: 8,
  },
  signInMessage: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    fontSize: 14,
    opacity: 0.8,
  },
  statItemWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    opacity: 0.8,
  },
  signInIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  showsList: {
    paddingHorizontal: 5,
    gap: 10,
    // backgroundColor: 'rgba(0,0,0,0.02)',
  },
  showsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    gap: 8,
  },
  statsText: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.8,
  },
  showItem: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  showItemContent: {
    padding: 16,
    gap: 4,
  },
  showStatus: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  showDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  showRating: {
    fontSize: 14,
  },
  showNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  showGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    gap: 12,
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupIconText: {
    fontSize: 16,
  },
  groupTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  groupCount: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    color: '#666',
  },
  segmentedContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    gap: 8,
  },
  segmentedControl: {
    width: '100%',
    height: 32,
  },
  countIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
  },
  filterPanel: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
  },
  sortOptions: {
    flex: 1,
  },
  sortOptionsContent: {
    paddingRight: 20,
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

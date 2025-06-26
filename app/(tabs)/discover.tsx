import { AndroidShowCard } from '@/components/AndroidShowCard';
import ShowCard from '@/components/ShowCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDbShow[]>([]);
  const [trendingShows, setTrendingShows] = useState<TMDbShow[]>([]);
  const [popularShows, setPopularShows] = useState<TMDbShow[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<TMDbShow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDiscoverData();
  }, []);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const results = await tmdbService.searchShows(searchQuery.trim());
      setSearchResults(results.results);
    } catch (error) {
      console.error('Error searching shows:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, performSearch]);

  const loadDiscoverData = async () => {
    try {
      setIsLoading(true);
      const [trending, popular, topRated] = await Promise.all([
        tmdbService.getTrendingShows('week'),
        tmdbService.getPopularShows(1),
        tmdbService.getTopRatedShows(1),
      ]);

      setTrendingShows(trending.results.slice(0, 10));
      setPopularShows(popular.results.slice(0, 10));
      setTopRatedShows(topRated.results.slice(0, 10));
    } catch (error) {
      console.error('Error loading discover data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowPress = (showIdOrShow: number | TMDbShow) => {
    const showId = typeof showIdOrShow === 'number' ? showIdOrShow : showIdOrShow.id;
    router.push(`/show/${showId}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  // Create sections for the FlatList
  const createSections = () => {
    const sections = [];

    if (searchQuery.trim()) {
      if (isSearching) {
        sections.push({
          type: 'searching',
          data: [],
        });
      } else if (searchResults.length === 0) {
        sections.push({
          type: 'no_results',
          data: [],
          query: searchQuery,
        });
      } else {
        sections.push({
          type: 'search_results',
          title: `Search Results (${searchResults.length})`,
          data: searchResults,
        });
      }
    } else {
      // Browse sections
      if (trendingShows.length > 0) {
        sections.push({
          type: 'horizontal_list',
          title: 'Trending This Week',
          data: trendingShows,
        });
      }
      
      if (popularShows.length > 0) {
        sections.push({
          type: 'horizontal_list',
          title: 'Popular Shows',
          data: popularShows,
        });
      }
      
      if (topRatedShows.length > 0) {
        sections.push({
          type: 'horizontal_list',
          title: 'Top Rated',
          data: topRatedShows,
        });
      }

      sections.push({
        type: 'coming_soon',
        data: [],
      });
    }

    return sections;
  };

  const renderSearchGrid = (shows: TMDbShow[]) => {
    // Create rows of 3 items each for the search grid
    const rows = [];
    for (let i = 0; i < shows.length; i += 3) {
      rows.push(shows.slice(i, i + 3));
    }

    return (
      <View style={styles.searchSection}>
        <View style={styles.searchHeader}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Search Results ({shows.length})
          </ThemedText>
          <TouchableOpacity onPress={clearSearch}>
            <ThemedText style={styles.clearButton}>Clear</ThemedText>
          </TouchableOpacity>
        </View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.searchGrid}>
            {row.map((show) => {
              const ShowComponent = Platform.OS === 'android' ? AndroidShowCard : ShowCard;
              return (
                <View key={show.id} style={styles.searchGridItem}>
                  <ShowComponent show={show} onPress={handleShowPress} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderSectionItem = ({ item: section }: { item: any }) => {
    switch (section.type) {
      case 'searching':
        return (
          <ThemedView style={styles.searchSection}>
            <View style={styles.searchingContainer}>
              <IconSymbol name="magnifyingglass" size={16} color="#999" />
              <ThemedText style={styles.searchingText}>Searching...</ThemedText>
            </View>
          </ThemedView>
        );

      case 'no_results':
        return (
          <ThemedView style={styles.searchSection}>
            <ThemedText style={styles.noResultsText}>
              No shows found for &quot;{section.query}&quot;
            </ThemedText>
            <ThemedText style={styles.noResultsHint}>
              Try different keywords or browse trending shows below
            </ThemedText>
          </ThemedView>
        );

      case 'search_results':
        return renderSearchGrid(section.data);

      case 'horizontal_list':
        if (isLoading) {
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
        return (
          <View style={styles.horizontalSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <FlatList
              data={section.data}
              renderItem={({ item }) => (
                <ShowCard show={item} onPress={handleShowPress} />
              )}
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
            <ThemedText type="title">Discover</ThemedText>
            <ThemedText style={styles.subtitle}>
              Find your next favorite show
            </ThemedText>
          </View>
          
          {!isAuthenticated && (
            <View style={styles.authButtons}>
              <TouchableOpacity 
                style={[styles.authButton, styles.signInButton]} 
                onPress={handleSignIn}
              >
                <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.authButton, styles.signUpButton]} 
                onPress={handleSignUp}
              >
                <ThemedText style={styles.signUpButtonText}>Sign Up</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }
        ]}>
          <IconSymbol name="magnifyingglass" size={16} color={colorScheme === 'dark' ? '#999' : '#666'} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colorScheme === 'dark' ? '#fff' : '#000' }
            ]}
            placeholder="Search for TV shows..."
            placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <ThemedText style={styles.clearIcon}>✕</ThemedText>
            </TouchableOpacity>
          )}
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
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    gap: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  authButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  signUpButton: {
    backgroundColor: '#007AFF',
  },
  signInButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 40,
  },
  section: {
    gap: 8,
    marginTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearIcon: {
    fontSize: 16,
    opacity: 0.6,
    paddingHorizontal: 4,
  },
  searchSection: {
    padding: 16,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  searchingText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginVertical: 20,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noResultsHint: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  searchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  searchGridItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  horizontalSection: {
    marginBottom: 24,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  loadingText: {
    textAlign: 'center',
    opacity: 0.6,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  comingSoonSection: {
    margin: 16,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  featureList: {
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    opacity: 0.8,
  },
  bottomPadding: {
    height: 40,
  },
});
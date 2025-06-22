import ShowCard from '@/components/ShowCard';
import ShowList from '@/components/ShowList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
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
  }, [searchQuery]);

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

  const performSearch = async () => {
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
  };

  const handleShowPress = (show: TMDbShow) => {
    router.push(`/show/${show.id}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <ThemedView style={styles.searchSection}>
          <ThemedText style={styles.searchingText}>🔍 Searching...</ThemedText>
        </ThemedView>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <ThemedView style={styles.searchSection}>
          <ThemedText style={styles.noResultsText}>
            No shows found for "{searchQuery}"
          </ThemedText>
          <ThemedText style={styles.noResultsHint}>
            Try different keywords or browse trending shows below
          </ThemedText>
        </ThemedView>
      );
    }

    if (searchResults.length > 0) {
      return (
        <ThemedView style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Search Results ({searchResults.length})
            </ThemedText>
            <TouchableOpacity onPress={clearSearch}>
              <ThemedText style={styles.clearButton}>Clear</ThemedText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <ShowCard show={item} onPress={handleShowPress} />
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            columnWrapperStyle={styles.searchGrid}
            showsVerticalScrollIndicator={false}
          />
        </ThemedView>
      );
    }

    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Discover</ThemedText>
        <ThemedText style={styles.subtitle}>
          Find your next favorite show
        </ThemedText>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }
        ]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
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

      <ScrollView style={styles.content}>
        {/* Search Results */}
        {renderSearchResults()}

        {/* Browse Sections - Only show when not searching */}
        {!searchQuery.trim() && (
          <>
            <ShowList
              title="Trending This Week"
              shows={trendingShows}
              onShowPress={handleShowPress}
              loading={isLoading}
            />

            <ShowList
              title="Popular Shows"
              shows={popularShows}
              onShowPress={handleShowPress}
              loading={isLoading}
            />

            <ShowList
              title="Top Rated"
              shows={topRatedShows}
              onShowPress={handleShowPress}
              loading={isLoading}
            />

            {/* Coming Soon Features */}
            <ThemedView style={styles.comingSoonSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Coming Soon
              </ThemedText>
              <ThemedView style={styles.featureList}>
                <ThemedText style={styles.featureItem}>🎭 Genre filters</ThemedText>
                <ThemedText style={styles.featureItem}>📺 Network filters</ThemedText>
                <ThemedText style={styles.featureItem}>🎯 Personalized recommendations</ThemedText>
                <ThemedText style={styles.featureItem}>📅 New releases</ThemedText>
              </ThemedView>
            </ThemedView>
          </>
        )}

        <ThemedView style={styles.bottomPadding} />
      </ScrollView>
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
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
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
  },
  clearButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  searchGrid: {
    justifyContent: 'space-around',
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
    fontSize: 14,
    opacity: 0.8,
  },
  bottomPadding: {
    height: 40,
  },
});

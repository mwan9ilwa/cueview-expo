import { AndroidShowCard } from '@/components/AndroidShowCard';
import ShowCard from '@/components/ShowCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { tmdbService, TMDbShow } from '@/services/tmdb';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Platform,
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
      <View style={GlobalStyles.searchSection}>
        <View style={GlobalStyles.searchHeader}>
          <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
            Search Results ({shows.length})
          </ThemedText>
          <TouchableOpacity onPress={clearSearch}>
            <ThemedText style={GlobalStyles.clearButton}>Clear</ThemedText>
          </TouchableOpacity>
        </View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={GlobalStyles.searchGrid}>
            {row.map((show) => {
              const ShowComponent = Platform.OS === 'android' ? AndroidShowCard : ShowCard;
              return (
                <View key={show.id} style={GlobalStyles.searchGridItem}>
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
          <ThemedView style={GlobalStyles.searchSection}>
            <View style={GlobalStyles.searchingContainer}>
              <IconSymbol name="magnifyingglass" size={16} color="#999" />
              <ThemedText style={GlobalStyles.searchingText}>Searching...</ThemedText>
            </View>
          </ThemedView>
        );

      case 'no_results':
        return (
          <ThemedView style={GlobalStyles.searchSection}>
            <ThemedText style={GlobalStyles.noResultsText}>
              No shows found for &quot;{section.query}&quot;
            </ThemedText>
            <ThemedText style={GlobalStyles.noResultsHint}>
              Try different keywords or browse trending shows below
            </ThemedText>
          </ThemedView>
        );

      case 'search_results':
        return renderSearchGrid(section.data);

      case 'horizontal_list':
        if (isLoading) {
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
        return (
          <View style={GlobalStyles.horizontalSection}>
            <ThemedText type="defaultSemiBold" style={GlobalStyles.sectionTitle}>
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
            <ThemedText type="title">Discover</ThemedText>
            <ThemedText style={GlobalStyles.subtitle}>
              Find your next favorite show
            </ThemedText>
          </View>
          
          {!isAuthenticated && (
            <View style={GlobalStyles.authButtons}>
              <TouchableOpacity 
                style={[GlobalStyles.authButton, GlobalStyles.signInButton]} 
                onPress={handleSignIn}
              >
                <ThemedText style={GlobalStyles.signInButtonText}>Sign In</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[GlobalStyles.authButton, GlobalStyles.signUpButton]} 
                onPress={handleSignUp}
              >
                <ThemedText style={GlobalStyles.signUpButtonText}>Sign Up</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={GlobalStyles.searchContainer}>
        <View style={[
          GlobalStyles.searchInputContainer,
          { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }
        ]}>
          <IconSymbol name="magnifyingglass" size={16} color={colorScheme === 'dark' ? '#999' : '#666'} />
          <TextInput
            style={[
              GlobalStyles.searchInput,
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
              <ThemedText style={GlobalStyles.clearIcon}>✕</ThemedText>
            </TouchableOpacity>
          )}
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
      />
    </ThemedView>
  );
}


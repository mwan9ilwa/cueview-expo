import ShowCard from '@/components/ShowCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbShow } from '@/services/tmdb';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

interface ShowListProps {
  title: string;
  shows: TMDbShow[];
  onShowPress: (show: TMDbShow) => void;
  showProgress?: boolean;
  loading?: boolean;
  error?: string;
}

export default function ShowList({ 
  title, 
  shows, 
  onShowPress, 
  showProgress = false, 
  loading = false,
  error 
}: ShowListProps) {
  const renderShow = ({ item }: { item: TMDbShow }) => (
    <ShowCard 
      show={item} 
      onPress={onShowPress}
      showProgress={showProgress}
      progress={showProgress ? Math.random() * 100 : 0} // TODO: Get real progress from user data
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        {loading ? '📱 Loading shows...' : error ? `❌ ${error}` : '📺 No shows available'}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      
      {shows.length > 0 ? (
        <FlatList
          data={shows}
          renderItem={renderShow}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        renderEmptyState()
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
  },
});

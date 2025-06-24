import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { analyticsService } from '@/services/analytics';
import { UserShowWithDetails } from '@/types';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

interface AnalyticsDashboardProps {
  userShows: UserShowWithDetails[];
}

const { width: screenWidth } = Dimensions.get('window');

export function AnalyticsDashboard({ userShows }: AnalyticsDashboardProps) {
  const { colors, isDark } = useTheme();
  
  const stats = useMemo(() => {
    return analyticsService.calculateWatchStatistics(userShows);
  }, [userShows]);

  if (userShows.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <IconSymbol name="chart.bar.fill" size={48} color={colors.icon} />
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          No Analytics Yet
        </ThemedText>
        <ThemedText style={styles.emptyDescription}>
          Start watching shows to see your personalized analytics and insights!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overview Stats */}
      <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Your Watch Stats
        </ThemedText>
        
        <View style={styles.statsGrid}>
          <StatCard
            icon="tv.fill"
            title="Shows"
            value={stats.totalShows.toString()}
            subtitle="in library"
            color="#007AFF"
          />
          <StatCard
            icon="play.circle.fill"
            title="Episodes"
            value={stats.totalEpisodes.toString()}
            subtitle="watched"
            color="#34C759"
          />
          <StatCard
            icon="clock.fill"
            title="Watch Time"
            value={analyticsService.formatWatchTime(stats.totalWatchTimeMinutes)}
            subtitle="total"
            color="#FF9500"
          />
          <StatCard
            icon="star.fill"
            title="Rating"
            value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            subtitle="average"
            color="#FFD60A"
          />
        </View>
      </ThemedView>

      {/* Status Breakdown */}
      <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Library Breakdown
        </ThemedText>
        
        <View style={styles.statusGrid}>
          <StatusCard
            icon="tv.fill"
            title="Watching"
            count={stats.statusBreakdown.watching}
            color="#34C759"
          />
          <StatusCard
            icon="plus.circle.fill"
            title="Watchlist"
            count={stats.statusBreakdown['want-to-watch']}
            color="#FF9500"
          />
          <StatusCard
            icon="checkmark.circle.fill"
            title="Completed"
            count={stats.statusBreakdown.watched}
            color="#007AFF"
          />
        </View>
      </ThemedView>

      {/* Viewing Habits */}
      <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Viewing Habits
        </ThemedText>
        
        <View style={styles.habitsContainer}>
          <HabitItem
            icon="flame.fill"
            title="Watch Streak"
            value={`${stats.watchStreak} ${stats.watchStreak === 1 ? 'day' : 'days'}`}
            color="#FF3B30"
          />
          <HabitItem
            icon="calendar.fill"
            title="Most Active Day"
            value={stats.mostWatchedDay}
            color="#5856D6"
          />
          <HabitItem
            icon="chart.line.uptrend.xyaxis"
            title="Weekly Average"
            value={`${stats.averageEpisodesPerWeek} episodes`}
            color="#30D158"
          />
        </View>
      </ThemedView>

      {/* Top Shows */}
      {(stats.highestRatedShow || stats.longestShow || stats.mostRecentShow) && (
        <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Show Highlights
          </ThemedText>
          
          <View style={styles.highlightsContainer}>
            {stats.highestRatedShow && (
              <ShowHighlight
                icon="star.fill"
                title="Highest Rated"
                showName={stats.highestRatedShow.showDetails?.name || 'Unknown'}
                value={`${stats.highestRatedShow.rating}/5`}
                color="#FFD60A"
              />
            )}
            {stats.longestShow && (
              <ShowHighlight
                icon="tv.fill"
                title="Longest Show"
                showName={stats.longestShow.showDetails?.name || 'Unknown'}
                value={`${stats.longestShow.showDetails?.number_of_episodes || 0} episodes`}
                color="#007AFF"
              />
            )}
            {stats.mostRecentShow && (
              <ShowHighlight
                icon="clock.fill"
                title="Latest Addition"
                showName={stats.mostRecentShow.showDetails?.name || 'Unknown'}
                value={stats.mostRecentShow.addedAt.toLocaleDateString()}
                color="#34C759"
              />
            )}
          </View>
        </ThemedView>
      )}

      {/* Genre Preferences */}
      {stats.genreBreakdown.length > 0 && (
        <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Favorite Genres
          </ThemedText>
          
          <View style={styles.genresContainer}>
            {stats.genreBreakdown.slice(0, 6).map((genre, index) => (
              <GenreCard
                key={genre.genre}
                genre={genre.genre}
                count={genre.count}
                percentage={genre.percentage}
                color={getGenreColor(index)}
              />
            ))}
          </View>
        </ThemedView>
      )}

      {/* Achievements */}
      {stats.achievements.length > 0 && (
        <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Achievements
          </ThemedText>
          
          <View style={styles.achievementsContainer}>
            {stats.achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </View>
        </ThemedView>
      )}

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <ThemedView style={[styles.section, { backgroundColor: isDark ? colors.card : colors.background }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Activity
          </ThemedText>
          
          <View style={styles.activityContainer}>
            {stats.recentActivity.slice(0, 10).map((activity, index) => (
              <ActivityItem
                key={`${activity.showName}-${activity.date.getTime()}-${index}`}
                activity={activity}
              />
            ))}
          </View>
        </ThemedView>
      )}
    </ScrollView>
  );
}

// Helper Components

function StatCard({ icon, title, value, subtitle, color }: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[styles.statCard, { 
      backgroundColor: isDark ? colors.card : 'white',
      borderColor: isDark ? colors.border : '#f0f0f0',
    }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon as any} size={20} color={color} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText style={styles.statTitle}>{title}</ThemedText>
      <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>
    </View>
  );
}

function StatusCard({ icon, title, count, color }: {
  icon: string;
  title: string;
  count: number;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[styles.statusCard, { 
      backgroundColor: isDark ? colors.card : 'white',
      borderColor: isDark ? colors.border : '#f0f0f0',
    }]}>
      <View style={[styles.statusIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon as any} size={18} color={color} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.statusCount}>
        {count}
      </ThemedText>
      <ThemedText style={styles.statusTitle}>{title}</ThemedText>
    </View>
  );
}

function HabitItem({ icon, title, value, color }: {
  icon: string;
  title: string;
  value: string;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[styles.habitItem, { 
      backgroundColor: isDark ? colors.card : 'white',
      borderColor: isDark ? colors.border : '#f0f0f0',
    }]}>
      <View style={[styles.habitIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon as any} size={16} color={color} />
      </View>
      <View style={styles.habitContent}>
        <ThemedText style={styles.habitTitle}>{title}</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.habitValue}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function ShowHighlight({ icon, title, showName, value, color }: {
  icon: string;
  title: string;
  showName: string;
  value: string;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[styles.highlightItem, { 
      backgroundColor: isDark ? colors.card : 'white',
      borderColor: isDark ? colors.border : '#f0f0f0',
    }]}>
      <View style={[styles.highlightIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon as any} size={16} color={color} />
      </View>
      <View style={styles.highlightContent}>
        <ThemedText style={styles.highlightTitle}>{title}</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.highlightShow} numberOfLines={1}>
          {showName}
        </ThemedText>
        <ThemedText style={styles.highlightValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

function GenreCard({ genre, count, percentage, color }: {
  genre: string;
  count: number;
  percentage: number;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[styles.genreCard, { 
      backgroundColor: isDark ? colors.card : 'white',
      borderColor: isDark ? colors.border : '#f0f0f0',
    }]}>
      <View style={[styles.genreBar, { backgroundColor: color + '30' }]}>
        <View 
          style={[
            styles.genreProgress, 
            { 
              backgroundColor: color,
              width: `${Math.max(10, percentage)}%` // Minimum 10% width for very small percentages
            }
          ]} 
        />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.genreName} numberOfLines={1}>
        {genre}
      </ThemedText>
      <ThemedText style={styles.genreStats}>
        {count} shows ({percentage}%)
      </ThemedText>
    </View>
  );
}

function AchievementCard({ achievement }: {
  achievement: {
    id: string;
    title: string;
    description: string;
    unlockedAt?: Date;
    progress: number;
  };
}) {
  const { colors, isDark } = useTheme();
  const isUnlocked = achievement.unlockedAt !== undefined;
  
  return (
    <View style={[styles.achievementCard, { 
      backgroundColor: isDark ? colors.card : 'white',
      borderColor: isDark ? colors.border : '#f0f0f0',
      opacity: isUnlocked ? 1 : 0.7,
    }]}>
      <View style={[
        styles.achievementIcon, 
        { 
          backgroundColor: isUnlocked ? '#FFD60A20' : colors.border + '40'
        }
      ]}>
        <IconSymbol 
          name={isUnlocked ? "trophy.fill" : "trophy"} 
          size={20} 
          color={isUnlocked ? '#FFD60A' : colors.icon} 
        />
      </View>
      <View style={styles.achievementContent}>
        <ThemedText type="defaultSemiBold" style={[
          styles.achievementTitle,
          { color: isUnlocked ? colors.text : colors.icon }
        ]}>
          {achievement.title}
        </ThemedText>
        <ThemedText style={[
          styles.achievementDescription,
          { color: isUnlocked ? colors.text : colors.icon }
        ]}>
          {achievement.description}
        </ThemedText>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: isUnlocked ? '#34C759' : '#007AFF',
                width: `${achievement.progress}%`
              }
            ]} 
          />
        </View>
        <ThemedText style={styles.progressText}>
          {achievement.progress}% {isUnlocked && '🎉'}
        </ThemedText>
      </View>
    </View>
  );
}

function ActivityItem({ activity }: {
  activity: {
    showName: string;
    episodeName?: string;
    action: 'started' | 'completed' | 'watched_episode' | 'rewatched';
    date: Date;
  };
}) {
  const { colors } = useTheme();
  
  const getActivityIcon = () => {
    switch (activity.action) {
      case 'started': return 'play.circle.fill';
      case 'completed': return 'checkmark.circle.fill';
      case 'watched_episode': return 'tv.fill';
      case 'rewatched': return 'arrow.clockwise.circle.fill';
      default: return 'circle.fill';
    }
  };
  
  const getActivityColor = () => {
    switch (activity.action) {
      case 'started': return '#34C759';
      case 'completed': return '#007AFF';
      case 'watched_episode': return '#FF9500';
      case 'rewatched': return '#5856D6';
      default: return colors.icon;
    }
  };
  
  const getActivityText = () => {
    switch (activity.action) {
      case 'started': return 'Started watching';
      case 'completed': return 'Completed';
      case 'watched_episode': return 'Watched';
      case 'rewatched': return 'Rewatched';
      default: return 'Activity';
    }
  };
  
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: getActivityColor() + '20' }]}>
        <IconSymbol name={getActivityIcon() as any} size={14} color={getActivityColor()} />
      </View>
      <View style={styles.activityContent}>
        <ThemedText style={styles.activityText} numberOfLines={1}>
          {getActivityText()} <ThemedText type="defaultSemiBold">{activity.showName}</ThemedText>
          {activity.episodeName && (
            <ThemedText style={styles.activityEpisode}> {activity.episodeName}</ThemedText>
          )}
        </ThemedText>
        <ThemedText style={styles.activityDate}>
          {formatActivityDate(activity.date)}
        </ThemedText>
      </View>
    </View>
  );
}

// Helper functions

function getGenreColor(index: number): string {
  const colors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
    '#5856D6', '#AF52DE', '#FF2D92', '#30D158'
  ];
  return colors[index % colors.length];
}

function formatActivityDate(date: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 80) / 2, // Account for padding and gap
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCount: {
    fontSize: 18,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  habitsContainer: {
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  habitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  habitValue: {
    fontSize: 16,
  },
  highlightsContainer: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  highlightShow: {
    fontSize: 16,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    width: (screenWidth - 80) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  genreBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  genreProgress: {
    height: '100%',
    borderRadius: 3,
  },
  genreName: {
    fontSize: 14,
    marginBottom: 4,
  },
  genreStats: {
    fontSize: 12,
    opacity: 0.7,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  activityContainer: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityEpisode: {
    opacity: 0.7,
  },
  activityDate: {
    fontSize: 12,
    opacity: 0.6,
  },
});

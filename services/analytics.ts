import { ShowStatus, UserShowWithDetails, WatchedEpisode } from '@/types';

export interface WatchStatistics {
  totalShows: number;
  totalEpisodes: number;
  totalWatchTimeMinutes: number;
  totalWatchTimeHours: number;
  averageRating: number;
  
  // Status breakdown
  statusBreakdown: Record<ShowStatus, number>;
  
  // Time-based stats
  watchStreak: number; // Days of consecutive watching
  mostWatchedDay: string; // Day of week
  averageEpisodesPerWeek: number;
  
  // Show-specific stats
  longestShow: UserShowWithDetails | null;
  shortestShow: UserShowWithDetails | null;
  highestRatedShow: UserShowWithDetails | null;
  mostRecentShow: UserShowWithDetails | null;
  oldestShow: UserShowWithDetails | null;
  
  // Genre preferences
  genreBreakdown: { genre: string; count: number; percentage: number }[];
  
  // Recent activity
  recentActivity: {
    showName: string;
    episodeName?: string;
    action: 'started' | 'completed' | 'watched_episode' | 'rewatched';
    date: Date;
  }[];
  
  // Monthly/weekly trends
  monthlyStats: {
    month: string;
    episodesWatched: number;
    showsStarted: number;
    showsCompleted: number;
    watchTimeMinutes: number;
  }[];
  
  // Achievements/milestones
  achievements: {
    id: string;
    title: string;
    description: string;
    unlockedAt?: Date;
    progress: number; // 0-100
  }[];
}

export interface ShowAnalytics {
  show: UserShowWithDetails;
  progressPercentage: number;
  episodesRemaining: number;
  estimatedTimeToComplete: number; // minutes
  watchingPace: 'slow' | 'normal' | 'fast' | 'binge';
  lastWatchedDate?: Date;
  daysSinceLastWatch: number;
  episodeRatings: WatchedEpisode[];
  averageEpisodeRating: number;
  rewatchCount: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Calculate comprehensive watch statistics for a user
   */
  public calculateWatchStatistics(userShows: UserShowWithDetails[]): WatchStatistics {
    
    // Basic counts
    const totalShows = userShows.length;
    const totalEpisodes = userShows.reduce((sum, show) => sum + show.watchedEpisodes.length, 0);
    const totalWatchTimeMinutes = userShows.reduce((sum, show) => sum + show.totalWatchTimeMinutes, 0);
    const totalWatchTimeHours = Math.round(totalWatchTimeMinutes / 60 * 10) / 10;
    
    // Average rating
    const ratedShows = userShows.filter(show => show.rating);
    const averageRating = ratedShows.length > 0 
      ? ratedShows.reduce((sum, show) => sum + (show.rating || 0), 0) / ratedShows.length
      : 0;
    
    // Status breakdown
    const statusBreakdown: Record<ShowStatus, number> = {
      'watching': 0,
      'want-to-watch': 0,
      'watched': 0,
      'on-hold': 0,
      'dropped': 0,
    };
    
    userShows.forEach(show => {
      statusBreakdown[show.status]++;
    });
    
    // Calculate watch streak (simplified - consecutive days with watch activity)
    const watchStreak = this.calculateWatchStreak(userShows);
    
    // Most watched day of week
    const mostWatchedDay = this.getMostWatchedDay(userShows);
    
    // Average episodes per week (last 4 weeks)
    const averageEpisodesPerWeek = this.calculateAverageEpisodesPerWeek(userShows);
    
    // Show extremes
    const longestShow = this.getLongestShow(userShows);
    const shortestShow = this.getShortestShow(userShows);
    const highestRatedShow = this.getHighestRatedShow(userShows);
    const mostRecentShow = this.getMostRecentShow(userShows);
    const oldestShow = this.getOldestShow(userShows);
    
    // Genre breakdown
    const genreBreakdown = this.calculateGenreBreakdown(userShows);
    
    // Recent activity
    const recentActivity = this.getRecentActivity(userShows);
    
    // Monthly stats (last 12 months)
    const monthlyStats = this.calculateMonthlyStats(userShows);
    
    // Achievements
    const achievements = this.calculateAchievements(userShows, {
      totalShows,
      totalEpisodes,
      totalWatchTimeHours,
      watchStreak,
    });
    
    return {
      totalShows,
      totalEpisodes,
      totalWatchTimeMinutes,
      totalWatchTimeHours,
      averageRating,
      statusBreakdown,
      watchStreak,
      mostWatchedDay,
      averageEpisodesPerWeek,
      longestShow,
      shortestShow,
      highestRatedShow,
      mostRecentShow,
      oldestShow,
      genreBreakdown,
      recentActivity,
      monthlyStats,
      achievements,
    };
  }
  
  /**
   * Get detailed analytics for a specific show
   */
  public getShowAnalytics(show: UserShowWithDetails): ShowAnalytics {
    const totalEpisodes = show.showDetails?.number_of_episodes || 0;
    const watchedCount = show.watchedEpisodes.length;
    const progressPercentage = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0;
    const episodesRemaining = Math.max(0, totalEpisodes - watchedCount);
    
    // Estimate time to complete (assuming 45min per episode average)
    const averageEpisodeLength = 45;
    const estimatedTimeToComplete = episodesRemaining * averageEpisodeLength;
    
    // Determine watching pace based on recent activity
    const watchingPace = this.calculateWatchingPace(show);
    
    // Last watched date
    const lastWatchedDate = show.lastWatchedAt;
    const daysSinceLastWatch = lastWatchedDate 
      ? Math.floor((Date.now() - lastWatchedDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    // Episode ratings
    const episodeRatings = show.watchedEpisodes.filter(ep => ep.rating);
    const averageEpisodeRating = episodeRatings.length > 0
      ? episodeRatings.reduce((sum, ep) => sum + (ep.rating || 0), 0) / episodeRatings.length
      : 0;
    
    // Rewatch count
    const rewatchCount = show.watchedEpisodes.filter(ep => ep.rewatch).length;
    
    return {
      show,
      progressPercentage,
      episodesRemaining,
      estimatedTimeToComplete,
      watchingPace,
      lastWatchedDate,
      daysSinceLastWatch,
      episodeRatings: show.watchedEpisodes,
      averageEpisodeRating,
      rewatchCount,
    };
  }
  
  /**
   * Format watch time into human readable string
   */
  public formatWatchTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      const remainingDays = days % 30;
      return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`;
    } else if (weeks > 0) {
      const remainingDays = days % 7;
      return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
    } else if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    } else if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }
  
  // Private helper methods
  
  private calculateWatchStreak(userShows: UserShowWithDetails[]): number {
    // Simplified streak calculation - count consecutive days with watch activity
    const allWatchDates = userShows
      .flatMap(show => show.watchedEpisodes.map(ep => ep.watchedAt))
      .sort((a, b) => b.getTime() - a.getTime());
    
    if (allWatchDates.length === 0) return 0;
    
    let streak = 1;
    let currentDate = new Date(allWatchDates[0]);
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < allWatchDates.length; i++) {
      const watchDate = new Date(allWatchDates[i]);
      watchDate.setHours(0, 0, 0, 0);
      
      const diffDays = (currentDate.getTime() - watchDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
        currentDate = watchDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    
    return streak;
  }
  
  private getMostWatchedDay(userShows: UserShowWithDetails[]): string {
    const dayCount: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    userShows.forEach(show => {
      show.watchedEpisodes.forEach(episode => {
        const day = dayNames[episode.watchedAt.getDay()];
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
    });
    
    return Object.entries(dayCount).reduce((a, b) => a[1] > b[1] ? a : b, ['Sunday', 0])[0];
  }
  
  private calculateAverageEpisodesPerWeek(userShows: UserShowWithDetails[]): number {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentEpisodes = userShows
      .flatMap(show => show.watchedEpisodes)
      .filter(ep => ep.watchedAt >= fourWeeksAgo);
    
    return Math.round((recentEpisodes.length / 4) * 10) / 10;
  }
  
  private getLongestShow(userShows: UserShowWithDetails[]): UserShowWithDetails | null {
    return userShows.reduce((longest, show) => {
      const showEpisodes = show.showDetails?.number_of_episodes || 0;
      const longestEpisodes = longest?.showDetails?.number_of_episodes || 0;
      return showEpisodes > longestEpisodes ? show : longest;
    }, null as UserShowWithDetails | null);
  }
  
  private getShortestShow(userShows: UserShowWithDetails[]): UserShowWithDetails | null {
    const completedShows = userShows.filter(show => show.status === 'watched');
    if (completedShows.length === 0) return null;
    
    return completedShows.reduce((shortest, show) => {
      const showEpisodes = show.showDetails?.number_of_episodes || Infinity;
      const shortestEpisodes = shortest?.showDetails?.number_of_episodes || Infinity;
      return showEpisodes < shortestEpisodes ? show : shortest;
    }, null as UserShowWithDetails | null);
  }
  
  private getHighestRatedShow(userShows: UserShowWithDetails[]): UserShowWithDetails | null {
    const ratedShows = userShows.filter(show => show.rating);
    if (ratedShows.length === 0) return null;
    
    return ratedShows.reduce((highest, show) => {
      const showRating = show.rating || 0;
      const highestRating = highest?.rating || 0;
      return showRating > highestRating ? show : highest;
    });
  }
  
  private getMostRecentShow(userShows: UserShowWithDetails[]): UserShowWithDetails | null {
    if (userShows.length === 0) return null;
    
    return userShows.reduce((recent, show) => {
      return show.addedAt > recent.addedAt ? show : recent;
    });
  }
  
  private getOldestShow(userShows: UserShowWithDetails[]): UserShowWithDetails | null {
    if (userShows.length === 0) return null;
    
    return userShows.reduce((oldest, show) => {
      return show.addedAt < oldest.addedAt ? show : oldest;
    });
  }
  
  private calculateGenreBreakdown(userShows: UserShowWithDetails[]): { genre: string; count: number; percentage: number }[] {
    const genreCount: Record<string, number> = {};
    let totalGenres = 0;
    
    userShows.forEach(show => {
      if (show.showDetails?.genres) {
        show.showDetails.genres.forEach(genre => {
          genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
          totalGenres++;
        });
      }
    });
    
    return Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalGenres) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 genres
  }
  
  private getRecentActivity(userShows: UserShowWithDetails[]): {
    showName: string;
    episodeName?: string;
    action: 'started' | 'completed' | 'watched_episode' | 'rewatched';
    date: Date;
  }[] {
    const activities: {
      showName: string;
      episodeName?: string;
      action: 'started' | 'completed' | 'watched_episode' | 'rewatched';
      date: Date;
    }[] = [];
    
    userShows.forEach(show => {
      const showName = show.showDetails?.name || 'Unknown Show';
      
      // Show started
      if (show.startedWatchingAt) {
        activities.push({
          showName,
          action: 'started',
          date: show.startedWatchingAt,
        });
      }
      
      // Show completed
      if (show.completedAt) {
        activities.push({
          showName,
          action: 'completed',
          date: show.completedAt,
        });
      }
      
      // Episodes watched
      show.watchedEpisodes.forEach(episode => {
        activities.push({
          showName,
          episodeName: `S${episode.seasonNumber}E${episode.episodeNumber}`,
          action: episode.rewatch ? 'rewatched' : 'watched_episode',
          date: episode.watchedAt,
        });
      });
    });
    
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20); // Last 20 activities
  }
  
  private calculateMonthlyStats(userShows: UserShowWithDetails[]): {
    month: string;
    episodesWatched: number;
    showsStarted: number;
    showsCompleted: number;
    watchTimeMinutes: number;
  }[] {
    const months: {
      month: string;
      episodesWatched: number;
      showsStarted: number;
      showsCompleted: number;
      watchTimeMinutes: number;
    }[] = [];
    
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthStats = {
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        episodesWatched: 0,
        showsStarted: 0,
        showsCompleted: 0,
        watchTimeMinutes: 0,
      };
      
      userShows.forEach(show => {
        // Count episodes watched in this month
        show.watchedEpisodes.forEach(episode => {
          if (episode.watchedAt >= monthDate && episode.watchedAt < nextMonth) {
            monthStats.episodesWatched++;
            monthStats.watchTimeMinutes += 45; // Assume 45min per episode
          }
        });
        
        // Count shows started in this month
        if (show.startedWatchingAt && 
            show.startedWatchingAt >= monthDate && 
            show.startedWatchingAt < nextMonth) {
          monthStats.showsStarted++;
        }
        
        // Count shows completed in this month
        if (show.completedAt && 
            show.completedAt >= monthDate && 
            show.completedAt < nextMonth) {
          monthStats.showsCompleted++;
        }
      });
      
      months.push(monthStats);
    }
    
    return months;
  }
  
  private calculateAchievements(userShows: UserShowWithDetails[], stats: {
    totalShows: number;
    totalEpisodes: number;
    totalWatchTimeHours: number;
    watchStreak: number;
  }): {
    id: string;
    title: string;
    description: string;
    unlockedAt?: Date;
    progress: number;
  }[] {
    const achievements = [
      {
        id: 'first_show',
        title: 'Getting Started',
        description: 'Add your first show to the library',
        target: 1,
        current: stats.totalShows,
      },
      {
        id: 'show_collector',
        title: 'Show Collector',
        description: 'Add 10 or more shows to your library',
        target: 10,
        current: stats.totalShows,
      },
      {
        id: 'binge_watcher',
        title: 'Binge Watcher',
        description: 'Watch 100 or more episodes',
        target: 100,
        current: stats.totalEpisodes,
      },
      {
        id: 'couch_potato',
        title: 'Couch Potato',
        description: 'Watch 100+ hours of content',
        target: 100,
        current: stats.totalWatchTimeHours,
      },
      {
        id: 'streak_master',
        title: 'Consistency King',
        description: 'Maintain a 7-day watch streak',
        target: 7,
        current: stats.watchStreak,
      },
    ];
    
    return achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      unlockedAt: achievement.current >= achievement.target ? new Date() : undefined,
      progress: Math.min(100, Math.round((achievement.current / achievement.target) * 100)),
    }));
  }
  
  private calculateWatchingPace(show: UserShowWithDetails): 'slow' | 'normal' | 'fast' | 'binge' {
    const recentEpisodes = show.watchedEpisodes
      .filter(ep => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return ep.watchedAt >= weekAgo;
      });
    
    const episodesThisWeek = recentEpisodes.length;
    
    if (episodesThisWeek >= 10) return 'binge';
    if (episodesThisWeek >= 5) return 'fast';
    if (episodesThisWeek >= 2) return 'normal';
    return 'slow';
  }
}

export const analyticsService = AnalyticsService.getInstance();

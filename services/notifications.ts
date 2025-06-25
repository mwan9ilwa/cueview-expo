import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationContent {
  title: string;
  body: string;
  data?: { [key: string]: any };
}

export interface ScheduledNotification {
  id: string;
  showId: number;
  showName: string;
  season: number;
  episode: number;
  airDate: Date;
  notificationId?: string;
}

class NotificationService {
  private scheduledNotifications: ScheduledNotification[] = [];

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'CueView Episodes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for an upcoming episode
   */
  async scheduleEpisodeNotification(
    showId: number,
    showName: string,
    season: number,
    episode: number,
    airDate: Date
  ): Promise<string | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('No notification permissions');
        return null;
      }

      // Schedule notification 30 minutes before air time
      const notificationDate = new Date(airDate.getTime() - 30 * 60 * 1000);
      
      // Don't schedule notifications for past dates
      if (notificationDate <= new Date()) {
        console.log('Not scheduling notification for past date');
        return null;
      }

      const content: NotificationContent = {
        title: `${showName} is starting soon!`,
        body: `Season ${season}, Episode ${episode} airs in 30 minutes`,
        data: {
          showId,
          showName,
          season,
          episode,
          type: 'episode_reminder',
        },
      };

      const secondsUntilNotification = Math.max(1, Math.floor((notificationDate.getTime() - Date.now()) / 1000));
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilNotification,
          repeats: false,
        },
      });

      // Store the scheduled notification
      const scheduledNotification: ScheduledNotification = {
        id: `${showId}-${season}-${episode}`,
        showId,
        showName,
        season,
        episode,
        airDate,
        notificationId,
      };

      this.scheduledNotifications.push(scheduledNotification);
      console.log('Scheduled notification:', scheduledNotification);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Remove from our tracking
      this.scheduledNotifications = this.scheduledNotifications.filter(
        notification => notification.notificationId !== notificationId
      );
      
      console.log('Cancelled notification:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific show
   */
  async cancelShowNotifications(showId: number): Promise<void> {
    const showNotifications = this.scheduledNotifications.filter(
      notification => notification.showId === showId
    );

    for (const notification of showNotifications) {
      if (notification.notificationId) {
        await this.cancelNotification(notification.notificationId);
      }
    }
  }

  /**
   * Get all scheduled notifications
   */
  getScheduledNotifications(): ScheduledNotification[] {
    return [...this.scheduledNotifications];
  }

  /**
   * Send an immediate notification (for testing)
   */
  async sendImmediateNotification(content: NotificationContent): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // Send immediately
    });
  }

  /**
   * Schedule notifications for all shows in user's watching list
   */
  async scheduleNotificationsForWatchingShows(watchingShows: any[]): Promise<void> {
    console.log('Scheduling notifications for', watchingShows.length, 'shows');
    console.log('First show structure:', JSON.stringify(watchingShows[0], null, 2));
    
    for (const userShow of watchingShows) {
      // In a real app, you would fetch upcoming episode data from TMDb API
      // For now, we'll create mock upcoming episodes
      const mockEpisodes = this.generateMockUpcomingEpisodes(userShow);
      
      for (const episode of mockEpisodes) {
        await this.scheduleEpisodeNotification(
          episode.showId,
          episode.showName,
          episode.season,
          episode.episode,
          episode.airDate
        );
      }
    }
  }

  /**
   * Generate mock upcoming episodes for testing
   * In production, this would be replaced with real TMDb API data
   */
  private generateMockUpcomingEpisodes(userShow: any) {
    // Debug logging to understand the userShow structure
    console.log('generateMockUpcomingEpisodes userShow:', JSON.stringify(userShow, null, 2));
    console.log('userShow.showId type:', typeof userShow.showId, 'value:', userShow.showId);
    console.log('userShow.id type:', typeof userShow.id, 'value:', userShow.id);
    
    const episodes = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const airDate = new Date();
      airDate.setDate(today.getDate() + (i * 7)); // Weekly episodes
      
      episodes.push({
        showId: userShow.showId, // Use showId directly (it's already a number)
        showName: userShow.showDetails?.name || 'Unknown Show',
        season: 1,
        episode: i,
        airDate,
      });
    }
    
    return episodes;
  }

  /**
   * Clear all scheduled notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      console.log('Cleared all notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

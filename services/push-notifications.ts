import { UserShowWithDetails } from '@/types';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { realTimeEpisodeService, UpcomingEpisode } from './real-time-episodes';

export interface PushNotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export interface NotificationPreferences {
  newEpisodes: boolean;
  newSeasons: boolean;
  recommendations: boolean;
  weeklyDigest: boolean;
  beforeAiring: number; // minutes before airing to send notification
  smartScheduling: boolean; // Schedule based on user's viewing patterns
  episodeReminderTime: string; // Time of day to send reminders (HH:MM)
  seasonReminderTime: string; // Time for season premiere reminders
}

export interface AdvancedNotificationData extends Record<string, unknown> {
  type: 'new_episode' | 'new_season' | 'weekly_digest' | 'show_reminder' | 'binge_suggestion';
  showId: number;
  showName: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName?: string;
  airDate?: string;
  stillPath?: string;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;
  private isInitialized = false;

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('episodes', {
          name: 'Episode Notifications',
          description: 'Notifications for new episodes and show updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('recommendations', {
          name: 'Recommendations',
          description: 'Show recommendations and personalized suggestions',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('digest', {
          name: 'Weekly Digest',
          description: 'Weekly summary of your watching activity',
          importance: Notifications.AndroidImportance.LOW,
          sound: 'default',
        });
      }

      this.isInitialized = true;
      console.log('✅ Push notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions from the user
   */
  public async requestPermissions(): Promise<PushNotificationPermissions> {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return {
          granted: false,
          canAskAgain: false,
          status: Notifications.PermissionStatus.DENIED,
        };
      }

      await this.initialize();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';

      if (granted) {
        await this.registerForPushNotifications();
      }

      return {
        granted,
        canAskAgain: finalStatus !== 'denied',
        status: finalStatus,
      };
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Notifications.PermissionStatus.DENIED,
      };
    }
  }

  /**
   * Register for push notifications and get push token
   */
  public async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      this.pushToken = pushTokenData.data;
      console.log('✅ Got push token:', this.pushToken);

      // TODO: Send this token to your backend server to store for the user
      // await sendPushTokenToServer(this.pushToken, userId);

      return this.pushToken;
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Get the current push token
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Schedule notifications for all watching shows
   */
  public async scheduleShowNotifications(
    userShows: UserShowWithDetails[],
    preferences: NotificationPreferences = {
      newEpisodes: true,
      newSeasons: true,
      recommendations: false,
      weeklyDigest: true,
      beforeAiring: 30, // 30 minutes before
      smartScheduling: false,
      episodeReminderTime: '18:00',
      seasonReminderTime: '10:00',
    }
  ): Promise<void> {
    try {
      // Clear existing notifications
      await this.cancelAllNotifications();

      const watchingShows = userShows.filter(show => show.status === 'watching');
      let notificationCount = 0;

      for (const userShow of watchingShows) {
        if (!userShow.showDetails) continue;

        // Schedule next episode notification if available
        if (preferences.newEpisodes) {
          const upcomingEpisode = await realTimeEpisodeService.getNextEpisodeForShow(userShow);
          if (upcomingEpisode) {
            const scheduled = await this.scheduleEpisodeNotification(upcomingEpisode, preferences.beforeAiring);
            if (scheduled) notificationCount++;
          }
        }

        // Schedule season notifications
        if (preferences.newSeasons) {
          const scheduled = await this.scheduleNewSeasonNotification(userShow);
          if (scheduled) notificationCount++;
        }
      }

      // Schedule weekly digest
      if (preferences.weeklyDigest) {
        await this.scheduleWeeklyDigest(userShows);
        notificationCount++;
      }

      console.log(`✅ Scheduled ${notificationCount} notifications for ${watchingShows.length} shows`);
    } catch (error) {
      console.error('❌ Error scheduling show notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule notification for an episode
   */
  private async scheduleEpisodeNotification(
    episode: UpcomingEpisode,
    minutesBefore: number = 30
  ): Promise<boolean> {
    try {
      const { showId, showName, airDate, episodeName } = episode;

      // Calculate notification time
      const notificationDate = new Date(airDate);
      notificationDate.setMinutes(notificationDate.getMinutes() - minutesBefore);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📺 New Episode Alert!',
          body: `${showName} - ${episodeName} airs in ${minutesBefore} minutes`,
          data: {
            type: 'new_episode',
            showId,
            showName,
            episodeId: `${episode.showId}-S${episode.seasonNumber}E${episode.episodeNumber}`,
          },
          sound: 'default',
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate 
        },
      });

      console.log(`📺 Scheduled episode notification for ${showName} - ${episodeName}:`, notificationId);
      return true;
    } catch (error) {
      console.error('❌ Error scheduling episode notification:', error);
      return false;
    }
  }

  /**
   * Schedule notification for new season
   */
  private async scheduleNewSeasonNotification(userShow: UserShowWithDetails): Promise<boolean> {
    try {
      const showName = userShow.showDetails?.name || 'Your Show';
      
      // For demo purposes, schedule a notification 48 hours from now
      const notificationDate = new Date();
      notificationDate.setHours(notificationDate.getHours() + 48);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 New Season Available!',
          body: `${showName} has a new season ready to watch`,
          data: {
            type: 'new_season',
            showId: userShow.showId,
            showName,
          },
          sound: 'default',
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate 
        },
      });

      console.log(`🎉 Scheduled season notification for ${showName}:`, notificationId);
      return true;
    } catch (error) {
      console.error('❌ Error scheduling season notification:', error);
      return false;
    }
  }

  /**
   * Schedule weekly digest notification
   */
  private async scheduleWeeklyDigest(userShows: UserShowWithDetails[]): Promise<void> {
    try {
      // Schedule for every Sunday at 9 AM
      const now = new Date();
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(9, 0, 0, 0);

      const watchingCount = userShows.filter(show => show.status === 'watching').length;
      const completedThisWeek = userShows.filter(show => 
        show.status === 'watched' && 
        show.completedAt && 
        (Date.now() - show.completedAt.getTime()) < 7 * 24 * 60 * 60 * 1000
      ).length;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Your Weekly Watch Summary',
          body: `You're watching ${watchingCount} shows and completed ${completedThisWeek} this week!`,
          data: {
            type: 'weekly_digest',
            watchingCount,
            completedThisWeek,
          },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          weekday: 1, // Sunday
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      console.log('📊 Scheduled weekly digest notification:', notificationId);
    } catch (error) {
      console.error('❌ Error scheduling weekly digest:', error);
    }
  }

  /**
   * Send immediate push notification
   */
  public async sendImmediateNotification(notification: {
    title: string;
    body: string;
    data?: any;
    sound?: string;
  }): Promise<void> {
    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
        },
        trigger: null, // Send immediately
      });

      console.log('📨 Sent immediate notification:', notificationId);
    } catch (error) {
      console.error('❌ Error sending immediate notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Cancelled all scheduled notifications');
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
      throw error;
    }
  }

  /**
   * Cancel specific notification
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('🗑️ Cancelled notification:', notificationId);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  public async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Setup notification listeners
   */
  public setupNotificationListeners(): {
    removeReceived: () => void;
    removeResponse: () => void;
  } {
    // Listener for when notification is received (app is foregrounded)
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      // Handle foreground notification display
    });

    // Listener for when user taps notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const { type, showId, showName } = response.notification.request.content.data;
      
      // Handle notification tap based on type
      switch (type) {
        case 'new_episode':
        case 'new_season':
          // Navigate to show details
          console.log(`Navigate to show ${showId}: ${showName}`);
          break;
        case 'weekly_digest':
          // Navigate to analytics/profile
          console.log('Navigate to analytics dashboard');
          break;
        case 'recommendation':
          // Navigate to discover
          console.log('Navigate to discover screen');
          break;
        default:
          console.log('Unknown notification type:', type);
      }
    });

    return {
      removeReceived: () => receivedSubscription.remove(),
      removeResponse: () => responseSubscription.remove(),
    };
  }

  /**
   * Test notification functionality
   */
  public async testNotification(): Promise<void> {
    try {
      await this.sendImmediateNotification({
        title: '🧪 Test Notification',
        body: 'This is a test notification from CueView!',
        data: { type: 'test' },
      });

      // Schedule a test notification for 5 seconds from now
      setTimeout(async () => {
        await this.sendImmediateNotification({
          title: '⏰ Delayed Test',
          body: 'This notification was sent 5 seconds after the first one',
          data: { type: 'test_delayed' },
        });
      }, 5000);

      console.log('🧪 Test notifications sent');
    } catch (error) {
      console.error('❌ Error sending test notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule notifications for real upcoming episodes
   */
  public async scheduleRealEpisodeNotifications(
    userId: string, 
    userShows: UserShowWithDetails[],
    preferences: NotificationPreferences = {
      newEpisodes: true,
      newSeasons: true,
      recommendations: false,
      weeklyDigest: true,
      beforeAiring: 30,
      smartScheduling: false,
      episodeReminderTime: '19:00',
      seasonReminderTime: '20:00',
    }
  ): Promise<void> {
    try {
      await this.initialize();
      
      // Clear existing episode notifications
      await this.clearEpisodeNotifications();
      
      for (const userShow of userShows) {
        try {
          // Get next episode for this show
          const nextEpisode = await realTimeEpisodeService.getNextEpisodeForShow(userShow);
          
          if (nextEpisode && preferences.newEpisodes) {
            await this.scheduleRealEpisodeNotification(nextEpisode, preferences);
          }
        } catch (error) {
          console.warn(`Failed to schedule notifications for show ${userShow.showId}:`, error);
        }
      }
      
      // Schedule weekly digest
      if (preferences.weeklyDigest) {
        await this.scheduleAdvancedWeeklyDigest(userId, userShows);
      }
      
      console.log(`✅ Scheduled real episode notifications for ${userShows.length} shows`);
    } catch (error) {
      console.error('❌ Error scheduling real episode notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule notification for a real upcoming episode
   */
  private async scheduleRealEpisodeNotification(
    episode: UpcomingEpisode,
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      const notificationTime = new Date(episode.airDate.getTime() - (preferences.beforeAiring * 60 * 1000));
      
      // Don't schedule notifications for past episodes
      if (notificationTime <= new Date()) {
        return false;
      }

      const title = preferences.smartScheduling 
        ? `🎬 ${episode.showName} is airing soon!`
        : `📺 New Episode Alert!`;
        
      const body = `${episode.showName} S${episode.seasonNumber}E${episode.episodeNumber}: "${episode.episodeName}" airs in ${preferences.beforeAiring} minutes`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'new_episode',
            showId: episode.showId,
            showName: episode.showName,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            episodeName: episode.episodeName,
            airDate: episode.airDate.toISOString(),
            stillPath: episode.stillPath,
          } as AdvancedNotificationData,
          sound: 'default',
          categoryIdentifier: 'episode_reminder',
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime 
        },
      });

      console.log(`📺 Scheduled real episode notification for ${episode.showName} S${episode.seasonNumber}E${episode.episodeNumber}:`, notificationId);
      return true;
    } catch (error) {
      console.error('❌ Error scheduling real episode notification:', error);
      return false;
    }
  }

  /**
   * Schedule daily episode check notifications
   */
  public async scheduleDailyEpisodeCheck(userId: string): Promise<void> {
    try {
      // Schedule a daily notification at 9 AM to check for episodes airing today
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Episodes Today',
          body: 'Check what episodes are airing today from your watched shows',
          data: {
            type: 'daily_check',
            userId,
          },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
      
      console.log('📅 Scheduled daily episode check notification');
    } catch (error) {
      console.error('❌ Error scheduling daily episode check:', error);
    }
  }

  /**
   * Clear episode-specific notifications
   */
  private async clearEpisodeNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;
        if (data?.type === 'new_episode' || data?.type === 'new_season') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error clearing episode notifications:', error);
    }
  }

  /**
   * Enhanced weekly digest with real data
   */
  private async scheduleAdvancedWeeklyDigest(userId: string, userShows: UserShowWithDetails[]): Promise<void> {
    try {
      const upcomingEpisodes = await realTimeEpisodeService.getUpcomingEpisodes(userId, 7);
      const watchingCount = userShows.filter(show => show.status === 'watching').length;
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Your Weekly Watch Summary',
          body: `You have ${upcomingEpisodes.length} episodes airing this week across ${watchingCount} shows`,
          data: {
            type: 'weekly_digest',
            watchingCount,
            upcomingCount: upcomingEpisodes.length,
            userId,
          },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          weekday: 1, // Sunday
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      console.log('📊 Scheduled enhanced weekly digest notification:', notificationId);
    } catch (error) {
      console.error('❌ Error scheduling enhanced weekly digest:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

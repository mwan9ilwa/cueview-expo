interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface WatchProvider {
  link: string;
  flatrate?: StreamingProvider[];
  rent?: StreamingProvider[];
  buy?: StreamingProvider[];
}

interface CountryWatchProviders {
  [countryCode: string]: WatchProvider;
}

interface StreamingAvailability {
  showId: number;
  showName: string;
  providers: CountryWatchProviders;
  lastUpdated: Date;
}

class StreamingIntegrationService {
  private static instance: StreamingIntegrationService;
  private cache: Map<number, StreamingAvailability> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): StreamingIntegrationService {
    if (!StreamingIntegrationService.instance) {
      StreamingIntegrationService.instance = new StreamingIntegrationService();
    }
    return StreamingIntegrationService.instance;
  }

  /**
   * Get streaming availability for a show
   */
  public async getStreamingAvailability(showId: number, region: string = 'US'): Promise<WatchProvider | null> {
    try {
      // Check cache first
      const cached = this.cache.get(showId);
      if (cached && (Date.now() - cached.lastUpdated.getTime()) < this.CACHE_DURATION) {
        return cached.providers[region] || null;
      }

      // Fetch from TMDb
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/watch/providers?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}`
      );

      if (!response.ok) {
        console.warn(`Failed to fetch streaming providers for show ${showId}`);
        return null;
      }

      const data = await response.json();
      
      // Cache the result
      const availability: StreamingAvailability = {
        showId,
        showName: '', // We don't have show name here, but it's not critical
        providers: data.results || {},
        lastUpdated: new Date(),
      };
      
      this.cache.set(showId, availability);
      
      return availability.providers[region] || null;
    } catch (error) {
      console.error(`Error fetching streaming availability for show ${showId}:`, error);
      return null;
    }
  }

  /**
   * Get popular streaming providers
   */
  public getPopularProviders(): { [key: string]: StreamingProvider } {
    return {
      netflix: {
        provider_id: 8,
        provider_name: 'Netflix',
        logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
        display_priority: 1,
      },
      hulu: {
        provider_id: 15,
        provider_name: 'Hulu',
        logo_path: '/giwM8XX4V2AQb9vsoN7yti82tKK.jpg',
        display_priority: 2,
      },
      amazon_prime: {
        provider_id: 119,
        provider_name: 'Amazon Prime Video',
        logo_path: '/68MNrwlkpF7WnmNPXLah69CR5cb.jpg',
        display_priority: 3,
      },
      disney_plus: {
        provider_id: 337,
        provider_name: 'Disney Plus',
        logo_path: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg',
        display_priority: 4,
      },
      apple_tv: {
        provider_id: 350,
        provider_name: 'Apple TV Plus',
        logo_path: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg',
        display_priority: 5,
      },
      hbo_max: {
        provider_id: 384,
        provider_name: 'HBO Max',
        logo_path: '/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg',
        display_priority: 6,
      },
      paramount_plus: {
        provider_id: 531,
        provider_name: 'Paramount Plus',
        logo_path: '/h5DcR0J2EESLitnhR8xLG1QymTE.jpg',
        display_priority: 7,
      },
    };
  }

  /**
   * Generate deep links to streaming services
   */
  public generateDeepLink(provider: StreamingProvider, showId: number, showName: string): string | null {
    const encodedShowName = encodeURIComponent(showName);
    
    switch (provider.provider_id) {
      case 8: // Netflix
        return `netflix://title/${showId}`;
      
      case 15: // Hulu
        return `hulu://search?query=${encodedShowName}`;
      
      case 119: // Amazon Prime
        return `https://www.primevideo.com/search/ref=atv_sr_sug_0?phrase=${encodedShowName}`;
      
      case 337: // Disney Plus
        return `https://www.disneyplus.com/search?q=${encodedShowName}`;
      
      case 350: // Apple TV Plus
        return `https://tv.apple.com/search?term=${encodedShowName}`;
      
      case 384: // HBO Max
        return `hbomax://search?query=${encodedShowName}`;
      
      case 531: // Paramount Plus
        return `https://www.paramountplus.com/search/?query=${encodedShowName}`;
      
      default:
        return null;
    }
  }

  /**
   * Get user's preferred streaming services (from user preferences)
   */
  public getUserPreferredProviders(userPreferences: string[]): StreamingProvider[] {
    const allProviders = this.getPopularProviders();
    return userPreferences
      .map(pref => allProviders[pref])
      .filter(Boolean)
      .sort((a, b) => a.display_priority - b.display_priority);
  }

  /**
   * Find best streaming option for user
   */
  public async findBestStreamingOption(
    showId: number, 
    showName: string,
    userPreferences: string[] = [],
    region: string = 'US'
  ): Promise<{
    provider: StreamingProvider;
    type: 'flatrate' | 'rent' | 'buy';
    deepLink: string | null;
  } | null> {
    try {
      const availability = await this.getStreamingAvailability(showId, region);
      if (!availability) return null;

      const userPreferred = this.getUserPreferredProviders(userPreferences);
      
      // Check flatrate (subscription) options first
      if (availability.flatrate) {
        for (const preferred of userPreferred) {
          const match = availability.flatrate.find(p => p.provider_id === preferred.provider_id);
          if (match) {
            return {
              provider: match,
              type: 'flatrate',
              deepLink: this.generateDeepLink(match, showId, showName),
            };
          }
        }
        
        // If no user preference match, return first flatrate option
        const firstOption = availability.flatrate[0];
        if (firstOption) {
          return {
            provider: firstOption,
            type: 'flatrate',
            deepLink: this.generateDeepLink(firstOption, showId, showName),
          };
        }
      }

      // Check rent options if no flatrate available
      if (availability.rent && availability.rent.length > 0) {
        const firstRent = availability.rent[0];
        return {
          provider: firstRent,
          type: 'rent',
          deepLink: this.generateDeepLink(firstRent, showId, showName),
        };
      }

      // Check buy options as last resort
      if (availability.buy && availability.buy.length > 0) {
        const firstBuy = availability.buy[0];
        return {
          provider: firstBuy,
          type: 'buy',
          deepLink: this.generateDeepLink(firstBuy, showId, showName),
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding best streaming option:', error);
      return null;
    }
  }

  /**
   * Get all streaming options for a show
   */
  public async getAllStreamingOptions(
    showId: number,
    region: string = 'US'
  ): Promise<{
    flatrate: StreamingProvider[];
    rent: StreamingProvider[];
    buy: StreamingProvider[];
  }> {
    try {
      const availability = await this.getStreamingAvailability(showId, region);
      
      return {
        flatrate: availability?.flatrate || [],
        rent: availability?.rent || [],
        buy: availability?.buy || [],
      };
    } catch (error) {
      console.error('Error getting all streaming options:', error);
      return { flatrate: [], rent: [], buy: [] };
    }
  }

  /**
   * Clear cache for a specific show
   */
  public clearCache(showId?: number): void {
    if (showId) {
      this.cache.delete(showId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get TMDb image URL for provider logo
   */
  public getProviderLogoUrl(logoPath: string, size: 'original' | 'w45' | 'w92' | 'w154' | 'w185' = 'w92'): string {
    return `https://image.tmdb.org/t/p/${size}${logoPath}`;
  }
}

export const streamingIntegrationService = StreamingIntegrationService.getInstance();
export type { StreamingAvailability, StreamingProvider, WatchProvider };


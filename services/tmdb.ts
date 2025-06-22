import axios from 'axios';

// TMDb API configuration
const TMDB_API_KEY = '29231141753f554541606a489eea855a'; // Replace with your actual TMDb API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Create axios instance for TMDb API
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Types for TMDb API responses
export interface TMDbShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  number_of_episodes: number;
  number_of_seasons: number;
  status: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  created_by: { id: number; name: string }[];
  episode_run_time: number[];
  in_production: boolean;
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
  tagline: string;
}

export interface TMDbSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface TMDbEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  guest_stars: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }[];
}

export interface TMDbSearchResult {
  page: number;
  results: TMDbShow[];
  total_pages: number;
  total_results: number;
}

// API service functions
export const tmdbService = {
  // Get trending TV shows
  getTrendingShows: async (timeWindow: 'day' | 'week' = 'week'): Promise<TMDbSearchResult> => {
    const response = await tmdbApi.get(`/trending/tv/${timeWindow}`);
    return response.data;
  },

  // Get popular TV shows
  getPopularShows: async (page: number = 1): Promise<TMDbSearchResult> => {
    const response = await tmdbApi.get('/tv/popular', { params: { page } });
    return response.data;
  },

  // Get top rated TV shows
  getTopRatedShows: async (page: number = 1): Promise<TMDbSearchResult> => {
    const response = await tmdbApi.get('/tv/top_rated', { params: { page } });
    return response.data;
  },

  // Search TV shows
  searchShows: async (query: string, page: number = 1): Promise<TMDbSearchResult> => {
    const response = await tmdbApi.get('/search/tv', { 
      params: { query, page } 
    });
    return response.data;
  },

  // Get TV show details
  getShowDetails: async (showId: number): Promise<TMDbShow> => {
    const response = await tmdbApi.get(`/tv/${showId}`);
    return response.data;
  },

  // Get season details
  getSeasonDetails: async (showId: number, seasonNumber: number): Promise<TMDbSeason & { episodes: TMDbEpisode[] }> => {
    const response = await tmdbApi.get(`/tv/${showId}/season/${seasonNumber}`);
    return response.data;
  },

  // Get episode details
  getEpisodeDetails: async (showId: number, seasonNumber: number, episodeNumber: number): Promise<TMDbEpisode> => {
    const response = await tmdbApi.get(`/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`);
    return response.data;
  },

  // Discover TV shows with filters
  discoverShows: async (filters: {
    page?: number;
    genre?: string;
    network?: string;
    sortBy?: string;
  } = {}): Promise<TMDbSearchResult> => {
    const response = await tmdbApi.get('/discover/tv', { params: filters });
    return response.data;
  },

  // Get genres
  getGenres: async (): Promise<{ genres: { id: number; name: string }[] }> => {
    const response = await tmdbApi.get('/genre/tv/list');
    return response.data;
  },
};

// Helper functions for image URLs
export const getImageUrl = (path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342') => {
  return getImageUrl(path, size);
};

export const getBackdropUrl = (path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780') => {
  return getImageUrl(path, size as any);
};

// Helper functions for episode and season data
export const getNextEpisodeInfo = async (showId: number, currentSeason?: number, currentEpisode?: number) => {
  try {
    const showDetails = await tmdbService.getShowDetails(showId);
    
    // If show is ended, return null
    if (showDetails.status === 'Ended' || showDetails.status === 'Canceled') {
      return null;
    }

    // Determine which season to check for next episode
    const seasonToCheck = currentSeason || showDetails.number_of_seasons;
    
    try {
      const seasonData = await tmdbService.getSeasonDetails(showId, seasonToCheck);
      
      // Find next episode
      const nextEpisodeNumber = (currentEpisode || 0) + 1;
      const nextEpisode = seasonData.episodes.find(ep => ep.episode_number === nextEpisodeNumber);
      
      if (nextEpisode && nextEpisode.air_date) {
        return {
          type: 'episode',
          season: seasonToCheck,
          episode: nextEpisode.episode_number,
          name: nextEpisode.name,
          airDate: nextEpisode.air_date,
          overview: nextEpisode.overview,
        };
      }
      
      // If no next episode in current season, check next season
      if (seasonToCheck < showDetails.number_of_seasons) {
        const nextSeasonData = await tmdbService.getSeasonDetails(showId, seasonToCheck + 1);
        const firstEpisode = nextSeasonData.episodes[0];
        
        if (firstEpisode && firstEpisode.air_date) {
          return {
            type: 'episode',
            season: seasonToCheck + 1,
            episode: firstEpisode.episode_number,
            name: firstEpisode.name,
            airDate: firstEpisode.air_date,
            overview: firstEpisode.overview,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching season ${seasonToCheck} for show ${showId}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching show details for ${showId}:`, error);
    return null;
  }
};

export const getShowStatusInfo = (show: TMDbShow | { status: string }) => {
  const status = show.status.toLowerCase();
  
  let statusText = '';
  let statusColor = '#999';
  
  switch (status) {
    case 'returning series':
      statusText = 'Returning';
      statusColor = '#34C759';
      break;
    case 'ended':
      statusText = 'Ended';
      statusColor = '#FF3B30';
      break;
    case 'canceled':
    case 'cancelled':
      statusText = 'Canceled';
      statusColor = '#FF3B30';
      break;
    case 'in production':
      statusText = 'In Production';
      statusColor = '#FF9500';
      break;
    case 'planned':
      statusText = 'Planned';
      statusColor = '#5856D6';
      break;
    case 'pilot':
      statusText = 'Pilot';
      statusColor = '#AF52DE';
      break;
    default:
      statusText = show.status;
      statusColor = '#999';
  }
  
  return {
    text: statusText,
    color: statusColor,
    isActive: status === 'returning series' || status === 'in production',
    inProduction: 'in_production' in show ? show.in_production : false,
  };
};

export const formatCountdown = (airDate: string): string => {
  const today = new Date();
  const air = new Date(airDate);
  const diffTime = air.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Aired ${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return 'Airs today';
  } else if (diffDays === 1) {
    return 'Airs tomorrow';
  } else if (diffDays <= 7) {
    return `Airs in ${diffDays} days`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Airs in ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Airs in ${months} month${months > 1 ? 's' : ''}`;
  }
};

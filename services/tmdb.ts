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

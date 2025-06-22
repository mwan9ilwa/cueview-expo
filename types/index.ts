// User data types
export interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Show status types
export type ShowStatus = 'watching' | 'want-to-watch' | 'watched';

// User's show in their library
export interface UserShow {
  id: string;
  userId: string;
  showId: number; // TMDb show ID
  status: ShowStatus;
  rating?: number; // 1-5 stars
  notes?: string;
  currentSeason?: number;
  currentEpisode?: number;
  watchedEpisodes: WatchedEpisode[];
  addedAt: Date;
  updatedAt: Date;
}

// User show with cached show details
export interface UserShowWithDetails extends UserShow {
  showDetails: CachedShow | null;
}

// Watched episode tracking
export interface WatchedEpisode {
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: Date;
}

// Local cached show data (for offline access)
export interface CachedShow {
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
  genres: { id: number; name: string }[];
  networks: { id: number; name: string }[];
  cachedAt: Date;
}

// Local cached season data
export interface CachedSeason {
  id: number;
  showId: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  episodes: CachedEpisode[];
  cachedAt: Date;
}

// Local cached episode data
export interface CachedEpisode {
  id: number;
  showId: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
  vote_average: number;
  cachedAt: Date;
}

// App state types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userShows: UserShow[];
  cachedShows: CachedShow[];
}

// Navigation types for screens
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Discover: undefined;
  Calendar: undefined;
  Profile: undefined;
};

export type LibraryStackParamList = {
  LibraryMain: undefined;
  ShowDetails: { showId: number };
};

export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  ShowDetails: { showId: number };
  SearchResults: { query: string };
};

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Notification types
export interface NotificationData {
  id: string;
  type: 'new-episode' | 'season-premiere' | 'custom-reminder';
  showId: number;
  showName: string;
  seasonNumber?: number;
  episodeNumber?: number;
  airDate: Date;
  title: string;
  body: string;
}

// Filter and sort options
export interface ShowFilters {
  status?: ShowStatus;
  genre?: string;
  network?: string;
  rating?: number;
  sortBy?: 'title' | 'date-added' | 'last-watched' | 'rating' | 'release-date';
  sortOrder?: 'asc' | 'desc';
}

// Search and discovery types
export interface SearchFilters {
  genre?: number;
  network?: number;
  year?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'first_air_date.desc';
  includeAdult?: boolean;
}

// Statistics types (for future implementation)
export interface UserStats {
  totalShowsWatched: number;
  totalEpisodesWatched: number;
  totalWatchTime: number; // in minutes
  favoriteGenres: { genre: string; count: number }[];
  monthlyProgress: { month: string; episodesWatched: number }[];
}

import { CachedShow, UserShow, WatchedEpisode } from '@/types';
import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('cueview.db');
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // User shows table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_shows (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        show_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        rating INTEGER,
        notes TEXT,
        current_season INTEGER,
        current_episode INTEGER,
        added_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Watched episodes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS watched_episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_show_id TEXT NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        watched_at TEXT NOT NULL,
        FOREIGN KEY (user_show_id) REFERENCES user_shows (id) ON DELETE CASCADE
      );
    `);

    // Cached shows table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_shows (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        overview TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        first_air_date TEXT,
        last_air_date TEXT,
        number_of_episodes INTEGER,
        number_of_seasons INTEGER,
        status TEXT,
        vote_average REAL,
        genres TEXT, -- JSON string
        networks TEXT, -- JSON string
        cached_at TEXT NOT NULL
      );
    `);

    // Cached seasons table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_seasons (
        id INTEGER PRIMARY KEY,
        show_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        overview TEXT,
        poster_path TEXT,
        season_number INTEGER NOT NULL,
        episode_count INTEGER,
        air_date TEXT,
        cached_at TEXT NOT NULL,
        FOREIGN KEY (show_id) REFERENCES cached_shows (id) ON DELETE CASCADE
      );
    `);

    // Cached episodes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_episodes (
        id INTEGER PRIMARY KEY,
        show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        overview TEXT,
        still_path TEXT,
        episode_number INTEGER NOT NULL,
        air_date TEXT,
        runtime INTEGER,
        vote_average REAL,
        cached_at TEXT NOT NULL,
        FOREIGN KEY (show_id) REFERENCES cached_shows (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_user_shows_user_id ON user_shows (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_shows_show_id ON user_shows (show_id);
      CREATE INDEX IF NOT EXISTS idx_watched_episodes_user_show ON watched_episodes (user_show_id);
      CREATE INDEX IF NOT EXISTS idx_cached_seasons_show ON cached_seasons (show_id);
      CREATE INDEX IF NOT EXISTS idx_cached_episodes_show ON cached_episodes (show_id, season_number);
    `);
  }

  // User Shows methods
  async saveUserShow(userShow: UserShow): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_shows 
       (id, user_id, show_id, status, rating, notes, current_season, current_episode, added_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userShow.id,
        userShow.userId,
        userShow.showId,
        userShow.status,
        userShow.rating || null,
        userShow.notes || null,
        userShow.currentSeason || null,
        userShow.currentEpisode || null,
        userShow.addedAt.toISOString(),
        userShow.updatedAt.toISOString(),
      ]
    );

    // Save watched episodes
    await this.saveWatchedEpisodes(userShow.id, userShow.watchedEpisodes);
  }

  async getUserShows(userId: string): Promise<UserShow[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM user_shows WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    const userShows: UserShow[] = [];
    for (const row of result as any[]) {
      const watchedEpisodes = await this.getWatchedEpisodes(row.id);
      userShows.push({
        id: row.id,
        userId: row.user_id,
        showId: row.show_id,
        status: row.status,
        rating: row.rating,
        notes: row.notes,
        currentSeason: row.current_season,
        currentEpisode: row.current_episode,
        watchedEpisodes,
        addedAt: new Date(row.added_at),
        updatedAt: new Date(row.updated_at),
      });
    }

    return userShows;
  }

  async deleteUserShow(userShowId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM user_shows WHERE id = ?', [userShowId]);
  }

  // Watched Episodes methods
  private async saveWatchedEpisodes(userShowId: string, episodes: WatchedEpisode[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Clear existing watched episodes for this show
    await this.db.runAsync('DELETE FROM watched_episodes WHERE user_show_id = ?', [userShowId]);

    // Insert new watched episodes
    for (const episode of episodes) {
      await this.db.runAsync(
        'INSERT INTO watched_episodes (user_show_id, season_number, episode_number, watched_at) VALUES (?, ?, ?, ?)',
        [userShowId, episode.seasonNumber, episode.episodeNumber, episode.watchedAt.toISOString()]
      );
    }
  }

  private async getWatchedEpisodes(userShowId: string): Promise<WatchedEpisode[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM watched_episodes WHERE user_show_id = ?',
      [userShowId]
    );

    return (result as any[]).map((row) => ({
      seasonNumber: row.season_number,
      episodeNumber: row.episode_number,
      watchedAt: new Date(row.watched_at),
    }));
  }

  // Cached Shows methods
  async saveCachedShow(show: CachedShow): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO cached_shows 
       (id, name, overview, poster_path, backdrop_path, first_air_date, last_air_date, 
        number_of_episodes, number_of_seasons, status, vote_average, genres, networks, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        show.id,
        show.name,
        show.overview,
        show.poster_path,
        show.backdrop_path,
        show.first_air_date,
        show.last_air_date,
        show.number_of_episodes,
        show.number_of_seasons,
        show.status,
        show.vote_average,
        JSON.stringify(show.genres),
        JSON.stringify(show.networks),
        show.cachedAt.toISOString(),
      ]
    );
  }

  async getCachedShow(showId: number): Promise<CachedShow | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM cached_shows WHERE id = ?',
      [showId]
    );

    if (!result) return null;

    const row = result as any;
    return {
      id: row.id,
      name: row.name,
      overview: row.overview,
      poster_path: row.poster_path,
      backdrop_path: row.backdrop_path,
      first_air_date: row.first_air_date,
      last_air_date: row.last_air_date,
      number_of_episodes: row.number_of_episodes,
      number_of_seasons: row.number_of_seasons,
      status: row.status,
      vote_average: row.vote_average,
      genres: JSON.parse(row.genres || '[]'),
      networks: JSON.parse(row.networks || '[]'),
      cachedAt: new Date(row.cached_at),
    };
  }

  async clearOldCache(daysOld: number = 7): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.db.runAsync(
      'DELETE FROM cached_shows WHERE cached_at < ?',
      [cutoffDate.toISOString()]
    );
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM watched_episodes;
      DELETE FROM user_shows;
      DELETE FROM cached_episodes;
      DELETE FROM cached_seasons;
      DELETE FROM cached_shows;
    `);
  }
}

export const dbService = new DatabaseService();

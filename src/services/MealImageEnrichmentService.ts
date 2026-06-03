import AsyncStorage from '@react-native-async-storage/async-storage';

const THE_MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';
const CACHE_PREFIX = 'meal_image_cache_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  url: string;
  timestamp: number;
}

export const MealImageEnrichmentService = {
  /**
   * Attempts to find a real image URL for a meal name.
   * Mirrors the backend enrichment logic using TheMealDB.
   */
  async getEnrichedImage(mealName: string): Promise<string | null> {
    if (!mealName || mealName.trim() === '') return null;

    const query = mealName.toLowerCase().trim();
    
    // 1. Check local cache
    const cached = await this.getCachedImage(query);
    if (cached) return cached;

    // 2. Fetch from TheMealDB
    try {
      // Clean query: remove special characters, just like the backend Str::of($title)->replaceMatches...
      const cleanQuery = query
        .replace(/\([^)]*\)/g, '')
        .replace(/[^A-Za-z0-9 ]+/g, ' ')
        .trim();

      if (!cleanQuery) return null;

      console.log(`[Enrichment] Searching TheMealDB for: "${cleanQuery}"`);
      const response = await fetch(`${THE_MEAL_DB_URL}${encodeURIComponent(cleanQuery)}`);
      const data = await response.json();

      if (data && data.meals && data.meals.length > 0) {
        const imageUrl = data.meals[0].strMealThumb;
        if (imageUrl) {
          await this.cacheImage(query, imageUrl);
          return imageUrl;
        }
      }
    } catch (error) {
      console.warn('[Enrichment] Failed to fetch image from TheMealDB:', error);
    }

    return null;
  },

  async getCachedImage(query: string): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${query}`);
      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data);
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${query}`);
        return null;
      }

      return entry.url;
    } catch (e) {
      return null;
    }
  },

  async cacheImage(query: string, url: string): Promise<void> {
    try {
      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${query}`, JSON.stringify(entry));
    } catch (e) {
      // Ignore cache errors
    }
  }
};

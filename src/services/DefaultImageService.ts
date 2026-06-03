/**
 * DefaultImageService
 * Provides local premium assets as fallbacks when user-uploaded or enriched 
 * images are missing.
 */
export const DefaultImageService = {
  assets: {
    walking: require('../../assets/images/walking.jpeg'),
    running: require('../../assets/images/running.jpeg'),
    cycling: require('../../assets/images/cycling.jpeg'),
    swimming: require('../../assets/images/swimming.jpg'),
    gym: require('../../assets/images/gym.jpg'),
    yoga: require('../../assets/images/yoga.jpeg'),
    football: require('../../assets/images/football.jpeg'),
    basketball: require('../../assets/images/basketball.png'),
    injection: require('../../assets/images/injection.jpeg'),
    meal: require('../../assets/images/meal.jpeg'),
    glucometer: require('../../assets/images/glucometer.jpg'),
  },

  /**
   * Returns a require() asset based on the category and optional sub-type
   */
  getDefaultImage(category: 'activity' | 'injection' | 'meal' | 'measurement', subType?: string) {
    if (category === 'activity') {
      const type = (subType || '').toLowerCase();
      if (type.includes('walk')) return this.assets.walking;
      if (type.includes('run')) return this.assets.running;
      if (type.includes('cycl') || type.includes('bike')) return this.assets.cycling;
      if (type.includes('swim')) return this.assets.swimming;
      if (type.includes('gym') || type.includes('lift')) return this.assets.gym;
      if (type.includes('yoga')) return this.assets.yoga;
      if (type.includes('foot') || type.includes('soccer')) return this.assets.football;
      if (type.includes('basket')) return this.assets.basketball;
      return this.assets.running; // Fallback activity
    }

    if (category === 'injection') return this.assets.injection;
    if (category === 'meal') return this.assets.meal;
    if (category === 'measurement') return this.assets.glucometer;

    return this.assets.meal; // Global fallback
  }
};

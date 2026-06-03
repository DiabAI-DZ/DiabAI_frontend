/**
 * DefaultImageService
 * 
 * Provides local premium assets for various health data categories to ensure
 * a high-quality visual experience even when user-specific images are missing.
 */

const DefaultAssets = {
  walking: require('../assets/defaults/walking.png'),
  running: require('../assets/defaults/running.png'),
  cycling: require('../assets/defaults/cycling.png'),
  activity: require('../assets/defaults/running.png'), // Generic activity fallback
  injection: require('../assets/defaults/injection.png'),
  meal: require('../assets/defaults/meal.png'),
  glucose: null, // Scans rely on icons or photos
};

export type AssetType = keyof typeof DefaultAssets;

export const getDefaultImage = (type: string, subType?: string): any => {
  const normalizedType = type.toLowerCase();
  
  if (normalizedType === 'activity' && subType) {
    const normalizedSub = subType.toLowerCase();
    if (normalizedSub.includes('walk')) return DefaultAssets.walking;
    if (normalizedSub.includes('run') || normalizedSub.includes('jog')) return DefaultAssets.running;
    if (normalizedSub.includes('cycl') || normalizedSub.includes('bike')) return DefaultAssets.cycling;
    return DefaultAssets.activity;
  }

  if (normalizedType === 'injection') return DefaultAssets.injection;
  if (normalizedType === 'meal') return DefaultAssets.meal;
  
  return (DefaultAssets as any)[normalizedType] || null;
};

export default {
  getDefaultImage,
  Assets: DefaultAssets
};

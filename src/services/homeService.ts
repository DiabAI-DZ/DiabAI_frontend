// Home data access. Thin wrapper over the existing (working) fetch in apiService so the
// endpoint/business logic is untouched while Home gets a clean service surface to hook against.
import { apiService } from './apiService';
import type { HomeData } from '../types/home';

export const homeService = {
  getHome: (period: '7d' | '30d' = '7d'): Promise<HomeData> => apiService.fetchHomeData(period),
};

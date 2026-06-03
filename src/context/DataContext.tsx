import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { aiService } from '../services/aiService';
import { insightsService } from '../services/insightsService';
import { useUser } from './UserContext';
import { LogEntry, AlertItem, ScanResult, AISummary, HomeData, MealScanResult } from '../services/types';

interface DataContextType {
  logs: LogEntry[];
  alerts: AlertItem[];
  homeData: HomeData | null;
  recommendations: any[];
  loading: boolean;
  refreshData: (period?: '7d' | '30d') => Promise<void>;
  addLog: (log: Omit<LogEntry, "id">) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  markAlertRead: (id: number) => Promise<void>;
  markAllAlertsRead: () => Promise<number>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  getAIInsight: (query: string) => Promise<string>;
  getDailySummary: () => Promise<AISummary>;
  scanImage: (uri: string) => Promise<ScanResult>;
  scanMeal: (uri: string) => Promise<MealScanResult>;
  premiumRecommendations: any[];
  glucoseForecast: any[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [premiumRecommendations, setPremiumRecommendations] = useState<any[]>([]);
  const [glucoseForecast, setGlucoseForecast] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async (period: '7d' | '30d' = '7d') => {
    setLoading(true);
    try {
      const [logsData, alertsData, homeDataObj] = await Promise.all([
        apiService.fetchLogs().catch(err => {
          console.warn("DataContext: Failed to fetch logs:", err);
          return [];
        }),
        apiService.fetchAlerts().catch(err => {
          console.warn("DataContext: Failed to fetch alerts:", err);
          return [];
        }),
        apiService.fetchHomeData(period).catch(err => {
          console.warn("DataContext: Failed to fetch home data:", err);
          return null;
        }),
      ]);
      setLogs(logsData);
      setAlerts(alertsData);
      setHomeData(homeDataObj);
      // NOTE: recommendations are intentionally NOT fetched here. The standalone
      // /api/insights/recommendations call used to run concurrently with the aggregate
      // /api/insights prefetch, hitting the SAME recommendations LLM twice at once and pushing it
      // past the backend pool timeout (→ "context canceled" → heuristic fallback). They now come
      // from the single aggregate call below, so that LLM is hit exactly once per window.

      // Fetch Premium Heavy AI data if applicable (Checkpoint 4)
      const userProfile = await apiService.fetchProfile().catch(() => null);
      if (userProfile?.isPremium) {
        console.log("[DataContext] Fetching heavy AI content for premium member");
        const [pRecs, gForecast] = await Promise.all([
          apiService.fetchPremiumRecommendations().catch(() => []),
          apiService.fetchGlucoseForecast().catch(() => []),
        ]);
        setPremiumRecommendations(pRecs);
        setGlucoseForecast(gForecast);
      }
    } catch (error) {
      console.error("DataContext: Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLog = useCallback(async (log: Omit<LogEntry, "id">) => {
    try {
      let logDate = log.date;
      if (selectedDate) {
        const now = new Date();
        const d = new Date(selectedDate);
        const originalTime = log.date ? new Date(log.date) : now;
        d.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds(), originalTime.getMilliseconds());
        logDate = d.toISOString();
      }

      const newLog = await apiService.createLog({
        ...log,
        date: logDate
      });
      setLogs((prev) => [newLog, ...prev]);

      // The backend analyzes each entry automatically on creation (AnalyzeEntryJob),
      // which may generate new alert notifications. Just refresh alerts so any new
      // ones surface — no separate /api/analyze call is needed.
      try {
        // Show fresh predictions on the Insights tab after new data is added.
        insightsService.resetInsightsSession();

        // Refresh alerts + forecast as they may have changed (the backend already
        // ran AnalyzeEntryJob on creation — no separate /api/analyze call needed).
        const [newAlerts, newForecast] = await Promise.all([
          apiService.fetchAlerts().catch(() => []),
          apiService.fetchGlucoseForecast().catch(() => []),
        ]);
        setAlerts(newAlerts);
        setGlucoseForecast(newForecast);
      } catch (ae) {
        console.warn("[DataContext] post-log refresh failed:", ae);
      }
    } catch (error) {
      console.error("DataContext: Failed to add log:", error);
      throw error;
    }
  }, [selectedDate]);

  const deleteLog = useCallback(async (id: number) => {
    try {
      const log = logs.find(l => l.id === id);
      await apiService.deleteLog(id, log?.type);
      setLogs((prev) => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("DataContext: Failed to delete log:", error);
      throw error;
    }
  }, [logs]);

  const markAlertRead = useCallback(async (id: number) => {
    try {
      await apiService.markAlertRead(id);
      setAlerts((prev) => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (error) {
      console.error("DataContext: Failed to mark alert read:", error);
    }
  }, []);

  const markAllAlertsRead = useCallback(async (): Promise<number> => {
    try {
      const marked = await apiService.markAllAlertsRead();
      // Optimistically mark all in-memory alerts as read so UI updates immediately
      setAlerts((prev) => prev.map(a => ({ ...a, read: true })));
      return marked;
    } catch (error) {
      console.error('DataContext: Failed to mark all alerts read:', error);
      return 0;
    }
  }, []);

  const getAIInsight = useCallback(async (query: string) => {
    return await aiService.getAIInsights(logs, query);
  }, [logs]);

  const getDailySummary = useCallback(async () => {
    return await aiService.getAIDailySummary(logs);
  }, [logs]);

  const scanImage = useCallback(async (uri: string) => {
    return await aiService.processGlucometerImage(uri);
  }, []);

  const scanMeal = useCallback(async (uri: string) => {
    return await aiService.processMealImage(uri);
  }, []);

  const { profile } = useUser();
  const [lastRefreshedUser, setLastRefreshedUser] = useState<string | null>(null);

  // Make persisted insights available for instant render as early as possible.
  useEffect(() => {
    insightsService.hydrate();
  }, []);

  useEffect(() => {
    if (profile?.email) {
      if (lastRefreshedUser !== profile.email) {
        refreshData();
        // Kick off the slow AI insights in the background the moment we have a session, so the
        // data is ready (cached) by the time the user opens the Insights tab. This is the ONLY
        // call that touches the patterns/recommendations LLMs — it de-dupes with the Insights
        // screen's own request AND feeds the home dashboard's inline recommendations, so each
        // LLM service is hit exactly once per window (no concurrent double-hit → no cancellation).
        const patientId = String((profile as any).id ?? profile.email);
        const params = insightsService.buildInsightsParams({ patientId });
        insightsService.hydrate().then(() => {
          const cached = insightsService.getCached(params);
          if (cached && !insightsService.isStale(cached)) {
            setRecommendations(cached.recommendations?.recommendations ?? []);
            return;
          }
          insightsService
            .fetchInsightsBundle(params, { emitPremiumUi: false })
            .then(bundle => setRecommendations(bundle?.recommendations?.recommendations ?? []))
            .catch(() => {});
        });
        setLastRefreshedUser(profile.email);
      }
    } else if (!profile) {
      // Clear data on sign out
      setLogs([]);
      setAlerts([]);
      setHomeData(null);
      setRecommendations([]);
      setLastRefreshedUser(null);
      // Abort any in-flight insights request and drop the in-memory cache.
      insightsService.resetInsightsSession();
    }
  }, [profile, refreshData, lastRefreshedUser]);

  return (
    <DataContext.Provider value={{ 
      logs, 
      alerts, 
      homeData,
      recommendations,
      loading, 
      refreshData, 
      addLog, 
      deleteLog,
      markAlertRead, 
      markAllAlertsRead,
      selectedDate,
      setSelectedDate,
      getAIInsight, 
      getDailySummary,
      scanImage,
      scanMeal,
      premiumRecommendations,
      glucoseForecast
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

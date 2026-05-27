import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { aiService } from '../services/aiService';
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async (period: '7d' | '30d' = '7d') => {
    setLoading(true);
    try {
      const [logsData, alertsData, homeDataObj, recsData] = await Promise.all([
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
        apiService.fetchRecommendations().catch(err => {
          console.warn("DataContext: Failed to fetch recommendations:", err);
          return [];
        }),
      ]);
      setLogs(logsData);
      setAlerts(alertsData);
      setHomeData(homeDataObj);
      setRecommendations(recsData);
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

  useEffect(() => {
    if (profile?.email) {
      if (lastRefreshedUser !== profile.email) {
        refreshData();
        setLastRefreshedUser(profile.email);
      }
    } else if (!profile) {
      // Clear data on sign out
      setLogs([]);
      setAlerts([]);
      setHomeData(null);
      setRecommendations([]);
      setLastRefreshedUser(null);
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
      scanMeal
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

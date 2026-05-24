import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { aiService } from '../services/aiService';
import { LogEntry, AlertItem, ScanResult, AISummary } from '../services/types';

interface DataContextType {
  logs: LogEntry[];
  alerts: AlertItem[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addLog: (log: Omit<LogEntry, "id">) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  markAlertRead: (id: number) => Promise<void>;
  getAIInsight: (query: string) => Promise<string>;
  getDailySummary: () => Promise<AISummary>;
  scanImage: (uri: string) => Promise<ScanResult>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, alertsData] = await Promise.all([
        apiService.fetchLogs(),
        apiService.fetchAlerts(),
      ]);
      setLogs(logsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error("DataContext: Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLog = useCallback(async (log: Omit<LogEntry, "id">) => {
    try {
      const newLog = await apiService.createLog(log);
      setLogs((prev) => [newLog, ...prev]);
    } catch (error) {
      console.error("DataContext: Failed to add log:", error);
      throw error;
    }
  }, []);

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

  const getAIInsight = useCallback(async (query: string) => {
    return await aiService.getAIInsights(logs, query);
  }, [logs]);

  const getDailySummary = useCallback(async () => {
    return await aiService.getAIDailySummary(logs);
  }, [logs]);

  const scanImage = useCallback(async (uri: string) => {
    return await aiService.processGlucometerImage(uri);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <DataContext.Provider value={{ 
      logs, 
      alerts, 
      loading, 
      refreshData, 
      addLog, 
      deleteLog,
      markAlertRead, 
      getAIInsight, 
      getDailySummary,
      scanImage 
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

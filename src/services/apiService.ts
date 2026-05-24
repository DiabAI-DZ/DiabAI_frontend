import { LogEntry, AlertItem, UserProfile } from './types';
import { subDays } from 'date-fns';

// --- CONFIGURATION ---
// Change this to your actual backend IP/Domain when ready
export const BASE_URL = "http://your-backend-api.com"; 

// --- MOCK DATA ---
const today = new Date();
const yesterday = subDays(today, 1);

let MOCK_LOGS: LogEntry[] = [
  {
    id: 1,
    type: "measurement",
    value: 125,
    unit: "mg/dL",
    status: "Normal",
    time: "08:30 AM",
    date: today.toISOString(),
    tag: "Fasting",
    trend: "stable",
    previousValue: 118,
    dailyAvg: 132,
  },
  {
    id: 2,
    type: "meal",
    name: "Avocado Toast & Eggs",
    mealType: "breakfast",
    time: "09:15 AM",
    date: today.toISOString(),
    carbs: 32,
    calories: 340,
    protein: 18,
    fat: 22,
    fiber: 8,
    impact: "+18 mg/dL",
    impactLevel: "low",
    image: "https://images.unsplash.com/photo-1725289970943-42bb16982f5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    tags: ["Healthy", "Low Impact"],
  },
];

let MOCK_ALERTS: AlertItem[] = [
  {
    id: 1,
    severity: "critical",
    title: "Severe hypoglycemia detected",
    desc: "Glucose dropped to 54 mg/dL at 02:30 AM",
    time: "02:30 AM",
    date: today.toISOString(),
    tag: "AI Detected",
  },
];

let MOCK_PROFILE: UserProfile = {
  name: "Abdallah",
  email: "abdallah@example.com",
  diabetesType: "Type 2",
  glucoseUnit: "mg/dL",
  goals: {
    min: 70,
    max: 140,
  }
};

// --- SERVICE FUNCTIONS ---

export const apiService = {
  // Logs
  async fetchLogs(): Promise<LogEntry[]> {
    console.log(`[API] Fetching logs from ${BASE_URL}/logs`);
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_LOGS]), 800);
    });
  },

  async createLog(log: Omit<LogEntry, "id">): Promise<LogEntry> {
    console.log(`[API] Creating log at ${BASE_URL}/logs`, log);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newLog = { ...log, id: Date.now() } as LogEntry;
        MOCK_LOGS.unshift(newLog);
        resolve(newLog);
      }, 1000);
    });
  },

  async deleteLog(id: number): Promise<void> {
    console.log(`[API] Deleting log ${id} at ${BASE_URL}/logs/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_LOGS = MOCK_LOGS.filter(l => l.id !== id);
        resolve();
      }, 500);
    });
  },

  // Alerts
  async fetchAlerts(): Promise<AlertItem[]> {
    console.log(`[API] Fetching alerts from ${BASE_URL}/alerts`);
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_ALERTS]), 600);
    });
  },

  async markAlertRead(id: number): Promise<void> {
    console.log(`[API] Marking alert ${id} as read at ${BASE_URL}/alerts/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_ALERTS = MOCK_ALERTS.map(a => a.id === id ? { ...a, read: true } : a);
        resolve();
      }, 400);
    });
  },

  // Profile
  async fetchProfile(): Promise<UserProfile> {
    console.log(`[API] Fetching profile from ${BASE_URL}/profile`);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...MOCK_PROFILE }), 700);
    });
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    console.log(`[API] Updating profile at ${BASE_URL}/profile`, profile);
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_PROFILE = { ...MOCK_PROFILE, ...profile };
        resolve({ ...MOCK_PROFILE });
      }, 1000);
    });
  }
};

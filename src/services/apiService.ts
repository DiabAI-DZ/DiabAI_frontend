import { LogEntry, AlertItem, UserProfile, GlucoseStatus, GlucoseTrend, ImpactLevel, MeasurementEntry, MealEntry, HomeData } from './types';
import { authApi } from './authApi';

// --- HELPERS ---

const mapStatus = (status?: string): GlucoseStatus => {
  if (!status) return "Normal";
  const lower = status.toLowerCase();
  if (lower === 'high') return "High";
  if (lower === 'low') return "Low";
  return "Normal";
};

const mapTag = (type?: string): string => {
  if (!type) return "Fasting";
  if (type === 'fasting') return "Fasting";
  if (type === 'before_meal') return "Before Meal";
  if (type === 'after_meal') return "After Meal";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const unmapTag = (tag?: string): string => {
  if (!tag) return 'fasting';
  const lower = tag.toLowerCase();
  if (lower.includes('fasting')) return 'fasting';
  if (lower.includes('before')) return 'before_meal';
  if (lower.includes('after')) return 'after_meal';
  return 'fasting';
};

const mapTrend = (trend?: string): GlucoseTrend => {
  if (trend === 'rising' || trend === 'up') return "up";
  if (trend === 'falling' || trend === 'down') return "down";
  return "stable";
};

const mapImpactLevel = (level?: string): ImpactLevel => {
  if (!level) return "low";
  const lower = level.toLowerCase();
  if (lower === 'high') return "high";
  if (lower === 'moderate' || lower === 'medium') return "medium";
  return "low";
};

const formatTime = (isoString?: string): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  } catch (e) {
    return "";
  }
};

const mapDiabetesType = (type?: string): "Type 1" | "Type 2" | "Gestational" | "Prediabetic" => {
  if (type === 'type_1') return 'Type 1';
  if (type === 'type_2') return 'Type 2';
  if (type === 'gestational') return 'Gestational';
  return 'Type 2';
};

const unmapDiabetesType = (type?: string): string => {
  if (type === 'Type 1') return 'type_1';
  if (type === 'Type 2') return 'type_2';
  if (type === 'Gestational') return 'gestational';
  return 'type_2';
};

const mapGlucoseUnit = (unit?: string): "mg/dL" | "mmol/L" => {
  if (unit === 'mmol_l') return 'mmol/L';
  return 'mg/dL';
};

const unmapGlucoseUnit = (unit?: string): string => {
  if (unit === 'mmol/L') return 'mmol_l';
  return 'mg_dl';
};

// A helper for doing authenticated requests
const authenticatedFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = authApi.getToken();
  const baseUrl = authApi.baseUrl;
  const url = `${baseUrl}${path}`;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("[API] Request unauthorized (401).");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}] for ${path}: ${errorText}`);
  }

  return response;
};

// --- SERVICE FUNCTIONS ---

export const apiService = {
  // Logs
  async fetchLogs(): Promise<LogEntry[]> {
    console.log(`[API] Fetching logs from ${authApi.baseUrl}/api/logbook`);
    try {
      const response = await authenticatedFetch('/api/logbook');
      const result = await response.json();
      
      if (!result || !Array.isArray(result.data)) {
        return [];
      }

      return result.data
        .filter((row: any) => row.entry_type === 'measurement' || row.entry_type === 'meal')
        .map((row: any): LogEntry => {
          if (row.entry_type === 'measurement') {
            return {
              id: row.id,
              type: 'measurement',
              value: parseFloat(row.value_mg_dl) || 0,
              unit: 'mg/dL',
              status: mapStatus(row.health_status),
              time: formatTime(row.recorded_at),
              date: row.recorded_at,
              tag: mapTag(row.measurement_type),
              trend: mapTrend(row.trend),
            };
          } else {
            return {
              id: row.id,
              type: 'meal',
              name: row.title || 'Logged Meal',
              mealType: row.meal_type || 'snack',
              time: formatTime(row.recorded_at),
              date: row.recorded_at,
              carbs: row.carbohydrates_g || 0,
              calories: row.calories || 0,
              protein: row.protein_g,
              fat: row.fat_g,
              fiber: row.fiber_g,
              impact: row.glucose_impact_mg_dl ? `+${Math.round(row.glucose_impact_mg_dl)} mg/dL` : '',
              impactLevel: mapImpactLevel(row.impact_level),
              image: row.image_url || '',
              tags: row.tags || [],
            };
          }
        });
    } catch (error) {
      console.error("fetchLogs failed:", error);
      throw error;
    }
  },

  async createLog(log: Omit<LogEntry, "id">): Promise<LogEntry> {
    console.log(`[API] Creating log`, log);
    try {
      if (log.type === 'measurement') {
        const mLog = log as Omit<MeasurementEntry, "id">;
        const payload = {
          title: mLog.tag ? `${mLog.tag} check` : "Glucose Measurement",
          value_mg_dl: mLog.value,
          measurement_type: unmapTag(mLog.tag),
          measured_at: mLog.date,
          notes: "",
          tags: []
        };
        const response = await authenticatedFetch('/api/measurements', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        const row = result.data;
        return {
          id: row.id,
          type: 'measurement',
          value: parseFloat(row.value_mg_dl) || 0,
          unit: 'mg/dL',
          status: mapStatus(row.health_status),
          time: formatTime(row.measured_at),
          date: row.measured_at,
          tag: mapTag(row.measurement_type),
          trend: mapTrend(row.trend),
        };
      } else {
        const mLog = log as Omit<MealEntry, "id">;
        const payload = {
          title: mLog.name,
          meal_type: mLog.mealType,
          eaten_at: mLog.date,
          calories: mLog.calories,
          carbohydrates_g: mLog.carbs,
          protein_g: mLog.protein || 0,
          fat_g: mLog.fat || 0,
          fiber_g: mLog.fiber || 0,
          food_items: [],
          notes: "",
          tags: mLog.tags || []
        };
        const response = await authenticatedFetch('/api/meals', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        const row = result.data;
        return {
          id: row.id,
          type: 'meal',
          name: row.title || 'Logged Meal',
          mealType: row.meal_type || 'snack',
          time: formatTime(row.eaten_at),
          date: row.eaten_at,
          carbs: row.carbohydrates_g || 0,
          calories: row.calories || 0,
          protein: row.protein_g,
          fat: row.fat_g,
          fiber: row.fiber_g,
          impact: row.glucose_impact_mg_dl ? `+${Math.round(row.glucose_impact_mg_dl)} mg/dL` : '',
          impactLevel: mapImpactLevel(row.impact_level),
          image: row.image_url || '',
          tags: row.tags || [],
        };
      }
    } catch (error) {
      console.error("createLog failed:", error);
      throw error;
    }
  },

  async deleteLog(id: number, type?: "measurement" | "meal"): Promise<void> {
    console.log(`[API] Deleting log ${id} (type: ${type})`);
    try {
      if (type === 'meal') {
        await authenticatedFetch(`/api/meals/${id}`, {
          method: 'DELETE'
        });
      } else if (type === 'measurement') {
        await authenticatedFetch(`/api/measurements/${id}`, {
          method: 'DELETE'
        });
      } else {
        try {
          await authenticatedFetch(`/api/measurements/${id}`, {
            method: 'DELETE'
          });
        } catch (e) {
          await authenticatedFetch(`/api/meals/${id}`, {
            method: 'DELETE'
          });
        }
      }
    } catch (error) {
      console.error("deleteLog failed:", error);
      throw error;
    }
  },

  // Alerts
  async fetchAlerts(): Promise<AlertItem[]> {
    console.log(`[API] Fetching alerts from ${authApi.baseUrl}/api/notifications`);
    try {
      const response = await authenticatedFetch('/api/notifications');
      const result = await response.json();
      if (!result || !Array.isArray(result.data)) {
        return [];
      }
      return result.data.map((row: any): AlertItem => {
        return {
          id: row.id,
          severity: row.type || 'info',
          title: row.title || 'Notification',
          desc: row.body || '',
          time: formatTime(row.created_at),
          date: row.created_at,
          tag: row.source === 'ai' ? 'AI Detected' : 'System',
          read: !!row.is_read
        };
      });
    } catch (error) {
      console.error("fetchAlerts failed:", error);
      return [];
    }
  },

  async markAlertRead(id: number): Promise<void> {
    console.log(`[API] Marking alert ${id} as read`);
    try {
      await authenticatedFetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error("markAlertRead failed:", error);
    }
  },

  // Profile
  async fetchHomeData(trend_period: "7d" | "30d" = "7d"): Promise<HomeData> {
    console.log(`[API] Fetching home data from ${authApi.baseUrl}/api/home?trend_period=${trend_period}`);
    const response = await authenticatedFetch(`/api/home?trend_period=${trend_period}`);
    return await response.json();
  },

  async fetchProfile(): Promise<UserProfile> {
    console.log(`[API] Fetching settings from ${authApi.baseUrl}/api/settings`);
    const response = await authenticatedFetch('/api/settings');
    const settings = await response.json();
    
    const p = settings.profile || {};
    const h = settings.health || {};
    
    return {
      name: p.name || '',
      email: p.email || '',
      diabetesType: mapDiabetesType(h.diabetes_type),
      glucoseUnit: mapGlucoseUnit(h.glucose_unit),
      goals: {
        min: h.glucose_target_min || 70,
        max: h.glucose_target_max || 140
      }
    };
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    console.log(`[API] Updating profile`, updates);
    const profileUpdates: any = {};
    const healthUpdates: any = {};
    
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.email !== undefined) profileUpdates.email = updates.email;
    if (updates.phone_number !== undefined) profileUpdates.phone_number = updates.phone_number;
    if (updates.address !== undefined) profileUpdates.address = updates.address;
    
    if (updates.diabetesType !== undefined) {
      healthUpdates.diabetes_type = unmapDiabetesType(updates.diabetesType);
    }
    if (updates.glucoseUnit !== undefined) {
      healthUpdates.glucose_unit = unmapGlucoseUnit(updates.glucoseUnit);
    }
    if (updates.goals !== undefined) {
      if (updates.goals.min !== undefined) healthUpdates.glucose_target_min = updates.goals.min;
      if (updates.goals.max !== undefined) healthUpdates.glucose_target_max = updates.goals.max;
    }
    
    try {
      if (Object.keys(profileUpdates).length > 0) {
        await authenticatedFetch('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify(profileUpdates)
        });
      }
      
      if (Object.keys(healthUpdates).length > 0) {
        await authenticatedFetch('/api/settings/health', {
          method: 'PATCH',
          body: JSON.stringify(healthUpdates)
        });
      }
      
      return await this.fetchProfile();
    } catch (error) {
      console.error("updateProfile failed:", error);
      throw error;
    }
  }
};

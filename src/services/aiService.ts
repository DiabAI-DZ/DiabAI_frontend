import { LogEntry, ScanResult, AISummary } from './types';
import { apiService } from './apiService';

// --- CONFIGURATION ---
export const AI_BASE_URL = "http://your-ai-service.com";

// --- SERVICE FUNCTIONS ---

export const aiService = {
  async processGlucometerImage(imageUri: string): Promise<ScanResult> {
    console.log(`[AI] Processing image via apiService.scanMeasurementImage`, imageUri);
    try {
      const response = await apiService.scanMeasurementImage(imageUri);
      return {
        value: response.detected_value,
        unit: response.detected_unit || 'mg/dL',
        confidence: response.confidence,
        timestamp: new Date().toISOString(),
        imageUri: imageUri,
        imagePath: response.image_path
      };
    } catch (e: any) {
      console.error("[AI] processGlucometerImage failed:", e);
      throw new Error(e.message || "Failed to scan glucometer image. Please ensure the screen is clear and try again.");
    }
  },

  /**
   * Generates insights by fetching them from the backend.
   */
  async getAIInsights(userLogs: LogEntry[], query: string): Promise<string> {
    console.log(`[AI] Fetching insights for query: ${query}`);
    try {
      // For now we just fetch the general recommendations as a proxy for 'insights'
      // since the backend doesn't have a specific GET /chat endpoint yet.
      const recommendations = await apiService.fetchRecommendations();
      if (recommendations.length > 0) {
        return recommendations[0].description;
      }
      return "Keep tracking your data to receive personalized AI insights!";
    } catch (e) {
      console.error("[AI] Failed to fetch insights:", e);
      return "Unable to connect to AI service. Please try again later.";
    }
  },

  /**
   * Fetches the daily summary from the backend.
   */
  async getAIDailySummary(userLogs: LogEntry[]): Promise<AISummary> {
    console.log(`[AI] Fetching daily summary`);
    try {
      const summaryData = await apiService.fetchAISummary();
      return {
        summary: summaryData.summary || "No summary available for today.",
        recommendation: summaryData.recommendation || "Continue monitoring your levels.",
        status: summaryData.status || "Normal"
      };
    } catch (e) {
      console.error("[AI] Failed to fetch summary:", e);
      return {
        summary: "Error connecting to AI service.",
        recommendation: "Check your connection.",
        status: "Normal"
      };
    }
  }
};

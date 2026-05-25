import { LogEntry, ScanResult, AISummary } from './types';
import { apiService } from './apiService';

// --- CONFIGURATION ---
export const AI_BASE_URL = "http://your-ai-service.com";

// --- SERVICE FUNCTIONS ---

export const aiService = {
  /**
   * Simulates an image-to-text vision model extracting blood sugar from a photo.
   */
  async processGlucometerImage(imageUri: string): Promise<ScanResult> {
    console.log(`[AI] Processing image at ${AI_BASE_URL}/vision`, imageUri);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulating a random failure for UX testing (e.g. 10% chance)
        if (Math.random() < 0.1) {
          reject(new Error("Focus error: Could not read glucometer display. Please try again."));
          return;
        }

        // Return a realistic mock result
        resolve({
          value: Math.floor(Math.random() * (160 - 80) + 80), // Random value between 80 and 160
          unit: "mg/dL",
          confidence: 0.94,
          timestamp: new Date().toISOString(),
          imageUri: imageUri
        });
      }, 2500); // Realistic AI processing delay
    });
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

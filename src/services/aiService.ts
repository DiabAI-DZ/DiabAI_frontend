import { LogEntry, ScanResult, AISummary } from './types';

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
   * Simulates an LLM analyzing log history to provide personalized insights.
   */
  async getAIInsights(userLogs: LogEntry[], query: string): Promise<string> {
    console.log(`[AI] Generating insights at ${AI_BASE_URL}/chat`, { logsCount: userLogs.length, query });

    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "Based on your recent trends, your glucose is 15% more stable after evening walks. I suggest continuing this routine.",
          "I noticed a spike after your breakfast yesterday. It might be related to the high carb intake in the Avocado Toast.",
          "Your overnight levels are slightly lower than usual. Consider a small protein-rich snack before bed.",
          "You've stayed within your target range for 4 days straight! Great job maintaining consistency."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        resolve(randomResponse);
      }, 2000);
    });
  },

  /**
   * Simulates a daily summary generation.
   */
  async getAIDailySummary(userLogs: LogEntry[]): Promise<AISummary> {
    console.log(`[AI] Generating summary at ${AI_BASE_URL}/summary`);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          summary: "Your glucose levels were remarkably stable today, staying within range 88% of the time.",
          recommendation: "Increase fiber in your dinner to prevent the slight 10:00 PM spike we've seen recently.",
          status: "Normal"
        });
      }, 1500);
    });
  }
};

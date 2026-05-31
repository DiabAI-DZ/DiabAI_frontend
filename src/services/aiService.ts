import { LogEntry, ScanResult, AISummary, MealScanResult } from './types';
import { apiService } from './apiService';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

// Safely attempt to import TextRecognition only if not on web and potentially available 
// In a real environment, we'd use a dynamic import or a check, but for Expo Go 
// compatibility, we'll try-catch the usage.
let TextRecognition: any = null;
try {
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (e) {
  // Module not found or native linking missing (Expo Go)
}

import { authApi } from './authApi';

// Use the same base URL as the Auth/API service
export const AI_BASE_URL = authApi.baseUrl;

// --- HELPERS ---

const preprocessImage = async (uri: string) => {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [], { compress: 1 });
    const { width, height } = result;

    // Use a tighter center crop (70%) as glucometers usually have screens in the middle
    const cropSize = Math.min(width, height) * 0.7;
    const originX = (width - cropSize) / 2;
    const originY = (height - cropSize) / 2;

    return await ImageManipulator.manipulateAsync(
      uri,
      [
        { 
          crop: { 
            originX, 
            originY, 
            width: cropSize, 
            height: cropSize 
          } 
        },
        // Upscale and try to normalize brightness (limited in Expo, but we can try to resize to a smaller size then larger to blur noise, or just high res)
        { resize: { width: 1500 } } 
      ],
      { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
    );
  } catch (err) {
    console.warn("[AI] Preprocessing failed:", err);
    return { uri };
  }
};

const validateReading = (value: number, unit: string): boolean => {
  if (unit.toLowerCase().includes('mmol')) {
    return value >= 1.1 && value <= 33.3;
  }
  return value >= 20 && value <= 600;
};

// --- SERVICE FUNCTIONS ---

import { tfliteService } from './tfliteService';

export const aiService = {
  async processGlucometerImage(imageUri: string): Promise<ScanResult> {
    console.log(`[AI] Processing image (Hybrid-Backend):`, imageUri);
    
    try {
      // Direct call to Gemini/Backend Hybrid Pipeline
      console.log(`[AI] Sending image to Backend for analysis...`);
      
      const response = await apiService.scanMeasurementImage(imageUri);
      
      console.log(`[AI] Backend Response:`, response);

      if (response.detected_value <= 0) {
          throw new Error("AI couldn't read the image. Please ensure the screen is clear.");
      }

      return {
        value: response.detected_value,
        unit: (response.detected_unit || 'mg/dL') as any,
        confidence: response.confidence || 0.9,
        timestamp: new Date().toISOString(),
        imageUri: imageUri,
      };
    } catch (apiErr: any) {
      console.error("[AI] Backend scan failed:", apiErr.message);
      throw new Error(apiErr.message || "Failed to connect to AI service.");
    }
  },

  async processMealImage(imageUri: string): Promise<MealScanResult> {
    console.log(`[AI] Processing meal image via apiService.scanMealImage`, imageUri);
    try {
      const response = await apiService.scanMealImage(imageUri);
      return {
        title: response.food_items[0]?.name || "Meal Detected",
        meal_type: response.totals.estimated_glucose_impact_mg_dl > 20 ? "lunch" : "snack", // default fallbacks
        calories: response.totals.calories,
        carbs: response.totals.carbohydrates_g,
        protein: response.totals.protein_g,
        fat: response.totals.fat_g,
        impact: response.totals.estimated_glucose_impact_mg_dl,
        confidence: response.confidence !== undefined && response.confidence !== null ? response.confidence : 0.95,
        imageUri: imageUri,
        imagePath: response.image_path,
        predicted_label: response.predicted_label,
        model_version: response.model_version,
        food_items: response.food_items.map((item: any) => ({
          name: item.name,
          carbs: item.carbs_g
        }))
      };
    } catch (e: any) {
      console.error("[AI] processMealImage failed:", e);
      throw new Error(e.message || "Failed to classify meal image. Please try again.");
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

import { OpenCV, ObjectType, DataTypes } from 'react-native-fast-opencv';
import * as FileSystem from 'expo-file-system/legacy';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';

export const CVService = {
  yoloModel: null as TensorflowModel | null,

  async initYOLO() {
    if (this.yoloModel) return;
    try {
      console.log("[CV] Loading YOLO detection model...");
      const asset = Asset.fromModule(require('../../assets/models/device_detector.tflite'));
      await asset.downloadAsync();
      this.yoloModel = await loadTensorflowModel({ url: asset.localUri! });
      console.log("[CV] YOLO model loaded successfully");
    } catch (err) {
      console.warn("[CV] Failed to load YOLO model (may not exist yet):", err);
    }
  },

  async detectWithYOLO(imageUri: string): Promise<Rectangle | null> {
    await this.initYOLO();
    if (!this.yoloModel) return null;

    try {
      console.log(`[CV] Running YOLO device detection...`);
      // 1. Get image pixels (YOLO typically expects 640x640)
      // For now we'll use a 640x640 resize.
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 640, height: 640 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Extraction helper (similar to tfliteService but for RGB/Detection)
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, { encoding: 'base64' as any });
      const mat = OpenCV.base64ToMat(base64);
      const bufferData = OpenCV.matToBuffer(mat, 'uint8');
      const uint8Pixels = bufferData.buffer;

      // Normalize to Float32 [0, 1]
      const input = new Float32Array(640 * 640 * 3);
      for (let i = 0; i < uint8Pixels.length; i++) {
        input[i] = uint8Pixels[i] / 255.0;
      }

      // 2. Run Inference
      // YOLOv8/11 output is [1, 84, 8400] (for 80 classes) or similar.
      // We assume the user's model is trained for 1 class (device/screen).
      const output = await this.yoloModel.run([input]);
      const results = output[0] as Float32Array;

      // 3. Post-process (Non-Maximum Suppression)
      // Simplified: Find the box with highest confidence
      // Result shape is [num_params, num_boxes]
      let bestConf = 0;
      let bestBox = null;

      // This is a placeholder for actual YOLO post-processing 
      // specific to the model's output architecture.
      // Once the .tflite is provided, I will adjust the indices.
      
      console.log("[CV] YOLO inference complete. Processing result...");
      
      return null; // Return null until we verify output dimensions
    } catch (err) {
      console.error("[CV] YOLO inference failed:", err);
      return null;
    }
  },

  async detectScreenRegion(imageUri: string): Promise<Rectangle | null> {
    // Try YOLO first if available, fallback to classical OpenCV
    const yoloResult = await this.detectWithYOLO(imageUri);
    if (yoloResult) return yoloResult;
    
    try {
      console.log(`[CV] Using classical OpenCV detection fallback...`);
      // ... existing OpenCV logic ...
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any, // Bypass strict enum check if needed
      });
      const mat = OpenCV.base64ToMat(base64);
      
      const matInfo = OpenCV.toJSValue(mat);
      const cols = matInfo.cols;
      const rows = matInfo.rows;

      // 1. Grayscale
      const gray = OpenCV.createObject(ObjectType.Mat, rows, cols, DataTypes.CV_8U);
      OpenCV.invoke('cvtColor', mat, gray, 6); // COLOR_RGBA2GRAY = 6

      // 2. Gaussian Blur
      const blurred = OpenCV.createObject(ObjectType.Mat, rows, cols, DataTypes.CV_8U);
      const ksize = OpenCV.createObject(ObjectType.Size, 5, 5);
      OpenCV.invoke('GaussianBlur', gray, blurred, ksize, 0);

      // 3. Canny
      const edges = OpenCV.createObject(ObjectType.Mat, rows, cols, DataTypes.CV_8U);
      OpenCV.invoke('Canny', blurred, edges, 50, 150);

      // 4. Find Contours
      const contoursVector = OpenCV.createObject(ObjectType.PointVectorOfVectors);
      OpenCV.invoke('findContours', edges, contoursVector, 0, 2);

      const contoursData = OpenCV.toJSValue(contoursVector);
      const contoursArray = (contoursData as any).array || [];

      let bestRect: Rectangle | null = null;
      let maxScore = -1;

      for (let i = 0; i < contoursArray.length; i++) {
        const contourMat = OpenCV.copyObjectFromVector(contoursVector, i);
        const perimeterObj = OpenCV.invoke('arcLength', contourMat, true) as any;
        const perimeter = perimeterObj.value || 0;
        
        const approx = OpenCV.createObject(ObjectType.PointVector);
        OpenCV.invoke('approxPolyDP', contourMat, approx, 0.02 * perimeter, true);

        const approxPoints = (OpenCV.toJSValue(approx) as any).array || [];

        if (approxPoints.length === 4) {
          const rectObj = OpenCV.invoke('boundingRect', approx);
          const rect = OpenCV.toJSValue(rectObj) as any;
          
          const aspectRatio = rect.width / rect.height;
          const area = rect.width * rect.height;
          const totalArea = cols * rows;
          const areaRatio = area / totalArea;

          if (aspectRatio > 1.2 && aspectRatio < 4.5 && areaRatio > 0.015 && areaRatio < 0.6) {
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;
            const distFromCenter = Math.sqrt(Math.pow(centerX - cols / 2, 2) + Math.pow(centerY - rows / 2, 2));
            const score = (1 - distFromCenter / (cols / 1.5)) + areaRatio * 3;

            if (score > maxScore) {
              maxScore = score;
              bestRect = { x: rect.x as number, y: rect.y as number, width: rect.width as number, height: rect.height as number };
            }
          }
        }
      }

      return bestRect;
    } catch (err) {
      console.error("[CV] Screen detection failed:", err);
      return null;
    }
  }
};

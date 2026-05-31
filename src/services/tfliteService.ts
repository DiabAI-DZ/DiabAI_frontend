import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { OpenCV, ObjectType, DataTypes } from 'react-native-fast-opencv';

// Character set and CTC configuration based on model specs:
// Input: [1, 32, 128, 1], Output: [1, 32, 21]
// Charset: 0123456789.-HiLoEr (index 0-19)
// CTC Blank: index 20
const CHARSET = "0123456789.-HiLoEr "; // 19 chars + space = 20 total
const BLANK_IDX = 20;

let model: TensorflowModel | null = null;

export const tfliteService = {
  async initModel() {
    if (model) return;
    try {
      console.log("[TFLite] Loading model...");
      const asset = Asset.fromModule(require('../../assets/models/glucometer_ocr.tflite'));
      await asset.downloadAsync();
      
      model = await loadTensorflowModel({ url: asset.localUri! });
      console.log("[TFLite] Model loaded successfully");
    } catch (err) {
      console.error("[TFLite] Failed to load model:", err);
    }
  },

  async recognize(imageUri: string): Promise<{ value: string; confidence: number }> {
    await this.initModel();
    if (!model) throw new Error("TFLite Model not loaded");

    // 1. Preprocess using OpenCV (Fastest on-device)
    const pixels = await this.getNormalizedPixels(imageUri);
    
    // 2. Inference
    const output = await model.run([pixels]);
    
    // 3. Decode (Greedy CTC)
    return this.decodeCTC(output[0] as any);
  },

  async getNormalizedPixels(uri: string): Promise<Float32Array> {
    try {
      // Load image into OpenCV Mat
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const mat = OpenCV.base64ToMat(base64);
      const { cols, rows } = OpenCV.toJSValue(mat);

      // A. Resize to 128x32
      const resized = OpenCV.createObject(ObjectType.Mat, 32, 128, DataTypes.CV_8U);
      const sizeObj = OpenCV.createObject(ObjectType.Size, 128, 32);
      (OpenCV.invoke as any)('resize', mat, resized, sizeObj, 0, 0, 1);

      // B. Convert to Grayscale
      const gray = OpenCV.createObject(ObjectType.Mat, 32, 128, DataTypes.CV_8U);
      OpenCV.invoke('cvtColor', resized, gray, 6); // COLOR_BGRA2GRAY or RGBA2GRAY = 6

      // C. Extract raw buffer
      const bufferData = OpenCV.matToBuffer(gray, 'uint8');
      const uint8Pixels = bufferData.buffer;

      // D. Normalize to Float32 [0, 1]
      const normalized = new Float32Array(128 * 32);
      for (let i = 0; i < uint8Pixels.length; i++) {
        normalized[i] = uint8Pixels[i] / 255.0;
      }
      
      return normalized;
    } catch (e) {
      console.error("[TFLite] OpenCV preprocessing failed:", e);
      // Fallback to dummy data instead of crashing
      return new Float32Array(128 * 32).fill(0.5);
    }
  },

  decodeCTC(output: Float32Array | number[]): { value: string; confidence: number } {
    let text = "";
    let lastCharIdx = -1;
    let totalConf = 0;
    let charCount = 0;

    const seqLen = 32;
    const numClasses = 21;

    // The output tensor should be [32, 21]
    for (let i = 0; i < seqLen; i++) {
        let maxIdx = 0;
        let maxVal = -1;
        
        for (let j = 0; j < numClasses; j++) {
            const val = output[i * numClasses + j];
            if (val > maxVal) {
                maxVal = val;
                maxIdx = j;
            }
        }

        // CTC Logic: Skip blanks and consecutive identical characters
        if (maxIdx !== BLANK_IDX && maxIdx !== lastCharIdx) {
            if (CHARSET[maxIdx]) {
                text += CHARSET[maxIdx];
                totalConf += maxVal;
                charCount++;
            }
        }
        lastCharIdx = maxIdx;
    }

    return {
        value: text.trim(),
        confidence: charCount > 0 ? totalConf / charCount : 0
    };
  }
};

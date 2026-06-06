import { useCallback, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { tfliteService } from '../../../services/tfliteService';
import type { Rectangle } from '../../../services/CVService';
import { applyMealSelection, buildManualResult, nowMeta, parseGlucoseReading } from '../scanLogic';
import { useScanCamera, type UseScanCameraResult } from './useScanCamera';
import { useScanSave } from './useScanSave';
import type { OcrModel, ScanMode, ScanResultState, ScanState, ToastType } from '../scanTypes';

interface UseScanControllerArgs {
  mode: ScanMode;
  showToast: (message: string, type?: ToastType) => void;
  slideOut: (cb: () => void) => void;
  onComplete: () => void;
}

const errText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export interface ScanController {
  photo: string | null;
  state: ScanState;
  ocrModel: OcrModel;
  scanResult: ScanResultState | null;
  setScanResult: React.Dispatch<React.SetStateAction<ScanResultState | null>>;
  detectedRect: Rectangle | null;
  errorMsg: string;
  notes: string;
  setNotes: (v: string) => void;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  camera: UseScanCameraResult;
  processFinalOCR: (uri: string, cropRect?: Rectangle) => Promise<void>;
  handleSave: () => Promise<void>;
  enterManualMode: () => void;
  selectMeal: (name: string) => void;
  toggleOcrModel: () => void;
  retake: () => void;
}

/** Central scan state machine: capture → analyze (OCR/meal) → confirm/save, plus manual entry. */
export function useScanController({ mode, showToast, slideOut, onComplete }: UseScanControllerArgs): ScanController {
  const { profile } = useUser();
  const { scanImage, scanMeal } = useData();

  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>('camera');
  const [ocrModel, setOcrModel] = useState<OcrModel>('backend');
  const [scanResult, setScanResult] = useState<ScanResultState | null>(null);
  const [detectedRect] = useState<Rectangle | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const processFinalOCR = useCallback(async (uri: string, cropRect?: Rectangle) => {
    setState('analyzing');
    try {
      let finalUri = uri;
      if (cropRect) {
        const m = await ImageManipulator.manipulateAsync(
          uri,
          [{ crop: { originX: cropRect.x, originY: cropRect.y, width: cropRect.width, height: cropRect.height } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        finalUri = m.uri;
      }
      let rawText = '';
      let confidence = 0;
      let imagePath: string | undefined;
      if (ocrModel === 'tflite') {
        const r = await tfliteService.recognize(finalUri);
        rawText = r.value.trim();
        confidence = r.confidence;
      } else {
        const r = await scanImage(finalUri);
        rawText = String(r.value).trim();
        confidence = r.confidence;
        imagePath = r.imagePath;
      }
      setScanResult(parseGlucoseReading(rawText, confidence, finalUri, imagePath));
      setState('confirm');
    } catch (err) {
      setErrorMsg(errText(err, 'Failed to read the glucometer screen.'));
      setState('error');
    }
  }, [ocrModel, scanImage]);

  const handleAnalyze = useCallback(async (uri: string) => {
    if (mode !== 'meal') { processFinalOCR(uri); return; }
    setState('analyzing');
    try {
      const result = await scanMeal(uri);
      setScanResult({ ...result, ...nowMeta() });
      setState('confirm');
    } catch (err) {
      setErrorMsg(errText(err, 'Failed to process the meal image.'));
      setState('error');
    }
  }, [mode, scanMeal, processFinalOCR]);

  const onCaptured = useCallback((uri: string) => { setPhoto(uri); handleAnalyze(uri); }, [handleAnalyze]);
  const onCameraError = useCallback((msg: string) => { setErrorMsg(msg); setState('error'); }, []);
  const camera = useScanCamera(onCaptured, onCameraError);

  const handleSave = useScanSave({ mode, scanResult, notes, isEditing, photo, showToast, slideOut, onComplete });

  const enterManualMode = useCallback(() => {
    setScanResult(buildManualResult(mode, profile?.glucoseUnit));
    setIsEditing(true);
    setState('confirm');
  }, [mode, profile?.glucoseUnit]);

  const selectMeal = useCallback((name: string) => {
    setScanResult((prev) => applyMealSelection(prev || {}, name));
    setIsEditing(false);
  }, []);

  const toggleOcrModel = useCallback(() => {
    setOcrModel((m) => {
      const next: OcrModel = m === 'tflite' ? 'backend' : 'tflite';
      showToast(`Switched to ${next === 'tflite' ? 'Local TFLite' : 'Cloud YOLO+TrOCR'} model`, 'info');
      return next;
    });
  }, [showToast]);

  const retake = useCallback(() => { setPhoto(null); setState('camera'); }, []);

  return {
    photo, state, ocrModel, scanResult, setScanResult, detectedRect, errorMsg, notes, setNotes, isEditing, setIsEditing,
    camera, processFinalOCR, handleSave, enterManualMode, selectMeal, toggleOcrModel, retake,
  };
}

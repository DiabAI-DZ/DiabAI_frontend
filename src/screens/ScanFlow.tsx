import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { X, Camera as CameraIcon, Zap, RotateCcw, Check, ChevronRight, AlertCircle, Plus, Image as ImageIcon, FileText, Flame, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from 'react-native-gesture-handler';
import { convertGlucose } from '../services/apiService';
import mealNames from '../assets/meal_names.json';
import foodDatabaseMin from '../assets/food_database_min.json';

interface ScanFlowProps {
  mode: 'glucose' | 'meal';
  onBack: () => void;
  onComplete: () => void;
}

import { CVService, Rectangle } from '../services/CVService';
import { ScreenDetectionOverlay } from '../components/ScreenDetectionOverlay';
import { aiService } from '../services/aiService';
import { tfliteService } from '../services/tfliteService';
import * as ImageManipulator from 'expo-image-manipulator';

type ScanState = 'camera' | 'analyzing' | 'adjustment' | 'confirm' | 'manual' | 'error';

const ScanFlow: React.FC<ScanFlowProps> = ({ mode, onBack, onComplete }) => {
  const { C, isDark } = useTheme();
  const { addLog, scanImage, scanMeal } = useData();
  const { profile, refreshProfile } = useUser();
  const [permission, requestPermission] = useCameraPermissions();

  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>('camera');
  const [ocrModel, setOcrModel] = useState<'tflite' | 'backend'>('backend');
  const [scanResult, setScanResult] = useState<any>(null);
  const [detectedRect, setDetectedRect] = useState<Rectangle | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sheetHeight, setSheetHeightState] = useState<'stock' | 'full'>('stock');
  const sheetHeightRef = useRef<'stock' | 'full'>('stock');
  const setSheetHeight = (h: 'stock' | 'full') => {
    sheetHeightRef.current = h;
    setSheetHeightState(h);
  };
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

  const { height: screenHeight } = Dimensions.get('window');
  const TOP_MARGIN = 60;
  const SHEET_HEIGHT = screenHeight - TOP_MARGIN;
  const posFull = 0;

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(1)).current;
  const lastTranslateY = useRef(SHEET_HEIGHT);
  const dragStartY = useRef(SHEET_HEIGHT);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      lastTranslateY.current = value;
    });
    return () => {
      translateY.removeListener(id);
    };
  }, [translateY]);

  // Slide the sheet + backdrop out together, then call callback
  const slideOutSheet = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  // Animated Multi-toast System
  interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    anim: Animated.Value;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString();
    const anim = new Animated.Value(0);
    const newToast: ToastItem = { id, message, type, anim };

    setToasts(prev => [...prev, newToast]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      });
    }, 3000);
  };

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleDiscard = () => {
    setShowDiscardConfirm(true);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Capture the current position at the moment the finger lands
        dragStartY.current = lastTranslateY.current;
      },
      onPanResponderMove: (_evt, gestureState) => {
        // Map finger movement directly — sheet follows the finger
        const newY = dragStartY.current + gestureState.dy;
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const targetPosStock = SHEET_HEIGHT * (mode === 'meal' ? 0.2 : 0.3);

        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        if (isTap) {
          const nextState = sheetHeightRef.current === 'stock' ? 'full' : 'stock';
          setSheetHeight(nextState);
          const targetPos = nextState === 'full' ? posFull : targetPosStock;
          Animated.spring(translateY, {
            toValue: targetPos,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
          return;
        }

        let targetPos = targetPosStock;
        let nextState: 'stock' | 'full' = 'stock';

        if (sheetHeightRef.current === 'stock') {
          if (gestureState.dy < -60) {
            targetPos = posFull;
            nextState = 'full';
          } else if (gestureState.dy > 80) {
            setShowDiscardConfirm(true);
            targetPos = targetPosStock;
            nextState = 'stock';
          } else {
            targetPos = targetPosStock;
            nextState = 'stock';
          }
        } else {
          if (gestureState.dy > 60) {
            targetPos = targetPosStock;
            nextState = 'stock';
          } else {
            targetPos = posFull;
            nextState = 'full';
          }
        }

        setSheetHeight(nextState);
        Animated.spring(translateY, {
          toValue: targetPos,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;

  // Sync sheet entry animation when state is 'confirm'
  useEffect(() => {
    if (state === 'confirm') {
      const targetPosStock = SHEET_HEIGHT * (mode === 'meal' ? 0.2 : 0.3);
      setSheetHeight('stock');
      backdropAnim.setValue(0);
      translateY.setValue(SHEET_HEIGHT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: targetPosStock,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state, mode]);

  useEffect(() => {
    (async () => {
      if (permission && !permission.granted && permission.canAskAgain) {
        await requestPermission();
      }
    })();
  }, [permission]);

  const lookupMealNutrients = (mealName: string) => {
    if (!mealName) return null;
    const key = mealName.toLowerCase().trim();
    let dbFood = (foodDatabaseMin as any)[key];
    if (!dbFood) {
      const foundKey = Object.keys(foodDatabaseMin).find(k => k.includes(key) || key.includes(k));
      if (foundKey) {
        dbFood = (foodDatabaseMin as any)[foundKey];
      }
    }
    return dbFood;
  };

  const selectMeal = (name: string) => {
    const dbFood = lookupMealNutrients(name);
    if (dbFood) {
      setScanResult({
        ...scanResult,
        title: name,
        calories: dbFood.calories,
        carbs: dbFood.carbs,
        protein: dbFood.protein || 0,
        fat: dbFood.fat || 0,
        impact: dbFood.impact,
      });
    } else {
      setScanResult({
        ...scanResult,
        title: name,
      });
    }
    setIsEditing(false);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync();
        if (data) {
          setPhoto(data.uri);
          handleAnalyze(data.uri);
        }
      } catch (err) {
        setErrorMsg("Failed to take picture. Please try again.");
        setState('error');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        base64: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setPhoto(selectedUri);
        handleAnalyze(selectedUri);
      }
    } catch (err) {
      setErrorMsg("Failed to pick image from gallery. Please try again.");
      setState('error');
    }
  };

  const handleAnalyze = async (uri: string) => {
    if (mode === 'meal') {
      setState('analyzing');
      try {
        const result = await scanMeal(uri);
        setScanResult({
          ...result,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
        });
        setState('confirm');
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to process the meal image.");
        setState('error');
      }
      return;
    }

    setState('analyzing');
    processFinalOCR(uri);
  };

  const processFinalOCR = async (uri: string, cropRect?: Rectangle) => {
    setState('analyzing');
    try {
      let finalUri = uri;
      if (cropRect) {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ crop: { originX: cropRect.x, originY: cropRect.y, width: cropRect.width, height: cropRect.height } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = manipulated.uri;
      }

      let rawText = "";
      let configConfidence = 0.0;
      
      if (ocrModel === 'tflite') {
        const ocrResult = await tfliteService.recognize(finalUri);
        rawText = ocrResult.value.trim();
        configConfidence = ocrResult.confidence;
        console.log(`[ScanFlow] TFLite OCR Result:`, ocrResult);
      } else {
        console.log(`[ScanFlow] Using backend OCR pipeline...`);
        const backendResult = await scanImage(finalUri);
        rawText = String(backendResult.value).trim();
        configConfidence = backendResult.confidence;
        console.log(`[ScanFlow] Backend OCR Result:`, backendResult);
      }

      // Handle special glucometer readings
      if (/^(Hi|HI|HIGH)$/i.test(rawText)) {
        setScanResult({
          value: 500,
          unit: 'mg/dL',
          confidence: configConfidence,
          tag: 'Fasting',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          imageUri: finalUri,
        });
        setState('confirm');
        return;
      }
      if (/^(Lo|LO|LOW)$/i.test(rawText)) {
        setScanResult({
          value: 20,
          unit: 'mg/dL',
          confidence: configConfidence,
          tag: 'Fasting',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          imageUri: finalUri,
        });
        setState('confirm');
        return;
      }
      if (/^(Er|ERR|ERROR)$/i.test(rawText)) {
        throw new Error("Glucometer shows an error code. Please retry with a valid reading.");
      }

      // Parse the numeric value
      const numericValue = parseFloat(rawText.replace(/[^0-9.]/g, ''));
      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error(`Could not read a valid glucose value from the image. OCR detected: "${rawText}"`);
      }

      // Heuristic unit detection: mmol/L values are typically 1.1–33.3, mg/dL values are 20–600
      const unit = numericValue <= 33.3 && rawText.includes('.') ? 'mmol/L' : 'mg/dL';

      setScanResult({
        value: numericValue,
        unit,
        confidence: configConfidence,
        tag: 'Fasting',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        imageUri: finalUri,
      });
      setState('confirm');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to read the glucometer screen.");
      setState('error');
    }
  };

  const handleSave = async () => {
    if (!scanResult) return;
    
    try {
      const now = new Date().toISOString();
      const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (mode === 'glucose') {
        await addLog({
          type: "measurement",
          value: scanResult.value,
          unit: scanResult.unit || "mg/dL",
          status: getStatus(scanResult.value, scanResult.unit || "mg/dL"),
          time: formatTime(now),
          date: now,
          tag: scanResult.tag || (state === 'manual' || isEditing ? "Manual" : "Scan"),
          notes: notes,
          trend: "stable",
          imagePath: scanResult.imagePath,
        } as any);
        await refreshProfile();
        showToast("Glucose reading logged successfully!", "success");
      } else {
        await addLog({
          type: "meal",
          name: scanResult.title,
          mealType: scanResult.meal_type,
          time: formatTime(now),
          date: now,
          carbs: scanResult.carbs,
          calories: scanResult.calories,
          protein: scanResult.protein || 0,
          fat: scanResult.fat || 0,
          impact: scanResult.impact,
          image: photo || "",
          imagePath: scanResult.imagePath,
          food_items: scanResult.food_items || [],
          notes: notes,
          tags: [],
          predicted_label: scanResult.predicted_label,
          corrected_label: scanResult.title,
          model_version: scanResult.model_version,
          confidence: scanResult.confidence
        } as any);
        showToast("Meal scan logged successfully!", "success");
      }
      // Delay briefly so toast appears before sheet slides away
      setTimeout(() => slideOutSheet(onComplete), 600);
    } catch (err) {
      showToast("Failed to save the entry.", "error");
    }
  };

  const getStatus = (value: number, unit: string) => {
    const isMmol = unit === 'mmol/L';
    const lowLimit = isMmol ? convertGlucose(profile?.goals?.min || 70, 'mmol/L', 'mg/dL') : (profile?.goals?.min || 70);
    const highLimit = isMmol ? convertGlucose(profile?.goals?.max || 140, 'mmol/L', 'mg/dL') : (profile?.goals?.max || 140);
    if (value < lowLimit) return 'Low';
    if (value > highLimit) return 'High';
    return 'Normal';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
        <X color="#FFF" size={24} />
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.headerTitle}>
          {mode === 'glucose' ? 'Glucose Measurement' : 'Meal Scan'}
        </Text>
        {mode === 'glucose' && (
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
            onPress={() => {
              const nextMode = ocrModel === 'tflite' ? 'backend' : 'tflite';
              setOcrModel(nextMode);
              showToast(`Switched to ${nextMode === 'tflite' ? 'Local TFLite' : 'Cloud YOLO+TrOCR'} model`, 'info');
            }}
          >
            <Zap color={ocrModel === 'tflite' ? '#FFD700' : '#4DB8FF'} size={12} style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
              {ocrModel === 'tflite' ? 'Model: TFLite (Local)' : 'Model: YOLO+TrOCR (Cloud)'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  const enterManualMode = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    if (mode === 'glucose') {
      setScanResult({
        value: 0,
        unit: profile?.glucoseUnit || 'mg/dL',
        tag: 'Fasting',
        time: timeStr,
        date: dateStr,
      });
      setIsEditing(true);
      setState('confirm');
    } else {
      setScanResult({
        title: 'New Meal',
        meal_type: 'snack',
        calories: 0,
        carbs: 0,
        impact: 0,
        food_items: [],
        time: timeStr,
        date: dateStr,
      });
      setIsEditing(true);
      setState('confirm');
    }
  };

  const renderAdjustment = () => (
    photo ? (
      <ScreenDetectionOverlay
        imageUri={photo}
        initialRect={detectedRect}
        onConfirm={(rect) => processFinalOCR(photo, rect)}
        onCancel={onBack}
        onRetake={() => { setPhoto(null); setState('camera'); }}
      />
    ) : null
  );

  const renderCamera = () => {
    if (!permission) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator size="large" color={C.red} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 24 }}>
          <AlertCircle size={48} color={C.red} style={{ marginBottom: 16 }} />
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>Camera Permission Required</Text>
          <Text style={{ color: '#AAA', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>We need camera access to scan your glucometer and meals.</Text>
          <TouchableOpacity 
            onPress={requestPermission}
            style={{ backgroundColor: C.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          ref={cameraRef} 
          enableTorch={flash === 'on'}
        />
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.flashBtn} 
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
          >
            <Zap color={flash === 'on' ? '#FFD700' : '#FFF'} size={24} />
          </TouchableOpacity>

          <View style={styles.scannerFrameContainer}>
            <View style={[styles.scannerFrame, mode === 'meal' && { width: 300, height: 300, borderRadius: 32 }]} />
          </View>

          <Text style={styles.scanHint}>
            {mode === 'glucose' ? 'Align glucometer screen within the box' : 'Position your meal within the frame'}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.manualBtn} onPress={enterManualMode}>
            <Plus color="#FFF" size={24} />
            <Text style={styles.manualText}>Manual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualBtn} onPress={pickImage}>
            <ImageIcon color="#FFF" size={24} />
            <Text style={styles.manualText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalyzing = () => (
    <View style={styles.previewContainer}>
      {photo && <Image source={{ uri: photo }} style={styles.preview} />}
      <View style={styles.scanningOverlay}>
        <View style={styles.shimmerContainer}>
          <ActivityIndicator size="large" color={C.red} />
          <View style={[styles.shimmerBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </View>
        </View>
        <Text style={styles.scanningText}>AI is analyzing {mode}...</Text>
      </View>
    </View>
  );

  const renderMealConfirmSheet = () => {
    const searchVal = scanResult?.title || '';
    const query = searchVal.toLowerCase().trim();
    const filteredSuggestions = query
      ? mealNames.filter(name => name.toLowerCase().includes(query) && name.toLowerCase().trim() !== query).slice(0, 5)
      : [];

    const isValidMeal = mealNames.some(name => name.toLowerCase().trim() === searchVal.toLowerCase().trim());
    const canSaveEdit = isValidMeal;

    return (
      <View style={styles.sheetContainer}>
        {/* Dark backdrop — tap to discard (animated opacity for smooth entry/exit) */}
        <Animated.View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.52)', opacity: backdropAnim }]} pointerEvents="none" />
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleDiscard}
          disabled={showDiscardConfirm}
        />

        <Animated.View style={[
          styles.sheetContent,
          {
            backgroundColor: C.bg,
            height: SHEET_HEIGHT,
            transform: [{ translateY }],
          },
        ]}>
          {/* ── Draggable Red Pill Handle (PanResponder) ── */}
          <View style={styles.sheetHeader}>
            <View
              {...panResponder.panHandlers}
              style={{ paddingVertical: 12, alignItems: 'center', width: '100%' }}
            >
              <View style={[styles.sheetHandle, { backgroundColor: C.red }]} />
            </View>

            {/* Header row: title + top-right checkmark shortcut */}
            <View style={styles.headerTop}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>Confirm Meal</Text>
              <TouchableOpacity
                onPress={() => handleSave()}
                disabled={!canSaveEdit}
                style={[styles.headerCheckBtn, {
                  backgroundColor: canSaveEdit ? C.red : C.redBg,
                  borderColor: C.red,
                  opacity: canSaveEdit ? 1 : 0.4,
                }]}
              >
                <Check size={18} color={canSaveEdit ? '#FFF' : C.red} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: SHEET_HEIGHT * 0.22 + 40 }]}
            showsVerticalScrollIndicator={false}
          >

            {/* Food photo */}
            <View style={styles.foodImageContainer}>
              <Image source={{ uri: photo || '' }} style={styles.foodImageLarge} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={styles.foodImageOverlay}
              />
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round((scanResult?.confidence || 0.85) * 100)}% Match
                </Text>
              </View>
            </View>

            {/* Meal name / editable title */}
            <View style={styles.mealTitleSection}>
              {isEditing ? (
                <View style={{ width: '100%' }}>
                  <TextInput
                    style={[styles.mealTitleInput, { color: C.text, borderBottomColor: C.redBorder }]}
                    value={scanResult?.title}
                    onChangeText={(val: string) => {
                      const dbFood = lookupMealNutrients(val);
                      if (dbFood) {
                        setScanResult({
                          ...scanResult,
                          title: val,
                          calories: dbFood.calories,
                          carbs: dbFood.carbs,
                          protein: dbFood.protein || 0,
                          fat: dbFood.fat || 0,
                          impact: dbFood.impact,
                        });
                      } else {
                        setScanResult({ ...scanResult, title: val });
                      }
                    }}
                    autoFocus
                  />
                  {filteredSuggestions.length > 0 && (
                    <View style={[styles.dropdownContainer, { backgroundColor: C.white, borderColor: C.redBorder }]}>
                      {filteredSuggestions.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[styles.dropdownItem, { borderBottomColor: C.redBg }]}
                          onPress={() => selectMeal(item)}
                        >
                          <Text style={[styles.dropdownText, { color: C.text }]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[styles.mealTitleMain, { color: C.text }]}>{scanResult?.title}</Text>
              )}
            </View>

            {/* ── 3-Column Macro Cards: Calories | Carbs | Glycemic Impact ── */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <View style={[styles.macroCard, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                <Flame size={20} color={C.red} />
                <Text style={[styles.macroValue, { color: C.red }]}>{scanResult?.calories || 0}</Text>
                <Text style={[styles.macroLabel, { color: C.textSm }]}>Calories</Text>
              </View>
              <View style={[styles.macroCard, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                <Zap size={20} color={C.red} />
                <Text style={[styles.macroValue, { color: C.red }]}>{scanResult?.carbs || 0}g</Text>
                <Text style={[styles.macroLabel, { color: C.textSm }]}>Carbs</Text>
              </View>
              <View style={[styles.macroCard, {
                backgroundColor: ((scanResult?.impact || 0) > 20 ? C.red : C.green) + '18',
                borderColor: (scanResult?.impact || 0) > 20 ? C.red : C.green,
              }]}>
                <TrendingUp size={20} color={(scanResult?.impact || 0) > 20 ? C.red : C.green} />
                <Text style={[styles.macroValue, { color: (scanResult?.impact || 0) > 20 ? C.red : C.green }]}>
                  +{scanResult?.impact || 0}
                </Text>
                <Text style={[styles.macroLabel, { color: C.textSm }]}>mg/dL</Text>
              </View>
            </View>

            {/* Validation notice */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: (isValidMeal ? C.green : C.red) + '15',
              borderColor: isValidMeal ? C.green : C.red,
              borderWidth: 1.5, borderRadius: 16,
              padding: 12, gap: 10, marginBottom: 12,
            }}>
              <AlertCircle size={18} color={isValidMeal ? C.green : C.red} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: isValidMeal ? C.green : C.red, flex: 1 }}>
                {isValidMeal
                  ? '✓ Meal matches database entry. Macros loaded.'
                  : '✗ Invalid meal name. Type to select from list or use exact name to commit.'}
              </Text>
            </View>

            {/* Data collection notice */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-start',
              backgroundColor: C.redBg,
              borderColor: C.redBorder,
              borderWidth: 1.5, borderRadius: 16,
              padding: 12, gap: 10, marginBottom: 20,
            }}>
              <TrendingUp size={16} color={C.textSm} />
              <Text style={{ fontSize: 11, color: C.textSm, flex: 1, lineHeight: 17 }}>
                By confirming or correcting this prediction, you help train and improve the DiabAI image recognition model.
              </Text>
            </View>

            {/* Meal type selector */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.subLabel, { color: C.text }]}>Meal Type</Text>
              <View style={styles.tagsRowCompact}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(t => {
                  const isSelected = scanResult?.meal_type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setScanResult({ ...scanResult, meal_type: t })}
                      style={[styles.tagBtnCompact, isSelected && { backgroundColor: C.red, borderColor: C.red }]}
                    >
                      <Text style={[styles.tagTextCompact, isSelected ? { color: '#FFF' } : { color: C.textSm }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FileText size={16} color={C.textSm} />
                <Text style={[styles.subLabel, { color: C.text, marginBottom: 0 }]}>
                  Add Notes{' '}
                  <Text style={{ fontSize: 11, fontWeight: '400', color: C.red + 'AA' }}>(optional)</Text>
                </Text>
              </View>
              <TextInput
                style={[styles.notesInputCompact, { color: C.text, backgroundColor: C.white, borderColor: C.redBorder }]}
                placeholder="How are you feeling? Any specific details about this meal?"
                placeholderTextColor={C.textXs}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
              <View style={[styles.charCountCompact, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                <Text style={{ fontSize: 10, color: C.textSm, textAlign: 'right' }}>{notes.length}/200</Text>
              </View>
            </View>

            {/* ── Bottom Actions: Confirm (75%) + Edit (25%) ── */}
            <View style={[styles.confirmActions, { paddingHorizontal: 0 }]}>
              <TouchableOpacity
                onPress={() => handleSave()}
                disabled={!canSaveEdit}
                style={[styles.mainConfirmBtn, { flex: 3, backgroundColor: C.red, opacity: canSaveEdit ? 1 : 0.6 }]}
              >
                <Check size={17} color="#FFF" />
                <Text style={styles.mainConfirmText}>Confirm Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={[styles.editBtn, { flex: 1, backgroundColor: C.redBg, borderColor: C.redBorder }]}
              >
                <Text style={[styles.editBtnText, { color: C.red, fontSize: 13 }]}>{isEditing ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  const renderConfirm = () => {
    if (mode === 'meal') return renderMealConfirmSheet();

    // ── Glucose confirm — bottom sheet, 30% backdrop / 70% sheet ──
    return (
      <View style={styles.sheetContainer}>
        {/* Dark backdrop — tap to discard (animated opacity for smooth entry/exit) */}
        <Animated.View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.52)', opacity: backdropAnim }]} pointerEvents="none" />
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleDiscard}
          disabled={showDiscardConfirm}
        />

        <Animated.View style={[
          styles.sheetContent,
          {
            backgroundColor: C.bg,
            height: SHEET_HEIGHT,
            transform: [{ translateY }],
          },
        ]}>
          {/* ── Draggable Red Pill Handle (PanResponder) ── */}
          <View style={styles.sheetHeader}>
            <View
              {...panResponder.panHandlers}
              style={{ paddingVertical: 12, alignItems: 'center', width: '100%' }}
            >
              <View style={[styles.sheetHandle, { backgroundColor: C.red }]} />
            </View>

            {/* Header row: title + top-right checkmark shortcut */}
            <View style={styles.headerTop}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>Confirm Measurement</Text>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.headerCheckBtn, { backgroundColor: C.red, borderColor: C.red }]}
              >
                <Check size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: SHEET_HEIGHT * 0.32 + 40 }]}
            showsVerticalScrollIndicator={false}
          >

            {/* Detected value card */}
            <View style={[styles.detectedCard, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={[styles.detectedLabel, { color: C.textSm }]}>DETECTED VALUE</Text>
                {scanResult?.confidence !== undefined && (
                  <Text style={{ fontSize: 10, fontWeight: '700', color: scanResult.confidence > 0.8 ? C.green : C.red }}>
                    Model Confidence: {(scanResult.confidence * 100).toFixed(1)}%
                  </Text>
                )}
              </View>
              <View style={styles.detectedRow}>
                {isEditing ? (
                  <TextInput
                    style={[styles.detectedValue, { color: C.text, borderBottomWidth: 2, borderBottomColor: C.red, minWidth: 80 }]}
                    value={scanResult?.value?.toString()}
                    onChangeText={(val: string) => setScanResult({ ...scanResult, value: parseFloat(val) || 0 })}
                    keyboardType="numeric"
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.detectedValue, { color: C.text }]}>
                    {scanResult?.unit === 'mmol/L' ? scanResult?.value.toFixed(2) : scanResult?.value}
                  </Text>
                )}

                {isEditing ? (
                  <TouchableOpacity
                    onPress={() => setScanResult({ ...scanResult, unit: scanResult?.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' })}
                    style={[styles.unitToggle, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
                  >
                    <Text style={[styles.detectedUnit, { color: C.red, fontWeight: 'bold' }]}>{scanResult?.unit || 'mg/dL'}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.detectedUnit, { color: C.textSm }]}>{scanResult?.unit || 'mg/dL'}</Text>
                )}

                <View style={[
                  styles.statusBadge,
                  { backgroundColor: (getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'High' || getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'Low' ? C.red : C.green) + '15' },
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'High' || getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'Low' ? C.red : C.green },
                  ]}>
                    {getStatus(scanResult?.value, scanResult?.unit || 'mg/dL')}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.subLabel, { color: C.text }]}>Measurement Type</Text>
            <View style={styles.tagsRow}>
              {['Fasting', 'Before meal', 'After meal'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setScanResult({ ...scanResult, tag: t })}
                  style={[styles.tagBtn, scanResult?.tag === t && { backgroundColor: C.red }]}
                >
                  <Text style={[styles.tagText, scanResult?.tag === t ? { color: '#FFF' } : { color: C.textSm }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.subLabel, { color: C.text, marginTop: 16 }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { color: C.text, backgroundColor: C.redBg, borderColor: C.redBorder }]}
              placeholder="Add a note about this reading..."
              placeholderTextColor={C.textXs}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: C.textXs }]}>{notes.length}/200</Text>

            {/* ── Bottom Actions: Confirm (75%) + Edit (25%) ── */}
            <View style={[styles.confirmActions, { paddingHorizontal: 0, marginTop: 16 }]}>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.mainConfirmBtn, { flex: 3, backgroundColor: C.red }]}
              >
                <Check size={17} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Confirm & Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={[styles.editBtn, { flex: 1, backgroundColor: C.redBg, borderColor: C.redBorder }]}
              >
                <Text style={[styles.editBtnText, { color: C.red, fontSize: 13 }]}>{isEditing ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  const renderError = () => (
    <View style={[styles.errorContainer, { backgroundColor: C.bg }]}>
      <AlertCircle size={64} color={C.red} />
      <Text style={[styles.errorTitle, { color: C.text }]}>Scan Failed</Text>
      <Text style={[styles.errorDesc, { color: C.textSm }]}>{errorMsg}</Text>
      
      <TouchableOpacity 
        onPress={() => { setPhoto(null); setState('camera'); }}
        style={[styles.retryBtn, { backgroundColor: C.red }]}
      >
        <RotateCcw size={20} color="#FFF" />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={enterManualMode} style={styles.manualEntryBtn}>
        <Text style={{ color: C.textXs, fontWeight: '700' }}>Enter Reading Manually</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Premium Discard Confirmation Modal (no nested RN Modal — absolute overlay) ──
  const renderDiscardModal = () => {
    if (!showDiscardConfirm) return null;
    return (
      <View style={[StyleSheet.absoluteFillObject, {
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 28,
        zIndex: 9999,
        elevation: 50,
      }]}>
        {/* Tap outside to cancel */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => setShowDiscardConfirm(false)}
        />
        <View style={[styles.modalContent, { backgroundColor: C.bg }]}>
          {/* Red X icon badge */}
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: C.red + '18',
            borderWidth: 1.5, borderColor: C.red,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <X size={28} color={C.red} />
          </View>
          <Text style={[styles.modalTitle, { color: C.text }]}>Discard Scan?</Text>
          <Text style={[styles.modalMessage, { color: C.textSm }]}>
            Are you sure? All {mode === 'meal' ? 'nutrition data and predictions' : 'measurement data'} will be permanently lost.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setShowDiscardConfirm(false)}
              style={[styles.modalBtnCancel, { borderColor: C.redBorder, backgroundColor: C.redBg }]}
            >
              <Text style={{ color: C.red, fontWeight: '700', fontSize: 15 }}>Keep It</Text>
            </TouchableOpacity>
             <TouchableOpacity
              onPress={() => {
                setShowDiscardConfirm(false);
                showToast('Scan discarded.', 'info');
                slideOutSheet(onBack);
              }}
              style={[styles.modalBtnConfirm, { backgroundColor: C.red }]}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ── Premium Stacking Auto-dismiss Toasts ──
  const renderToasts = () => {
    if (toasts.length === 0) return null;
    return (
      <View style={styles.toastAreaContainer} pointerEvents="none">
        {toasts.map((t, index) => {
          const isSuccess = t.type === 'success';
          const isError   = t.type === 'error';
          const bgColor   = isSuccess ? C.green : isError ? C.red : '#6B7280';
          
          const translateY = t.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-25, 0],
          });
          const scale = t.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.85, 1],
          });
          const opacity = t.anim;

          return (
            <Animated.View
              key={t.id}
              style={[
                styles.toastContainerRelative,
                {
                  backgroundColor: bgColor,
                  borderColor: bgColor + '50',
                  opacity,
                  transform: [{ translateY }, { scale }],
                  marginTop: index > 0 ? 8 : 0,
                }
              ]}
            >
              {isSuccess
                ? <Check size={18} color="#FFF" />
                : isError
                  ? <X size={18} color="#FFF" />
                  : <AlertCircle size={18} color="#FFF" />}
              <Text style={[styles.toastText, { color: '#FFF' }]}>{t.message}</Text>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // Both meal-confirm and glucose-confirm use bottom-sheet overlay
  if (state === 'confirm') {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Show captured photo behind the sheet so backdrop tints naturally */}
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFillObject}
            blurRadius={8}
            resizeMode="cover"
          />
        ) : null}
        {renderConfirm()}
        {renderDiscardModal()}
        {renderToasts()}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: state === 'camera' || state === 'analyzing' ? '#000' : C.bg }]}>
      {renderHeader()}
      {state === 'camera' && renderCamera()}
      {state === 'analyzing' && renderAnalyzing()}
      {state === 'adjustment' && renderAdjustment()}
      {state === 'error' && renderError()}
      {renderDiscardModal()}
      {renderToasts()}
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  scannerFrameContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '60%',
  },
  scannerFrame: {
    width: 240,
    height: 160,
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  scanHint: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  manualBtn: {
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  manualText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  previewContainer: { flex: 1 },
  preview: { flex: 1 },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerContainer: {
    alignItems: 'center',
    gap: 20,
  },
  shimmerBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  scanningText: { color: '#FFF', marginTop: 16, fontSize: 16, fontWeight: '700' },
  confirmContainer: { flex: 1 },
  confirmTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  confirmContent: { padding: 20 },
  detectedCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  detectedLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  detectedRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  detectedValue: { fontSize: 48, fontWeight: '900' },
  detectedUnit: { fontSize: 16, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  statusText: { fontSize: 12, fontWeight: '800' },
  subLabel: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  tagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tagText: { fontSize: 14, fontWeight: '700' },
  notesSection: { paddingHorizontal: 24, marginBottom: 32 },
  notesInput: {
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  confirmActions: { 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    gap: 12, 
    paddingBottom: 40 
  },
  mainConfirmBtn: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainConfirmText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  editBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { fontSize: 16, fontWeight: '800' },
  errorContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 12 },
  errorDesc: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  retryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  retryText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  manualEntryBtn: { padding: 12 },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContent: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: 40,
  },
  sheetHeader: {
    marginBottom: 10,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  foodImageContainer: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  foodImageLarge: {
    width: '100%',
    height: '100%',
  },
  foodImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mealTitleSection: {
    marginBottom: 20,
  },
  mealTitleInput: {
    fontSize: 20,
    fontWeight: '800',
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
  mealTitleMain: {
    fontSize: 24,
    fontWeight: '900',
  },
  dropdownContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInputCompact: {
    height: 80,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  charCountCompact: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagsRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  tagBtnCompact: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagTextCompact: {
    fontSize: 12,
    fontWeight: '700',
  },
  unitToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastAreaContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastContainerRelative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  // Circular checkmark shortcut in sheet header top-right
  headerCheckBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 3-column macro card
  macroCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default ScanFlow;

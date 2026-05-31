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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { X, Camera as CameraIcon, Zap, RotateCcw, Check, ChevronRight, AlertCircle, Plus, Image as ImageIcon, FileText } from 'lucide-react-native';
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
  const [scanResult, setScanResult] = useState<any>(null);
  const [detectedRect, setDetectedRect] = useState<Rectangle | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<'stock' | 'full'>('stock');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

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
      const result = await aiService.processGlucometerImage(finalUri);
      console.log(`[ScanFlow] Gemini Result:`, result);
      setScanResult({
        ...result,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
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
        Alert.alert("Success", "Glucose reading logged successfully!");
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
        Alert.alert("Success", "Meal scan logged successfully!");
      }
      onComplete();
    } catch (err) {
      Alert.alert("Error", "Failed to save the entry.");
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
      <Text style={styles.headerTitle}>
        {mode === 'glucose' ? 'Glucose Measurement' : 'Meal Scan'}
      </Text>
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

    const handleDiscard = () => {
      Alert.alert(
        "Discard Scan?",
        "Are you sure you want to discard this meal scan? All nutrition data and predictions will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive", 
            onPress: () => {
              Alert.alert("Scan Discarded", "The meal scan has been successfully discarded.");
              onBack();
            } 
          }
        ]
      );
    };

    return (
      <View style={styles.sheetContainer}>
        {/* Clickable dark backdrop tint for the top 20% area */}
        <TouchableOpacity 
          style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.45)' }]} 
          activeOpacity={1} 
          onPress={handleDiscard}
        />
        
        <View style={[
          styles.sheetContent, 
          { backgroundColor: C.bg },
          sheetHeight === 'full' ? { height: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0 } : { height: '80%' }
        ]}>
          <ScrollView 
            style={styles.sheetScroll} 
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Clickable Header Handle (Red Pill) to extend / toggle stock and full view */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setSheetHeight(sheetHeight === 'stock' ? 'full' : 'stock')}
                style={{ paddingVertical: 10, alignItems: 'center', width: '100%' }}
              >
                <View style={[styles.sheetHandle, { backgroundColor: C.red, width: 50, height: 6, borderRadius: 3 }]} />
              </TouchableOpacity>
              <View style={styles.headerTop}>
                <Text style={[styles.sheetTitle, { color: C.text }]}>Meal Found</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                  <Text style={{ color: C.red, fontWeight: '700' }}>{isEditing ? 'Done' : 'Edit'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.foodImageContainer}>
              <Image source={{ uri: photo || '' }} style={styles.foodImageLarge} />
              <LinearGradient 
                colors={['transparent', 'rgba(0,0,0,0.5)']} 
                style={styles.foodImageOverlay} 
              />
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{Math.round((scanResult?.confidence || 0.85) * 100)}% Match</Text>
              </View>
            </View>

            <View style={styles.mealTitleSection}>
              {isEditing ? (
                <View style={{ width: '100%' }}>
                  <TextInput
                    style={[styles.mealTitleInput, { color: C.text, borderBottomColor: C.redBorder }]}
                    value={scanResult?.title}
                    onChangeText={(val) => {
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

            {/* Premium Nutrient and Macro Cards Grid */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
              width: '100%'
            }}>
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: C.redBg,
                borderColor: C.redBorder,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 12,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.red }}>{scanResult?.calories || 0}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSm, marginTop: 4 }}>Calories (kcal)</Text>
              </View>

              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: C.redBg,
                borderColor: C.redBorder,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 12,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.red }}>{scanResult?.carbs || 0}g</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSm, marginTop: 4 }}>Carbs</Text>
              </View>

              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: C.redBg,
                borderColor: C.redBorder,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 12,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.red }}>{scanResult?.protein || 0}g</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSm, marginTop: 4 }}>Protein</Text>
              </View>

              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: C.redBg,
                borderColor: C.redBorder,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 12,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.red }}>{scanResult?.fat || 0}g</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSm, marginTop: 4 }}>Fat</Text>
              </View>
            </View>

            {/* Premium Dynamic Glycemic Impact Banner */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: ((scanResult?.impact || 0) > 20 ? C.red : C.green) + '15',
              borderColor: (scanResult?.impact || 0) > 20 ? C.red : C.green,
              borderWidth: 1.5,
              borderRadius: 16,
              padding: 14,
              gap: 10,
              marginBottom: 20
            }}>
              <Zap size={18} color={(scanResult?.impact || 0) > 20 ? C.red : C.green} />
              <Text style={{
                fontSize: 12,
                fontWeight: '800',
                color: (scanResult?.impact || 0) > 20 ? C.red : C.green,
                flex: 1
              }}>
                Glycemic Impact: +{scanResult?.impact || 0} mg/dL ({(scanResult?.impact || 0) > 20 ? 'High Spike Risk' : 'Diabetic Friendly'})
              </Text>
            </View>

            {/* Validation Notice Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: (isValidMeal ? C.green : C.red) + '15',
              borderColor: isValidMeal ? C.green : C.red,
              borderWidth: 1.5,
              borderRadius: 16,
              padding: 12,
              gap: 10,
              marginBottom: 20
            }}>
              <AlertCircle size={18} color={isValidMeal ? C.green : C.red} />
              <Text style={{
                fontSize: 11,
                fontWeight: '800',
                color: isValidMeal ? C.green : C.red,
                flex: 1
              }}>
                {isValidMeal 
                  ? "✓ Meal matches database entry. Macros loaded." 
                  : "✗ Invalid meal name. Type to select from list or use exact name to commit."}
              </Text>
            </View>

            <View style={{ marginTop: 8, marginBottom: 20 }}>
              <Text style={[styles.subLabel, { color: C.text }]}>Meal Type</Text>
              <View style={styles.tagsRowCompact}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(t => {
                  const isSelected = scanResult?.meal_type === t;
                  return (
                    <TouchableOpacity 
                      key={t} 
                      onPress={() => setScanResult({ ...scanResult, meal_type: t })}
                      style={[
                        styles.tagBtnCompact, 
                        isSelected && { backgroundColor: C.red, borderColor: C.red }
                      ]}
                    >
                      <Text style={[
                        styles.tagTextCompact, 
                        isSelected ? { color: '#FFF' } : { color: C.textSm }
                      ]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 8, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FileText size={16} color={C.textSm} />
                <Text style={[styles.subLabel, { color: C.text, marginBottom: 0 }]}>
                  Add Notes <Text style={{ fontSize: 11, fontWeight: '400', color: C.red + 'AA' }}>(optional)</Text>
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

            <View style={styles.confirmActions}>
              <TouchableOpacity 
                onPress={() => handleSave()} 
                disabled={!canSaveEdit}
                style={[styles.mainConfirmBtn, { backgroundColor: C.red, opacity: canSaveEdit ? 1 : 0.6 }]}
              >
                <Text style={styles.mainConfirmText}>Log Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDiscard}
                style={[styles.editBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
              >
                <Text style={[styles.editBtnText, { color: C.red }]}>Discard Scan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderConfirm = () => (
    <ScrollView style={[styles.confirmContainer, { backgroundColor: C.bg }]}>
      {mode === 'glucose' ? (
        <View style={styles.confirmContent}>
          <Text style={[styles.confirmTitle, { color: C.text }]}>Confirm Measurement</Text>
          
          <View style={[styles.detectedCard, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Text style={[styles.detectedLabel, { color: C.textSm }]}>DETECTED VALUE</Text>
            <View style={styles.detectedRow}>
              {isEditing ? (
                <TextInput
                  style={[styles.detectedValue, { color: C.text, borderBottomWidth: 2, borderBottomColor: C.red, minWidth: 80 }]}
                  value={scanResult?.value?.toString()}
                  onChangeText={(val) => setScanResult({ ...scanResult, value: parseFloat(val) || 0 })}
                  keyboardType="numeric"
                  autoFocus
                />
              ) : (
                <Text style={[styles.detectedValue, { color: C.text }]}>{scanResult?.unit === 'mmol/L' ? scanResult?.value.toFixed(2) : scanResult?.value}</Text>
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
                { backgroundColor: (getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'High' || getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'Low' ? C.red : C.green) + '15' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: (getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'High' || getStatus(scanResult?.value, scanResult?.unit || 'mg/dL') === 'Low' ? C.red : C.green) }
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
        </View>
      ) : renderMealConfirmSheet()}
    </ScrollView>
  );

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

  const isMealConfirm = state === 'confirm' && mode === 'meal';

  if (isMealConfirm) {
    return (
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {renderMealConfirmSheet()}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: state === 'camera' || state === 'analyzing' ? '#000' : C.bg }]}>
      {renderHeader()}
      {state === 'camera' && renderCamera()}
      {state === 'analyzing' && renderAnalyzing()}
      {state === 'adjustment' && renderAdjustment()}
      {state === 'confirm' && renderConfirm()}
      {state === 'error' && renderError()}
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
    alignItems: 'center',
    justifyContent: 'center',
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
  }
});

export default ScanFlow;

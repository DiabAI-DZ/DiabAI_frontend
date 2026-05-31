import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { X, Camera as CameraIcon, Zap, RotateCcw, Check, ChevronRight, AlertCircle, Plus, Image as ImageIcon, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from 'react-native-gesture-handler';
import mealNames from '../assets/meal_names.json';
import foodDatabaseMin from '../assets/food_database_min.json';

interface ScanFlowProps {
  mode: 'glucose' | 'meal';
  onBack: () => void;
  onComplete: () => void;
}

type ScanState = 'camera' | 'analyzing' | 'confirm' | 'manual' | 'error';

const ScanFlow: React.FC<ScanFlowProps> = ({ mode, onBack, onComplete }) => {
  const { C, isDark } = useTheme();
  const { addLog, scanImage, scanMeal } = useData();
  const { profile, refreshProfile } = useUser();
  const [permission, requestPermission] = useCameraPermissions();

  const getStatus = (value: number, unit: string) => {
    const isMmol = unit === 'mmol/L';
    const lowLimit = isMmol ? 3.9 : 70;
    const highLimit = isMmol ? 7.8 : 140;
    if (value < lowLimit) return 'Low';
    if (value > highLimit) return 'High';
    return 'Normal';
  };
  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>('camera');
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualValue, setManualValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<'stock' | 'full'>('stock');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <AlertCircle size={64} color={C.red} style={{ marginBottom: 20 }} />
        <Text style={[styles.message, { color: C.text, textAlign: 'center', marginBottom: 20 }]}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity 
          onPress={requestPermission} 
          style={[styles.button, { backgroundColor: C.red }]}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        // quality < 1 forces expo-image-picker to re-encode to JPEG on Android/iOS,
        // which prevents WebP/HEIC/AVIF from reaching the server and crashing PIL.
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
    setState('analyzing');
    try {
      if (mode === 'glucose') {
        const result = await scanImage(uri);
        setScanResult(result);
      } else {
        const result = await scanMeal(uri);
        setScanResult(result);
      }
      setState('confirm');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process the image.");
      setState('error');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (mode === 'glucose') {
        await addLog({
          type: "measurement",
          value: data.value,
          unit: data.unit,
          status: getStatus(data.value, data.unit) as any,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString(),
          tag: data.tag || (state === 'manual' ? "Manual" : "Scan"),
          notes: notes,
          trend: "stable",
          imagePath: data.imagePath,
        } as any);
        await refreshProfile();
        Alert.alert("Success", "Glucose reading logged successfully!");
      } else {
        await addLog({
          type: "meal",
          name: data.title,
          mealType: data.meal_type,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString(),
          carbs: data.carbs,
          calories: data.calories,
          protein: data.protein,
          fat: data.fat,
          impact: data.impact,
          image: photo || "",
          imagePath: data.imagePath,
          food_items: data.food_items || [],
          notes: notes,
          tags: [],
          predicted_label: data.predicted_label,
          corrected_label: data.title,
          model_version: data.model_version,
          confidence: data.confidence
        } as any);
        Alert.alert("Success", "Meal scan logged successfully!");
      }
      onComplete();
    } catch (err) {
      Alert.alert("Error", "Failed to save the entry.");
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
        <X color="#FFF" size={24} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {state === 'manual' ? 'Manual Entry' : (mode === 'glucose' ? 'Glucometer Scan' : 'Meal Scan')}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={[styles.scannerFrame, mode === 'meal' && { width: 300, height: 300, borderRadius: 32 }]} />
          <Text style={styles.scanHint}>
            {mode === 'glucose' ? 'Align glucometer screen within the box' : 'Position your meal within the frame'}
          </Text>
        </View>
      </CameraView>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.manualBtn} onPress={() => setState('manual')}>
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
    // find top 5 matches
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
        {/* Semi-transparent backdrop to close/discard */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleDiscard}
        />
        
        {/* Sheet Content container with dynamic height (stock 80% or full 100%) */}
        <View style={[
          styles.sheetContent, 
          { backgroundColor: C.bg },
          sheetHeight === 'full' ? { height: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0 } : { height: '80%' }
        ]}>
          {/* Rounded indicator pill handle at the top center - TAP TO TOGGLE FULLSCREEN */}
          <TouchableOpacity 
            style={styles.sheetHandleRow}
            activeOpacity={0.8}
            onPress={() => setSheetHeight(sheetHeight === 'stock' ? 'full' : 'stock')}
          >
            <View style={[styles.sheetHandle, { backgroundColor: C.red }]} />
          </TouchableOpacity>
          
          {/* Custom Header Row inside the sheet */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: C.text }]}>Confirm Meal</Text>
            
            {/* Green Circular Confirm Button */}
            <TouchableOpacity 
              onPress={() => {
                if (isEditing && !canSaveEdit) {
                  Alert.alert("Invalid Meal Name", "Please select a valid meal name from the database suggestions before confirming.");
                  return;
                }
                handleSave(scanResult);
              }}
              disabled={isEditing && !canSaveEdit}
              style={[
                styles.confirmCheckBtn, 
                { backgroundColor: (isEditing && !canSaveEdit) ? C.redBorder : C.green + '15' }
              ]}
            >
              <Check color={isEditing && !canSaveEdit ? C.textXs : C.green} size={24} style={{ fontWeight: 'bold' }} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Meal Photo */}
            {photo && <Image source={{ uri: photo }} style={styles.mealPhoto} />}
            
            {/* Detected Food Items section - matches the Figma Design! */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.subLabel, { color: C.text }]}>Detected Food Items</Text>
              
              {scanResult?.food_items && scanResult.food_items.length > 0 ? (
                scanResult.food_items.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.foodItemRow, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                    <Text style={[styles.foodName, { color: C.text }]}>{item.name}</Text>
                    <Text style={[styles.foodCarbs, { color: C.red }]}>{item.carbs}g carbs</Text>
                  </View>
                ))
              ) : (
                /* Fallback if food_items list is empty, display main predicted item as the detected food item */
                <View style={[styles.foodItemRow, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <Text style={[styles.foodName, { color: C.text }]}>{scanResult?.title}</Text>
                  <Text style={[styles.foodCarbs, { color: C.red }]}>{scanResult?.carbs || 0}g carbs</Text>
                </View>
              )}
            </View>
            
            {/* Meal Name Input / Display with Autocomplete */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.subLabel, { color: C.text, marginBottom: 0 }]}>Meal Name</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                  <Text style={{ color: C.red, fontWeight: '700', fontSize: 13 }}>
                    {isEditing ? (canSaveEdit ? 'Done' : 'Select Suggestion') : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {isEditing ? (
                <View style={{ zIndex: 100 }}>
                  <TextInput
                    style={[
                      styles.editInput, 
                      { 
                        color: C.text, 
                        backgroundColor: C.white, 
                        borderColor: canSaveEdit ? C.green + '80' : C.red,
                        borderWidth: 1.5
                      }
                    ]}
                    value={scanResult?.title}
                    onChangeText={(val) => {
                      const valKey = val.toLowerCase().trim();
                      const matchedFood = (foodDatabaseMin as any)[valKey];
                      if (matchedFood) {
                        setScanResult({
                          ...scanResult,
                          title: val,
                          calories: matchedFood.calories,
                          carbs: matchedFood.carbs,
                          protein: matchedFood.protein,
                          fat: matchedFood.fat,
                          impact: matchedFood.impact,
                          food_items: [{ name: matchedFood.name, carbs: matchedFood.carbs }]
                        });
                      } else {
                        setScanResult({ ...scanResult, title: val });
                      }
                    }}
                    placeholder="Type meal name..."
                    placeholderTextColor={C.textXs}
                    autoFocus
                  />
                  
                  {/* Real-time Autocomplete Suggestions Dropdown */}
                  {filteredSuggestions.length > 0 && (
                    <View style={[styles.dropdownContainer, { backgroundColor: C.white, borderColor: C.redBorder }]}>
                      {filteredSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.dropdownItem, { borderBottomColor: C.redBg }]}
                          onPress={() => {
                            const suggestionKey = suggestion.toLowerCase().trim();
                            const matchedFood = (foodDatabaseMin as any)[suggestionKey];
                            if (matchedFood) {
                              setScanResult({
                                ...scanResult,
                                title: suggestion,
                                calories: matchedFood.calories,
                                carbs: matchedFood.carbs,
                                protein: matchedFood.protein,
                                fat: matchedFood.fat,
                                impact: matchedFood.impact,
                                food_items: [{ name: matchedFood.name, carbs: matchedFood.carbs }]
                              });
                            } else {
                              setScanResult({ ...scanResult, title: suggestion });
                            }
                          }}
                        >
                          <Text style={[styles.dropdownText, { color: C.text }]}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
                  {/* Invalid Meal Alert Banner */}
                  {!canSaveEdit && (
                    <Text style={{ color: C.red, fontSize: 11, fontWeight: '600', marginTop: 4 }}>
                      ⚠️ Meal name must exactly match a database entry. Select a suggestion or type fully.
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.foodNameDisplay, { color: C.text }]}>{scanResult?.title}</Text>
              )}

              {/* Retrain AI Correction feedback badge */}
              {scanResult?.predicted_label && (
                <View style={[
                  styles.correctionHint, 
                  { 
                    backgroundColor: scanResult.title.toLowerCase().trim() !== scanResult.predicted_label.toLowerCase().trim() ? C.redBg : C.green + '15',
                    borderColor: scanResult.title.toLowerCase().trim() !== scanResult.predicted_label.toLowerCase().trim() ? C.redBorder : C.green + '30',
                    marginTop: 8
                  }
                ]}>
                  <Text style={[
                    styles.correctionHintText, 
                    { color: scanResult.title.toLowerCase().trim() !== scanResult.predicted_label.toLowerCase().trim() ? C.red : C.green }
                  ]}>
                    {scanResult.title.toLowerCase().trim() !== scanResult.predicted_label.toLowerCase().trim() 
                      ? "✏️ Correction detected! Saving will help retrain our AI model."
                      : "✨ Scanned label matches! Saving will help confirm the model's accuracy."
                    }
                  </Text>
                </View>
              )}
            </View>
            
            {/* Meal Type Tag Selector - COMPACT FIX TO FIT HORIZONTALLY */}
            <View style={{ marginBottom: 16 }}>
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
            
            {/* 3 Nutrient Cards matching the Figma Design layout */}
            <Text style={[styles.subLabel, { color: C.text }]}>Nutrients</Text>
            <View style={styles.nutrientsRowCompact}>
              <View style={[styles.nutrientCardCompact, { backgroundColor: C.redBg }]}>
                <Zap size={14} color={C.red} />
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInputCompact, { color: C.text }]}
                    value={scanResult?.calories?.toString()}
                    onChangeText={(val) => setScanResult({ ...scanResult, calories: parseInt(val) || 0 })}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValCompact, { color: C.text }]}>{scanResult?.calories} kcal</Text>
                )}
                <Text style={[styles.nutrientLabelCompact, { color: C.textSm }]}>Calories</Text>
              </View>
              
              <View style={[styles.nutrientCardCompact, { backgroundColor: C.redBg }]}>
                <Zap size={14} color={C.red} />
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInputCompact, { color: C.text }]}
                    value={scanResult?.carbs?.toString()}
                    onChangeText={(val) => setScanResult({ ...scanResult, carbs: parseInt(val) || 0 })}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValCompact, { color: C.text }]}>{scanResult?.carbs}g</Text>
                )}
                <Text style={[styles.nutrientLabelCompact, { color: C.textSm }]}>Total Carbs</Text>
              </View>
              
              <View style={[styles.nutrientCardCompact, { backgroundColor: C.redBg }]}>
                <Plus size={14} color={C.red} />
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInputCompact, { color: C.text }]}
                    value={scanResult?.impact?.toString()}
                    onChangeText={(val) => setScanResult({ ...scanResult, impact: parseInt(val) || 0 })}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValCompact, { color: C.text }]}>+{scanResult?.impact} mg/dL</Text>
                )}
                <Text style={[styles.nutrientLabelCompact, { color: C.textSm }]}>Impact</Text>
              </View>
            </View>
            
            {/* Notes Section with paper icon */}
            <View style={{ marginTop: 8, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FileText size={16} color={C.textSm} />
                <Text style={[styles.subLabel, { color: C.text, marginBottom: 0 }]}>
                  Add Notes <Text style={{ fontSize: 11, fontWeight: '400', color: C.red + 'AA' }}>(optional)</Text>
                </Text>
              </View>
              
              <TextInput
                style={[styles.notesInputCompact, { backgroundColor: C.white, borderColor: C.redBorder, color: C.text }]}
                placeholder="e.g. Felt dizzy before reading, took medication 30 min ago..."
                placeholderTextColor={C.textXs}
                multiline
                value={notes}
                onChangeText={setNotes}
                maxLength={200}
              />
              <View style={[styles.charCountCompact, { backgroundColor: C.white, borderColor: C.redBorder }]}>
                <Text style={{ fontSize: 10, color: C.textXs }}>{notes.length}/200 characters</Text>
              </View>
            </View>
            
            {/* Safe Bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderConfirm = () => {
    if (mode === 'glucose') {
      return (
        <ScrollView style={[styles.confirmContainer, { backgroundColor: C.bg }]}>
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
                  <Text style={[styles.detectedValue, { color: C.text }]}>{scanResult?.value}</Text>
                )}
                <Text style={[styles.detectedUnit, { color: C.textSm }]}>{scanResult?.unit || 'mg/dL'}</Text>
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

          <View style={styles.notesSection}>
            <Text style={[styles.subLabel, { color: C.text }]}>Add Notes <Text style={{ fontSize: 10, fontWeight: '400' }}>(optional)</Text></Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: C.redBg, borderColor: C.redBorder, color: C.text }]}
              placeholder="e.g. Felt dizzy before reading..."
              placeholderTextColor={C.textXs}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            <Text style={[styles.charCount, { color: C.textXs }]}>{notes.length}/200 characters</Text>
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity 
              onPress={() => handleSave(scanResult)} 
              style={[styles.mainConfirmBtn, { backgroundColor: C.red }]}
            >
              <Text style={styles.mainConfirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsEditing(!isEditing)} 
              style={[styles.editBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }, isEditing && { backgroundColor: C.red }]}
            >
              <Text style={[styles.editBtnText, { color: isEditing ? '#FFF' : C.red }]}>{isEditing ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return renderMealConfirmSheet();
  };

  const renderManual = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.manualContainer, { backgroundColor: C.bg }]}
    >
      <View style={styles.manualForm}>
        <Text style={[styles.formLabel, { color: C.textSm }]}>BLOOD GLUCOSE VALUE</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.manualInput, { color: C.text, borderBottomColor: C.red }]}
            value={manualValue}
            onChangeText={setManualValue}
            placeholder="0.0"
            placeholderTextColor={C.textXs}
            keyboardType="numeric"
            autoFocus
          />
          <Text style={[styles.inputUnit, { color: C.textSm }]}>{profile?.glucoseUnit || 'mg/dL'}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => handleSave({ value: parseFloat(manualValue), unit: profile?.glucoseUnit || "mg/dL" })}
          disabled={!manualValue}
          style={[styles.saveBtn, { backgroundColor: manualValue ? C.red : C.redBorder }]}
        >
          <Text style={styles.saveBtnText}>Save Reading</Text>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setState('camera')} style={styles.backToCamera}>
          <CameraIcon size={16} color={C.textXs} />
          <Text style={{ color: C.textXs, fontWeight: '700' }}>Back to Camera Scan</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
      
      <TouchableOpacity onPress={() => setState('manual')} style={styles.manualEntryBtn}>
        <Text style={{ color: C.textXs, fontWeight: '700' }}>Enter Reading Manually</Text>
      </TouchableOpacity>
    </View>
  );

  const isMealConfirm = state === 'confirm' && mode === 'meal';

  if (isMealConfirm) {
    return (
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {renderConfirm()}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: state === 'camera' || state === 'analyzing' ? '#000' : C.bg }]}>
      {renderHeader()}
      {state === 'camera' && renderCamera()}
      {state === 'analyzing' && renderAnalyzing()}
      {state === 'confirm' && renderConfirm()}
      {state === 'manual' && renderManual()}
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 24,
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
  confirmContent: { padding: 24, paddingTop: 40 },
  confirmTitle: { fontSize: 24, fontWeight: '900', marginBottom: 24 },
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
  mealPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    marginBottom: 24,
  },
  subLabel: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  tagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tagText: { fontSize: 14, fontWeight: '700' },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  foodName: { fontSize: 14, fontWeight: '700' },
  foodCarbs: { fontSize: 12, fontWeight: '600' },
  nutrientsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  nutrientCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  nutrientVal: { fontSize: 14, fontWeight: '800' },
  nutrientLabel: { fontSize: 10, fontWeight: '600' },
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
  manualContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  manualForm: { alignItems: 'center' },
  formLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 40 },
  manualInput: { fontSize: 80, fontWeight: '900', textAlign: 'center', borderBottomWidth: 4, width: 160 },
  inputUnit: { fontSize: 24, fontWeight: '600', marginLeft: 12 },
  saveBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backToCamera: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  message: { fontSize: 16 },
  editInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  nutrientInput: {
    fontSize: 14,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    textAlign: 'center',
    padding: 0,
    minWidth: 40,
  },
  correctionHint: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctionHintText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
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
    height: '78%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  confirmCheckBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetScroll: {
    paddingBottom: 40,
  },
  foodNameDisplay: {
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 4,
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    marginBottom: 20,
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
  nutrientsRowCompact: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  nutrientCardCompact: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    alignItems: 'center',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  nutrientValCompact: {
    fontSize: 13,
    fontWeight: '900',
  },
  nutrientLabelCompact: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  nutrientInputCompact: {
    fontSize: 13,
    fontWeight: '900',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,0,0,0.15)',
    textAlign: 'center',
    padding: 0,
    minWidth: 40,
  }
});

export default ScanFlow;

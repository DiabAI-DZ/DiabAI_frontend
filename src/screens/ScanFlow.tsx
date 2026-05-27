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
import { X, Camera as CameraIcon, Zap, RotateCcw, Check, ChevronRight, AlertCircle, Plus, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from 'react-native-gesture-handler';

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
          tags: []
        } as any);
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
      ) : (
        <View style={styles.confirmContent}>
          <Text style={[styles.confirmTitle, { color: C.text }]}>Confirm Meal</Text>
          {photo && <Image source={{ uri: photo }} style={styles.mealPhoto} />}
          
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.subLabel, { color: C.text }]}>Meal Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: C.text, backgroundColor: C.redBg, borderColor: C.redBorder }]}
                value={scanResult?.title}
                onChangeText={(val) => setScanResult({ ...scanResult, title: val })}
              />
            ) : (
              <Text style={[styles.foodName, { color: C.text, fontSize: 18 }]}>{scanResult?.title}</Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.subLabel, { color: C.text }]}>Meal Type</Text>
            <View style={styles.tagsRow}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  onPress={() => setScanResult({ ...scanResult, meal_type: t })}
                  style={[
                    styles.tagBtn, 
                    scanResult?.meal_type === t && { backgroundColor: C.red }
                  ]}
                >
                  <Text style={[styles.tagText, scanResult?.meal_type === t ? { color: '#FFF' } : { color: C.textSm }]}>
                    {t.charAt(0) + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[styles.subLabel, { color: C.text }]}>Nutrients</Text>
          <View style={styles.nutrientsRow}>
            <View style={[styles.nutrientCard, { backgroundColor: C.redBg }]}>
              <Zap size={14} color={C.red} />
              {isEditing ? (
                <TextInput
                  style={[styles.nutrientInput, { color: C.text }]}
                  value={scanResult?.calories?.toString()}
                  onChangeText={(val) => setScanResult({ ...scanResult, calories: parseInt(val) || 0 })}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.nutrientVal, { color: C.text }]}>{scanResult?.calories} kcal</Text>
              )}
              <Text style={[styles.nutrientLabel, { color: C.textSm }]}>Calories</Text>
            </View>
            <View style={[styles.nutrientCard, { backgroundColor: C.redBg }]}>
              <Zap size={14} color={C.red} />
              {isEditing ? (
                <TextInput
                  style={[styles.nutrientInput, { color: C.text }]}
                  value={scanResult?.carbs?.toString()}
                  onChangeText={(val) => setScanResult({ ...scanResult, carbs: parseInt(val) || 0 })}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.nutrientVal, { color: C.text }]}>{scanResult?.carbs}g</Text>
              )}
              <Text style={[styles.nutrientLabel, { color: C.textSm }]}>Carbs</Text>
            </View>
            <View style={[styles.nutrientCard, { backgroundColor: C.redBg }]}>
              <Plus size={14} color={C.red} />
              {isEditing ? (
                <TextInput
                  style={[styles.nutrientInput, { color: C.text }]}
                  value={scanResult?.impact?.toString()}
                  onChangeText={(val) => setScanResult({ ...scanResult, impact: parseInt(val) || 0 })}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.nutrientVal, { color: C.text }]}>+{scanResult?.impact} mg/dL</Text>
              )}
              <Text style={[styles.nutrientLabel, { color: C.textSm }]}>Impact</Text>
            </View>
          </View>
        </View>
      )}

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
  }
});

export default ScanFlow;

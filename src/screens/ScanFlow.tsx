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
import { X, Camera as CameraIcon, Zap, RotateCcw, Check, ChevronRight, AlertCircle, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScanFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

type ScanState = 'camera' | 'analyzing' | 'confirm' | 'manual' | 'error';

const ScanFlow: React.FC<ScanFlowProps> = ({ onBack, onComplete }) => {
  const { C, isDark } = useTheme();
  const { addLog, scanImage } = useData();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>('camera');
  const [scanResult, setScanResult] = useState<{ value: number, unit: string } | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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

  const handleAnalyze = async (uri: string) => {
    setState('analyzing');
    try {
      const result = await scanImage(uri);
      setScanResult({ value: result.value, unit: result.unit });
      setState('confirm');
    } catch (err: any) {
      setErrorMsg(err.message || "AI Analysis failed to read the display.");
      setState('error');
    }
  };

  const handleSave = async (value: number, unit: string) => {
    try {
      await addLog({
        type: "measurement",
        value: value,
        unit: unit,
        status: value > 140 ? "High" : (value < 70 ? "Low" : "Normal"),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString(),
        tag: state === 'manual' ? "Manual" : "Scan",
        trend: "stable",
      } as any);
      onComplete();
    } catch (err) {
      Alert.alert("Error", "Failed to save the reading.");
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
        <X color="#FFF" size={24} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {state === 'manual' ? 'Manual Entry' : 'Glucometer Scan'}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scanHint}>Align glucometer screen within the box</Text>
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
        <View style={{ width: 80 }} />
      </View>
    </View>
  );

  const renderAnalyzing = () => (
    <View style={styles.previewContainer}>
      {photo && <Image source={{ uri: photo }} style={styles.preview} />}
      <View style={styles.scanningOverlay}>
        <ActivityIndicator size="large" color={C.red} />
        <Text style={styles.scanningText}>AI is analyzing reading...</Text>
      </View>
    </View>
  );

  const renderConfirm = () => (
    <View style={[styles.confirmContainer, { backgroundColor: C.bg }]}>
      <LinearGradient colors={[C.redBg, C.bg]} style={styles.resultCard}>
        <Text style={[styles.resultLabel, { color: C.textSm }]}>Detected Reading</Text>
        <View style={styles.resultRow}>
          <Text style={[styles.resultValue, { color: C.text }]}>{scanResult?.value}</Text>
          <Text style={[styles.resultUnit, { color: C.textSm }]}>{scanResult?.unit}</Text>
        </View>
        <View style={[styles.accuracyBadge, { backgroundColor: C.green + '15' }]}>
          <Check size={14} color={C.green} />
          <Text style={[styles.accuracyText, { color: C.green }]}>94% Confidence</Text>
        </View>
      </LinearGradient>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          onPress={() => { setPhoto(null); setState('camera'); }} 
          style={[styles.actionBtn, { backgroundColor: C.white, borderColor: C.redBorder, borderWidth: 1 }]}
        >
          <RotateCcw size={20} color={C.text} />
          <Text style={[styles.actionBtnText, { color: C.text }]}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleSave(scanResult!.value, scanResult!.unit)} 
          style={[styles.actionBtn, { backgroundColor: C.red }]}
        >
          <Check size={20} color="#FFF" />
          <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Confirm Reading</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => setState('manual')} style={styles.editLink}>
        <Text style={{ color: C.textXs, fontWeight: '700' }}>Value is incorrect? Enter manually</Text>
      </TouchableOpacity>
    </View>
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
            placeholder="000"
            placeholderTextColor={C.textXs}
            keyboardType="numeric"
            autoFocus
          />
          <Text style={[styles.inputUnit, { color: C.textSm }]}>mg/dL</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => handleSave(parseInt(manualValue), "mg/dL")}
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
  scanningText: { color: '#FFF', marginTop: 16, fontSize: 16, fontWeight: '700' },
  confirmContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  resultCard: {
    padding: 40,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 40,
  },
  resultLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  resultValue: { fontSize: 72, fontWeight: '900' },
  resultUnit: { fontSize: 20, fontWeight: '600', marginLeft: 8 },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  accuracyText: { fontSize: 12, fontWeight: '800' },
  actionButtons: { flexDirection: 'row', gap: 16 },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: { fontSize: 16, fontWeight: '800' },
  editLink: { marginTop: 24, alignSelf: 'center' },
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
});

export default ScanFlow;

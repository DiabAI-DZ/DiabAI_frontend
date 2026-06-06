import React, { useCallback, useRef, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ScreenDetectionOverlay } from './components/ScreenDetectionOverlay';
import { ScanHeader } from './components/ScanHeader';
import { ScanCameraView } from './components/ScanCameraView';
import { ScanAnalyzing } from './components/ScanAnalyzing';
import { ScanError } from './components/ScanError';
import { ConfirmSheet } from './components/ConfirmSheet';
import { GlucoseConfirm } from './components/GlucoseConfirm';
import { MealConfirm } from './components/MealConfirm';
import { DiscardModal } from './components/DiscardModal';
import { ToastStack } from './components/ToastStack';
import { useToasts } from './hooks/useToasts';
import { useScanSheet } from './hooks/useScanSheet';
import { useScanController } from './hooks/useScanController';
import { isValidMealName } from './scanLogic';
import { SCAN_OVERLAY } from './scanOverlayColors';
import type { ScanMode } from './scanTypes';

interface ScanFlowProps {
  mode: ScanMode;
  onBack: () => void;
  onComplete: () => void;
}

const ScanFlow: React.FC<ScanFlowProps> = ({ mode, onBack, onComplete }) => {
  const { C } = useTheme();
  const [showDiscard, setShowDiscard] = useState(false);
  const { toasts, showToast } = useToasts();

  // Break the controller↔sheet cycle: controller calls slideOut via a stable ref the sheet fills.
  const slideOutRef = useRef<(cb: () => void) => void>(() => {});
  const slideOut = useCallback((cb: () => void) => slideOutRef.current(cb), []);

  const ctrl = useScanController({ mode, showToast, slideOut, onComplete });
  const sheet = useScanSheet(mode, ctrl.state, () => setShowDiscard(true));
  slideOutRef.current = sheet.slideOutSheet;

  const canSave = mode === 'meal' ? isValidMealName(ctrl.scanResult?.title) : true;

  const discardModal = (
    <DiscardModal
      visible={showDiscard}
      mode={mode}
      onKeep={() => setShowDiscard(false)}
      onDiscard={() => { setShowDiscard(false); showToast('Scan discarded.', 'info'); slideOut(onBack); }}
    />
  );

  if (ctrl.state === 'confirm') {
    return (
      <View style={[styles.container, styles.dark]}>
        {ctrl.photo && <Image source={{ uri: ctrl.photo }} style={StyleSheet.absoluteFillObject} blurRadius={8} resizeMode="cover" />}
        <ConfirmSheet
          title={mode === 'meal' ? 'Confirm Meal' : 'Confirm Measurement'}
          isMock={!!ctrl.scanResult?.is_mock}
          canSave={canSave}
          onCheck={ctrl.handleSave}
          scrollPaddingBottom={sheet.sheetHeight * (mode === 'meal' ? 0.22 : 0.32) + 40}
          sheetHeight={sheet.sheetHeight}
          translateY={sheet.translateY}
          backdropAnim={sheet.backdropAnim}
          panHandlers={sheet.panHandlers}
          onBackdropPress={() => setShowDiscard(true)}
          backdropDisabled={showDiscard}
        >
          {mode === 'meal' ? (
            <MealConfirm
              scanResult={ctrl.scanResult}
              setScanResult={ctrl.setScanResult}
              isEditing={ctrl.isEditing}
              setIsEditing={ctrl.setIsEditing}
              notes={ctrl.notes}
              setNotes={ctrl.setNotes}
              photo={ctrl.photo}
              onSelectMeal={ctrl.selectMeal}
              onSave={ctrl.handleSave}
            />
          ) : (
            <GlucoseConfirm
              scanResult={ctrl.scanResult}
              setScanResult={ctrl.setScanResult}
              isEditing={ctrl.isEditing}
              setIsEditing={ctrl.setIsEditing}
              notes={ctrl.notes}
              setNotes={ctrl.setNotes}
              photo={ctrl.photo}
              onSave={ctrl.handleSave}
            />
          )}
        </ConfirmSheet>
        {discardModal}
        <ToastStack toasts={toasts} />
      </View>
    );
  }

  const onCamera = ctrl.state === 'camera' || ctrl.state === 'analyzing';
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: onCamera ? SCAN_OVERLAY.black : C.bg }]}>
      <ScanHeader mode={mode} ocrModel={ctrl.ocrModel} onBack={onBack} onToggleModel={ctrl.toggleOcrModel} />
      {ctrl.state === 'camera' && <ScanCameraView mode={mode} camera={ctrl.camera} onManual={ctrl.enterManualMode} />}
      {ctrl.state === 'analyzing' && <ScanAnalyzing photo={ctrl.photo} mode={mode} />}
      {ctrl.state === 'adjustment' && ctrl.photo && (
        <ScreenDetectionOverlay
          imageUri={ctrl.photo}
          initialRect={ctrl.detectedRect}
          onConfirm={(rect) => ctrl.processFinalOCR(ctrl.photo as string, rect)}
          onCancel={onBack}
          onRetake={ctrl.retake}
        />
      )}
      {ctrl.state === 'error' && <ScanError errorMsg={ctrl.errorMsg} onRetry={ctrl.retake} onManual={ctrl.enterManualMode} />}
      {discardModal}
      <ToastStack toasts={toasts} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  dark: { backgroundColor: SCAN_OVERLAY.black },
});

export default ScanFlow;

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Rectangle } from '../services/CVService';
import { Check, RotateCcw, X } from 'lucide-react-native';

interface Props {
  imageUri: string;
  initialRect: Rectangle | null;
  onConfirm: (finalRect: Rectangle) => void;
  onCancel: () => void;
  onRetake: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ScreenDetectionOverlay
 * Provides a draggable/resizable green rectangle over an image.
 * Uses robust scaling and clamping to avoid "out-of-bounds" cropping errors.
 */
export const ScreenDetectionOverlay: React.FC<Props> = ({
  imageUri,
  initialRect,
  onConfirm,
  onCancel,
  onRetake
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displayedLayout, setDisplayedLayout] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [loading, setLoading] = useState(true);

  // Rectangle orientation/sizing (shared values)
  const rectX = useSharedValue(SCREEN_WIDTH * 0.25);
  const rectY = useSharedValue(SCREEN_HEIGHT * 0.4);
  const rectW = useSharedValue(SCREEN_WIDTH * 0.5);
  const rectH = useSharedValue(SCREEN_HEIGHT * 0.1);

  // Offset storage for continuous dragging
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  useEffect(() => {
    Image.getSize(imageUri, (w, h) => {
      setImageSize({ width: w, height: h });
      
      // Calculate how the image is displayed in "contain" mode on full screen
      const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
      const imageAspectRatio = w / h;
      
      let dWidth, dHeight, offsetX, offsetY;
      
      if (imageAspectRatio > screenAspectRatio) {
        // Image is wider than screen aspect ratio
        dWidth = SCREEN_WIDTH;
        dHeight = SCREEN_WIDTH / imageAspectRatio;
        offsetX = 0;
        offsetY = (SCREEN_HEIGHT - dHeight) / 2;
      } else {
        // Image is taller than screen aspect ratio
        dHeight = SCREEN_HEIGHT;
        dWidth = SCREEN_HEIGHT * imageAspectRatio;
        offsetY = 0;
        offsetX = (SCREEN_WIDTH - dWidth) / 2;
      }
      
      setDisplayedLayout({ width: dWidth, height: dHeight, offsetX, offsetY });
      setLoading(false);
      
      const scaleX = dWidth / w;
      const scaleY = dHeight / h;
      
      if (initialRect) {
        rectX.value = Math.max(offsetX, offsetX + initialRect.x * scaleX);
        rectY.value = Math.max(offsetY, offsetY + initialRect.y * scaleY);
        rectW.value = Math.min(dWidth, initialRect.width * scaleX);
        rectH.value = Math.min(dHeight, initialRect.height * scaleY);
      } else {
        // Default box in center
        rectX.value = offsetX + dWidth * 0.1;
        rectY.value = offsetY + dHeight * 0.4;
        rectW.value = dWidth * 0.8;
        rectH.value = dHeight * 0.2;
      }
    });
  }, [imageUri, initialRect]);

  // Main Drag Gesture
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = rectX.value;
      startY.value = rectY.value;
    })
    .onUpdate((e) => {
      // Clamp to displayed image boundaries
      rectX.value = Math.min(Math.max(displayedLayout.offsetX, startX.value + e.translationX), displayedLayout.offsetX + displayedLayout.width - rectW.value);
      rectY.value = Math.min(Math.max(displayedLayout.offsetY, startY.value + e.translationY), displayedLayout.offsetY + displayedLayout.height - rectH.value);
    });

  // Corner Gestures with clamping
  const createCornerGesture = (corner: 'tl'|'tr'|'bl'|'br') => 
    Gesture.Pan()
      .onStart(() => {
        startX.value = rectX.value;
        startY.value = rectY.value;
        startW.value = rectW.value;
        startH.value = rectH.value;
      })
      .onUpdate((e) => {
        const minSize = 40;
        if (corner === 'tl') {
          const newX = Math.max(displayedLayout.offsetX, Math.min(startX.value + e.translationX, startX.value + startW.value - minSize));
          const newY = Math.max(displayedLayout.offsetY, Math.min(startY.value + e.translationY, startY.value + startH.value - minSize));
          rectW.value = startW.value + (startX.value - newX);
          rectH.value = startH.value + (startY.value - newY);
          rectX.value = newX;
          rectY.value = newY;
        } else if (corner === 'tr') {
          const newY = Math.max(displayedLayout.offsetY, Math.min(startY.value + e.translationY, startY.value + startH.value - minSize));
          const newW = Math.min(displayedLayout.width - (startX.value - displayedLayout.offsetX), Math.max(minSize, startW.value + e.translationX));
          rectY.value = newY;
          rectH.value = startH.value + (startY.value - newY);
          rectW.value = newW;
        } else if (corner === 'bl') {
          const newX = Math.max(displayedLayout.offsetX, Math.min(startX.value + e.translationX, startX.value + startW.value - minSize));
          const newH = Math.min(displayedLayout.height - (startY.value - displayedLayout.offsetY), Math.max(minSize, startH.value + e.translationY));
          rectX.value = newX;
          rectW.value = startW.value + (startX.value - newX);
          rectH.value = newH;
        } else if (corner === 'br') {
          rectW.value = Math.min(displayedLayout.width - (startX.value - displayedLayout.offsetX), Math.max(minSize, startW.value + e.translationX));
          rectH.value = Math.min(displayedLayout.height - (startY.value - displayedLayout.offsetY), Math.max(minSize, startH.value + e.translationY));
        }
      });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rectX.value }, { translateY: rectY.value }],
    width: rectW.value,
    height: rectH.value,
  }));

  const handleConfirm = () => {
    if (imageSize.width === 0 || displayedLayout.width === 0) return;
    
    const scaleX = imageSize.width / displayedLayout.width;
    const scaleY = imageSize.height / displayedLayout.height;

    // Calculate relative to image origin (subtracting displayed offsets)
    let finalX = (rectX.value - displayedLayout.offsetX) * scaleX;
    let finalY = (rectY.value - displayedLayout.offsetY) * scaleY;
    let finalW = rectW.value * scaleX;
    let finalH = rectH.value * scaleY;

    // FINAL CLAMPING to prevent "y + height > bitmap.height"
    finalX = Math.max(0, Math.floor(finalX));
    finalY = Math.max(0, Math.floor(finalY));
    finalW = Math.min(imageSize.width - finalX, Math.floor(finalW));
    finalH = Math.min(imageSize.height - finalY, Math.floor(finalH));

    console.log(`[Overlay] Confirming crop: x=${finalX}, y=${finalY}, w=${finalW}, h=${finalH} on image ${imageSize.width}x${imageSize.height}`);

    onConfirm({
      x: finalX,
      y: finalY,
      width: finalW,
      height: finalH
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing Image...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          
          <View style={styles.overlay}>
              <GestureDetector gesture={dragGesture}>
                  <Animated.View style={[styles.rectangle, animatedStyle]}>
                      <GestureDetector gesture={createCornerGesture('tl')}>
                        <Animated.View style={[styles.cornerHandle, { top: -15, left: -15 }]} />
                      </GestureDetector>
                      <GestureDetector gesture={createCornerGesture('tr')}>
                        <Animated.View style={[styles.cornerHandle, { top: -15, right: -15 }]} />
                      </GestureDetector>
                      <GestureDetector gesture={createCornerGesture('bl')}>
                        <Animated.View style={[styles.cornerHandle, { bottom: -15, left: -15 }]} />
                      </GestureDetector>
                      <GestureDetector gesture={createCornerGesture('br')}>
                        <Animated.View style={[styles.cornerHandle, { bottom: -15, right: -15 }]} />
                      </GestureDetector>

                      <View style={styles.centerLabel}>
                          <Text style={styles.labelText}>Perfectly Frame the Screen</Text>
                      </View>
                  </Animated.View>
              </GestureDetector>
          </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.buttonCancel} onPress={onCancel}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buttonRetake} onPress={onRetake}>
          <RotateCcw color="#FFF" size={20} />
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm}>
          <Check color="#FFF" size={20} />
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageContainer: { flex: 1, justifyContent: 'center' },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: { ...StyleSheet.absoluteFillObject },
  rectangle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: '#00FF00',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFF',
    // Elevation/Shadow for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  centerLabel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  labelText: {
    color: '#00FF00',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
  },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 16 },
  controls: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  buttonConfirm: { flexDirection: 'row', backgroundColor: '#34C759', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 30, alignItems: 'center', elevation: 4 },
  buttonRetake: { flexDirection: 'row', backgroundColor: '#FF9500', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 30, alignItems: 'center', elevation: 4 },
  buttonCancel: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 35, elevation: 4 },
  buttonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});

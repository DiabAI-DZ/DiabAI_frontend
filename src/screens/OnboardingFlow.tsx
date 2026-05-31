import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { 
  ONBOARDING_ONE_SVG, 
  ONBOARDING_TWO_SVG, 
  ONBOARDING_THREE_SVG 
} from '../assets/svgData';

const { width } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: '1',
    title: 'Ditch the Paper Logbook',
    description: 'Simply snap a photo of your glucometer screen. Our AI instantly reads and saves your results no manual entry needed.',
    svgXml: ONBOARDING_ONE_SVG,
  },
  {
    id: '2',
    title: 'Analyze Your Meals',
    description: 'Take a picture of your plate to assess its impact. DiabIA helps you understand your food to better predict your blood sugar levels.',
    svgXml: ONBOARDING_TWO_SVG,
  },
  {
    id: '3',
    title: 'Smart Health Insights',
    description: 'Turn raw numbers into clear charts. Get personalized alerts and easily share an accurate history with your doctor.',
    svgXml: ONBOARDING_THREE_SVG,
  },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { C } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    console.log('[Onboarding] handleNext - currentIndex:', currentIndex);
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      // setCurrentIndex(currentIndex + 1); // Let onMomentumScrollEnd handle it
    } else {
      console.log('[Onboarding] Triggering onComplete');
      onComplete();
    }
  };

  const renderItem = ({ item }: { item: typeof STEPS[0] }) => (
    <View style={styles.slide}>
      <View style={styles.svgContainer}>
        <SvgXml xml={item.svgXml} width={width * 0.85} height={width * 0.85} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: '#451C1C' }]}>{item.title}</Text>
        <Text style={[styles.stepDescription, { color: '#A86262' }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FCF0F0' }]}>
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        {/* Indicators matching Flutter colors precisely */}
        <View style={styles.indicatorContainer}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicator,
                {
                  backgroundColor: i === currentIndex ? '#D7181D' : '#EAC5C5',
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                },
              ]}
            />
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity 
            onPress={handleNext}
            activeOpacity={0.85}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>
              {currentIndex === STEPS.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: width * 0.85,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 8,
  },
  indicator: {
    marginHorizontal: 2,
  },
  buttonWrapper: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#D7181D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D7181D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FCF0F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingFlow;

import React, { useState } from 'react';
import SplashScreen from './SplashScreen';
import OnboardingFlow from './OnboardingFlow';
import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ResetPasswordScreen from './ResetPasswordScreen';
import GlucoVisionHome from './GlucoVisionHome';
import AlertsScreen from './AlertsScreen';
import DetailScreen from './DetailScreen';
import AccountSettingsScreen from './AccountSettingsScreen';
import PaymentScreen, { PLANS } from './PaymentScreen';
import RemindersScreen from './RemindersScreen';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type Screen =
  | 'splash'
  | 'onboarding'
  | 'signIn'
  | 'signUp'
  | 'forgotPassword'
  | 'resetPassword'
  | 'home'
  | 'alerts'
  | 'detail'
  | 'accountSettings'
  | 'reminders'
  | 'payment';

const MainNavigation: React.FC = () => {
  const { profile } = useUser();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [detailEntry, setDetailEntry] = useState<any>(null);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);

  const navigateToDetail = (entry: any) => {
    setDetailEntry(entry);
    setCurrentScreen('detail');
  };

  const goBack = () => {
    setCurrentScreen('home');
    setDetailEntry(null);
    setPaymentPlan(null);
  };

  // Load onboarding state
  React.useEffect(() => {
    const checkOnboarding = async () => {
      const val = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(val === 'true');
    };
    checkOnboarding();
  }, []);

  // Navigation sync based on auth state
  React.useEffect(() => {
    if (hasSeenOnboarding === null) return;

    const isAuthScreen = ['signIn', 'signUp', 'forgotPassword', 'resetPassword'].includes(currentScreen);
    const isPublicScreen = ['splash', 'onboarding'].includes(currentScreen);

    if (currentScreen === 'splash' && hasSeenOnboarding) {
      // Skip onboarding if already seen
      // We still wait for splash to "complete" via its own callback,
      // but we handle the destination here.
    }

    if (profile && isAuthScreen) {
      setCurrentScreen('home');
    } else if (!profile && !isAuthScreen && !isPublicScreen) {
      setCurrentScreen('signIn');
    }
  }, [profile, currentScreen, hasSeenOnboarding]);

  const handleSplashComplete = () => {
    if (hasSeenOnboarding) {
      setCurrentScreen('signIn');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = async () => {
    console.log('[MainNavigation] handleOnboardingComplete triggered');
    try {
      // Don't await forever if storage is weird
      await Promise.race([
        AsyncStorage.setItem('hasSeenOnboarding', 'true'),
        new Promise((_, reject) => setTimeout(() => reject('AsyncStorage timeout'), 1000))
      ]);
      console.log('[MainNavigation] AsyncStorage updated');
    } catch (e) {
      console.warn('[MainNavigation] Error saving onboarding state:', e);
    } finally {
      console.log('[MainNavigation] Switching to signIn');
      setHasSeenOnboarding(true);
      setCurrentScreen('signIn');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      case 'onboarding':
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
      case 'signIn':
        return (
          <SignInScreen
            onNavigateToSignUp={() => setCurrentScreen('signUp')}
            onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
            onSuccess={() => setCurrentScreen('home')}
          />
        );
      case 'signUp':
        return (
          <SignUpScreen
            onNavigateToSignIn={() => setCurrentScreen('signIn')}
            onSuccess={() => setCurrentScreen('signIn')}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordScreen
            onNavigateToSignIn={() => setCurrentScreen('signIn')}
            onOtpSent={(email) => {
              setResetEmail(email);
              setCurrentScreen('resetPassword');
            }}
          />
        );
      case 'resetPassword':
        return (
          <ResetPasswordScreen
            email={resetEmail}
            onSuccess={() => setCurrentScreen('signIn')}
            onBack={() => setCurrentScreen('signIn')}
          />
        );
      case 'accountSettings':
        return <AccountSettingsScreen onBack={() => setCurrentScreen('home')} />;
      case 'home':
        return (
          <GlucoVisionHome
            onNavigateAlerts={() => setCurrentScreen('alerts')}
            onNavigateDetail={navigateToDetail}
            onNavigateAccountSettings={() => setCurrentScreen('accountSettings')}
            onNavigatePayment={(planId: string) => {
              const plan = PLANS.find(p => p.id === planId) || PLANS[1]; // default to premium
              setPaymentPlan(plan);
              setCurrentScreen('payment');
            }}
            onNavigateReminders={() => setCurrentScreen('reminders')}
          />
        );
      case 'reminders':
        return <RemindersScreen onBack={() => setCurrentScreen('home')} />;
      case 'accountSettings':
        return <AccountSettingsScreen onBack={() => setCurrentScreen('home')} />;
      case 'alerts':
        return <AlertsScreen onBack={() => setCurrentScreen('home')} />;
      case 'detail':
        return <DetailScreen entry={detailEntry} onBack={goBack} />;
      case 'payment':
        return paymentPlan ? (
          <PaymentScreen
            plan={paymentPlan}
            onBack={goBack}
            onSuccess={() => {
              // Update local profile if needed, but PaymentScreen.tsx seems to handle success UI
              // We could potentially trigger a profile reload here
            }}
          />
        ) : <SplashScreen onComplete={handleSplashComplete} />;
      default:
        return <SplashScreen onComplete={handleSplashComplete} />;
    }
  };

  return (
    <Animated.View key={currentScreen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={{ flex: 1 }}>
      {renderScreen()}
    </Animated.View>
  );
};

export default MainNavigation;

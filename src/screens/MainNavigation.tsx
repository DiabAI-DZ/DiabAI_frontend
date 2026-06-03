import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import { useUser } from '../context/UserContext';
import { apiService } from '../services/apiService';
import {
  initPushNotifications,
  parseDeepLink,
  DeepLinkTarget,
} from '../services/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { onNavigate } from '../services/uiEvents';

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
  | 'payment';

const MainNavigation: React.FC = () => {
  const { profile } = useUser();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [detailEntry, setDetailEntry] = useState<any>(null);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);
  const [pushBanner, setPushBanner] = useState<{ title?: string; body?: string; data?: Record<string, string> } | null>(null);

  // Back-stack: each push records the screen we're leaving (and, for details, which entry was
  // shown) so goBack() can return to the *previous* page instead of always jumping to home.
  const [navStack, setNavStack] = useState<Array<{ screen: Screen; entry?: any }>>([]);
  // The home tab that was active when we left it, so returning home restores Logbook/Insights/etc
  // instead of resetting to the Home tab (GlucoVisionHome unmounts while a detail is open).
  const [homeTab, setHomeTab] = useState<'home' | 'log' | 'ai' | 'settings'>('home');

  // Refs mirror the latest screen/entry so the (mount-once) push-deeplink + navigate listeners
  // can push onto the stack without capturing stale state.
  const currentScreenRef = React.useRef(currentScreen);
  const detailEntryRef = React.useRef(detailEntry);
  React.useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);
  React.useEffect(() => { detailEntryRef.current = detailEntry; }, [detailEntry]);

  // Open a detail page, remembering where we came from. Tapping a related entry from inside a
  // detail (meal -> measurement, injection -> meal, ...) stacks the current detail so back works.
  const navigateToDetail = React.useCallback((entry: any) => {
    const from = currentScreenRef.current;
    if (from === 'detail' && detailEntryRef.current) {
      setNavStack((s) => [...s, { screen: 'detail', entry: detailEntryRef.current }]);
    } else if (from === 'home') {
      setNavStack((s) => [...s, { screen: 'home' }]);
    }
    setDetailEntry(entry);
    setCurrentScreen('detail');
  }, []);

  // Route from a tapped/parsed push to the entry it references, falling back to the
  // notifications list when the entry can't be resolved.
  const handlePushDeepLink = useCallback(async (target: DeepLinkTarget) => {
    if (target.entryType && target.entryId) {
      const entry = await apiService.fetchEntryByRef(target.entryType, target.entryId);
      if (entry) {
        if (target.notificationId) apiService.markAlertRead(target.notificationId);
        navigateToDetail(entry);
        return;
      }
    }
    setCurrentScreen('alerts');
  }, [navigateToDetail]);

  // Initialise FCM handlers once the user is authenticated; tear down on logout. Self-guards
  // when the native module is absent (Expo Go / pre-dev-build).
  React.useEffect(() => {
    if (!profile) return;
    const unsubscribe = initPushNotifications({
      onDeepLink: handlePushDeepLink,
      onForegroundMessage: (msg) => setPushBanner(msg),
    });
    return unsubscribe;
  }, [profile, handlePushDeepLink]);

  // Auto-dismiss the foreground banner.
  React.useEffect(() => {
    if (!pushBanner) return;
    const t = setTimeout(() => setPushBanner(null), 5000);
    return () => clearTimeout(t);
  }, [pushBanner]);

  const goBack = () => {
    // Pop the previous page off the back-stack if there is one.
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setNavStack((s) => s.slice(0, -1));
      setPaymentPlan(null);
      if (prev.screen === 'detail') {
        setDetailEntry(prev.entry);
        setCurrentScreen('detail');
      } else {
        setDetailEntry(null);
        setCurrentScreen(prev.screen);
      }
      return;
    }
    // Nothing to go back to -> home (restores the last-active home tab via homeTab).
    setCurrentScreen('home');
    setDetailEntry(null);
    setPaymentPlan(null);
  };

  // Load onboarding state
  React.useEffect(() => {
    const unsubscribe = onNavigate((screen: string, payload?: any) => {
      // Only accept known screens to avoid surprises
      const known: Screen[] = ['home','alerts','detail','accountSettings','payment','signIn','signUp','forgotPassword','resetPassword','onboarding','splash'];
      if (known.includes(screen as Screen)) {
        // Route detail navigations through the stack-aware helper so back works
        // when one detail opens another (e.g. a related entry).
        if (screen === 'detail' && payload) {
          navigateToDetail(payload);
          return;
        }
        setCurrentScreen(screen as Screen);
        if (screen === 'payment' && payload) setPaymentPlan(payload);
      }
    });

    const checkOnboarding = async () => {
      const val = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(val === 'true');
    };
    checkOnboarding();
    return () => { if (unsubscribe) unsubscribe(); };
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
            initialTab={homeTab}
            onTabChange={setHomeTab}
            onNavigateAlerts={() => setCurrentScreen('alerts')}
            onNavigateDetail={navigateToDetail}
            onNavigateAccountSettings={() => setCurrentScreen('accountSettings')}
            onNavigatePayment={(planId: string) => {
              const plan = PLANS.find(p => p.id === planId) || PLANS[1]; // default to premium
              setPaymentPlan(plan);
              setCurrentScreen('payment');
            }}
          />
        );

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
    <View style={{ flex: 1 }}>
      <Animated.View key={currentScreen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={{ flex: 1 }}>
        {renderScreen()}
      </Animated.View>

      {/* Foreground push banner (FCM shows no system tray notification while the app is open). */}
      {pushBanner && (
        <TouchableOpacity
          style={styles.pushBanner}
          activeOpacity={0.92}
          onPress={() => {
            const target = parseDeepLink(pushBanner.data);
            setPushBanner(null);
            handlePushDeepLink(target);
          }}
        >
          <Text style={styles.pushBannerTitle} numberOfLines={1}>
            {pushBanner.title || 'New notification'}
          </Text>
          {!!pushBanner.body && (
            <Text style={styles.pushBannerBody} numberOfLines={2}>
              {pushBanner.body}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pushBanner: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F2D0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pushBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  pushBannerBody: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default MainNavigation;

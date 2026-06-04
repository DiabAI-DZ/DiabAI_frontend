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
import PremiumOverlay from './PremiumOverlay';
import { useUser } from '../context/UserContext';
import { apiService } from '../services/apiService';
import { authApi } from '../services/authApi';
import {
  initPushNotifications,
  parseDeepLink,
  DeepLinkTarget,
} from '../services/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { onNavigate, onPremiumRequired } from '../services/uiEvents';

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
  // Whether a persisted session token exists (null = not yet checked). Drives the splash route so
  // a returning user goes straight to Home instead of flashing the sign-in screen.
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  // Set once the splash animation finishes; lets us route as soon as the bootstrap reads land.
  const splashDoneRef = React.useRef(false);
  const [resetEmail, setResetEmail] = useState('');
  const [detailEntry, setDetailEntry] = useState<any>(null);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);
  const [pushBanner, setPushBanner] = useState<{ title?: string; body?: string; data?: Record<string, string> } | null>(null);
  // Premium blocker overlay: shown when a free user hits a premium-gated screen (Insights/Alerts).
  const [premiumVisible, setPremiumVisible] = useState(false);

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

  // Show the premium blocker when a free user hits a gated screen (403 from Insights/Alerts).
  React.useEffect(() => {
    const unsub = onPremiumRequired(() => setPremiumVisible(true));
    return () => { if (unsub) unsub(); };
  }, []);

  // "Upgrade to Premium" -> close the gate and go straight to the checkout (Payment) screen
  // pre-filled with the Premium plan.
  const handlePremiumUpgrade = React.useCallback(() => {
    setPremiumVisible(false);
    // Reset the home tab to Home so returning from checkout (whether they subscribe or cancel)
    // never lands a still-free user back on the gated Insights tab.
    setHomeTab('home');
    const plan = PLANS.find((p) => p.id === 'premium') || PLANS[1];
    setPaymentPlan(plan);
    setCurrentScreen('payment');
  }, []);

  // "Maybe later" (and the trapped back button) -> close the gate and return Home, so the gated
  // screen doesn't immediately re-trigger the 403 and re-open the overlay.
  const handlePremiumDismiss = React.useCallback(() => {
    setPremiumVisible(false);
    setHomeTab('home');
    setDetailEntry(null);
    setNavStack([]);
    setCurrentScreen('home');
  }, []);

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

    // Cold-start bootstrap: read the onboarding flag AND restore the persisted token in parallel,
    // so the splash can route correctly (Home if logged in) without flashing sign-in/onboarding.
    const bootstrap = async () => {
      const [seen, token] = await Promise.all([
        AsyncStorage.getItem('hasSeenOnboarding'),
        authApi.restoreToken(),
      ]);
      setHasSeenOnboarding(seen === 'true');
      setHasToken(!!token);
    };
    bootstrap();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Where to go once the splash finishes and the bootstrap reads are in: Home if a token exists,
  // otherwise sign-in (returning user) or onboarding (brand-new user).
  const bootReady = hasSeenOnboarding !== null && hasToken !== null;
  const routeFromSplash = React.useCallback(() => {
    if (hasToken) setCurrentScreen('home');
    else if (hasSeenOnboarding) setCurrentScreen('signIn');
    else setCurrentScreen('onboarding');
  }, [hasToken, hasSeenOnboarding]);

  // Navigation sync based on auth state.
  React.useEffect(() => {
    if (!bootReady) return;

    const isAuthScreen = ['signIn', 'signUp', 'forgotPassword', 'resetPassword'].includes(currentScreen);
    const isPublicScreen = ['splash', 'onboarding'].includes(currentScreen);

    if (profile && isAuthScreen) {
      setCurrentScreen('home');
    } else if (!profile && !authApi.getToken() && !isAuthScreen && !isPublicScreen) {
      // Only kick to sign-in when there's genuinely no session. While a token is present and the
      // profile is still loading (cold-start restore), stay put so we don't flash the login page.
      setCurrentScreen('signIn');
    }
  }, [profile, currentScreen, bootReady]);

  const handleSplashComplete = () => {
    splashDoneRef.current = true;
    // If the bootstrap reads already landed, route now; otherwise the effect below routes once
    // they do. Either ordering is handled, so the splash never routes on a stale (null) value.
    if (bootReady) routeFromSplash();
  };

  // Splash finished before the bootstrap reads resolved → route as soon as they do.
  React.useEffect(() => {
    if (bootReady && splashDoneRef.current && currentScreen === 'splash') {
      routeFromSplash();
    }
  }, [bootReady, currentScreen, routeFromSplash]);

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

      {/* Premium blocker — rendered in-tree (not in a Modal) so its BlurView actually blurs the
          live screen behind it on both iOS and Android. */}
      <PremiumOverlay
        visible={premiumVisible}
        onUpgrade={handlePremiumUpgrade}
        onDismiss={handlePremiumDismiss}
      />
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

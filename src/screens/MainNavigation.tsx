import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, X } from 'lucide-react-native';
import SplashScreen from './SplashScreen';
import OnboardingFlow from './OnboardingFlow';
import SignInScreen from './Auth/SignInScreen';
import SignUpScreen from './Auth/SignUpScreen';
import ForgotPasswordScreen from './Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './Auth/ResetPasswordScreen';
import GlucoVisionHome from './GlucoVisionHome/GlucoVisionHome';
import AlertsScreen from './Notifications/AlertsScreen';
import DetailScreen from './Details/DetailScreen';
import AccountSettingsScreen from './Settings/AccountSettingsScreen';
import PaymentScreen, { PLANS } from './Checkout/PaymentScreen';
import PremiumOverlay from './PremiumOverlay';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/apiService';
import { authApi } from '../services/authApi';
import {
  initPushNotifications,
  parseDeepLink,
  DeepLinkTarget,
} from '../services/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { onNavigate, onPremiumRequired } from '../services/uiEvents';
import { useFirstRunPermissions } from '../hooks/useFirstRunPermissions';

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
  const { colors } = useTheme();

  // First authenticated session → ask once for notifications, then camera (native OS dialogs).
  useFirstRunPermissions(!!profile);

  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  // Whether a persisted session token exists (null = not yet checked). Drives the splash route so
  // a returning user goes straight to Home instead of flashing the sign-in screen.
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  // True once the splash animation finishes. MUST be state (not a ref) so completing the splash
  // re-runs the routing effect below — otherwise routing can be missed when the splash finishes
  // after the bootstrap reads have already landed.
  const [splashDone, setSplashDone] = useState(false);
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

  // Stable callback for SplashScreen (whose animation effect captures it once). It only flips
  // state; the effect below performs the actual routing once BOTH the splash is done and the
  // bootstrap reads have landed — in either order.
  const handleSplashComplete = React.useCallback(() => setSplashDone(true), []);

  React.useEffect(() => {
    if (bootReady && splashDone && currentScreen === 'splash') {
      routeFromSplash();
    }
  }, [bootReady, splashDone, currentScreen, routeFromSplash]);

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
        <Animated.View
          entering={FadeInDown.springify().damping(18).mass(0.7)}
          exiting={FadeOutUp.duration(220)}
          style={[styles.pushBannerWrap, { shadowColor: colors.shadow }]}
        >
          <TouchableOpacity
            style={[styles.pushBanner, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => {
              const target = parseDeepLink(pushBanner.data);
              setPushBanner(null);
              handlePushDeepLink(target);
            }}
          >
            <LinearGradient
              colors={['#C0392B', '#991B1B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pushBannerIcon}
            >
              <Bell size={18} color="#FFF" strokeWidth={2.3} fill="#FFF" />
            </LinearGradient>

            <View style={styles.pushBannerTextWrap}>
              <Text style={[styles.pushBannerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {pushBanner.title || 'New notification'}
              </Text>
              {!!pushBanner.body && (
                <Text style={[styles.pushBannerBody, { color: colors.textSecondary }]} numberOfLines={2}>
                  {pushBanner.body}
                </Text>
              )}
            </View>

            <ChevronRight size={18} color={colors.primary} strokeWidth={2.5} />

            <TouchableOpacity
              onPress={() => setPushBanner(null)}
              hitSlop={10}
              style={[styles.pushBannerClose, { backgroundColor: colors.backgroundMuted }]}
            >
              <X size={13} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
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
  pushBannerWrap: {
    position: 'absolute',
    top: 52,
    left: 14,
    right: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  pushBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  pushBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushBannerTextWrap: {
    flex: 1,
  },
  pushBannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  pushBannerBody: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  pushBannerClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});

export default MainNavigation;

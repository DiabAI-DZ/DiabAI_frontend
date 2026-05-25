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
import { useUser } from '../context/UserContext';

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
  | 'accountSettings';

const MainNavigation: React.FC = () => {
  const { profile } = useUser();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [resetEmail, setResetEmail] = useState('');
  const [detailEntry, setDetailEntry] = useState<any>(null);

  const navigateToDetail = (entry: any) => {
    setDetailEntry(entry);
    setCurrentScreen('detail');
  };

  const goBack = () => {
    setCurrentScreen('home');
    setDetailEntry(null);
  };

  // Navigation sync based on auth state
  React.useEffect(() => {
    const isAuthScreen = ['signIn', 'signUp', 'forgotPassword', 'resetPassword'].includes(currentScreen);
    const isPublicScreen = ['splash', 'onboarding'].includes(currentScreen);

    if (profile && isAuthScreen) {
      setCurrentScreen('home');
    } else if (!profile && !isAuthScreen && !isPublicScreen) {
      setCurrentScreen('signIn');
    }
  }, [profile, currentScreen]);

  switch (currentScreen) {
    case 'splash':
      return <SplashScreen onComplete={() => setCurrentScreen('onboarding')} />;
    case 'onboarding':
      return <OnboardingFlow onComplete={() => setCurrentScreen('signIn')} />;
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
    case 'home':
      return (
        <GlucoVisionHome 
          onNavigateAlerts={() => setCurrentScreen('alerts')} 
          onNavigateDetail={navigateToDetail}
          onNavigateAccountSettings={() => setCurrentScreen('accountSettings')}
        />
      );
    case 'accountSettings':
      return <AccountSettingsScreen onBack={() => setCurrentScreen('home')} />;
    case 'alerts':
      return <AlertsScreen onBack={() => setCurrentScreen('home')} />;
    case 'detail':
      return <DetailScreen entry={detailEntry} onBack={goBack} />;
    default:
      return <SplashScreen onComplete={() => setCurrentScreen('onboarding')} />;
  }
};

export default MainNavigation;

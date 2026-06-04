import React, { useState, useCallback, useTransition } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  Home, ClipboardList, Settings as SettingsIcon,
} from 'lucide-react-native';
import Dashboard from './Dashboard';
import LogbookScreen from './LogbookScreen';
import AIInsightsScreen from './AIInsightsScreen';
import SettingsScreen from './SettingsScreen';
import ScanFlow from './ScanFlow';
import ActionForms from '../components/ActionForms';
import InsightsFAB, { FabAction } from '../components/InsightsFAB';
import { InsightsIcon } from '../components/icons/NavIcons';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { emitPremiumRequired } from '../services/uiEvents';

// Inactive nav icon/label colour (muted red), matching the Figma bottom-nav.
const NAV_INACTIVE = '#A86262';

// Memoize tab screens to prevent re-renders when not active
const MemoizedDashboard = React.memo(Dashboard);
const MemoizedLogbookScreen = React.memo(LogbookScreen);
const MemoizedAIInsightsScreen = React.memo(AIInsightsScreen);
const MemoizedSettingsScreen = React.memo(SettingsScreen);

interface TabItemProps {
  name: 'home' | 'log' | 'ai' | 'settings';
  icon: any;
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}

const TabItem = React.memo(({ name, icon: Icon, label, isActive, onPress, activeColor, inactiveColor }: TabItemProps) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
  >
    <Icon size={24} color={isActive ? activeColor : inactiveColor} />
    <Text style={[styles.tabLabel, { color: isActive ? activeColor : inactiveColor }]}>{label}</Text>
  </TouchableOpacity>
));

interface GlucoVisionHomeProps {
  onNavigateAlerts: () => void;
  onNavigateDetail: (entry: any) => void;
  onNavigateAccountSettings: () => void;
  onNavigatePayment: (planId: string) => void;
  // Tab to start on when (re)mounting — lets the navigator restore the previously
  // active tab after returning from a detail page.
  initialTab?: 'home' | 'log' | 'ai' | 'settings';
  // Notifies the navigator whenever the active tab changes so it can be restored later.
  onTabChange?: (tab: 'home' | 'log' | 'ai' | 'settings') => void;
}

const GlucoVisionHome: React.FC<GlucoVisionHomeProps> = ({
  onNavigateAlerts,
  onNavigateDetail,
  onNavigateAccountSettings,
  onNavigatePayment,
  initialTab = 'home',
  onTabChange,
}) => {
  const { C, isDark } = useTheme();
  const { addLog } = useData();
  const { profile } = useUser();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'ai' | 'settings'>(initialTab);

  // Report tab changes up so the navigator can restore this tab after a detail page.
  React.useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  // Follow the navigator's desired tab when it changes externally. The premium blocker's
  // "Maybe later" resets the navigator to Home, so this moves a free user off the gated
  // Insights tab back to Home instead of leaving them stranded on it. Same-value sets are no-ops,
  // so this never fights the normal tab taps above.
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [showScan, setShowScan] = useState(false);
  const [scanMode, setScanMode] = useState<'glucose' | 'meal'>('glucose');
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionType, setActionType] = useState<'injection' | 'activity'>('injection');

  const [logbookFilter, setLogbookFilter] = useState<'all' | 'measurements' | 'meals' | 'injections' | 'activities'>('all');

  const handleTabPress = useCallback((tabName: 'home' | 'log' | 'ai' | 'settings') => {
    // Insights is premium-only. For a free user, navigate to the Insights page AND raise the
    // premium blocker so it sits on top of the (blurred) Insights page. Triggered synchronously
    // on the tap, so it only ever appears here — never on Home/login, even though insights are
    // prefetched in the background to warm the cache.
    if (tabName === 'ai' && !profile?.isPremium) {
      emitPremiumRequired();
    }
    startTransition(() => {
      if (tabName === 'log') {
        setLogbookFilter('all');
      }
      setActiveTab(tabName);
    });
  }, [profile?.isPremium]);

  const handleSeeAllMeasurements = useCallback(() => {
    startTransition(() => {
      setLogbookFilter('measurements');
      setActiveTab('log');
    });
  }, []);

  const handleAddOption = useCallback((type: FabAction) => {
    if (type === 'glucose_scan') {
      setScanMode('glucose');
      setShowScan(true);
    } else if (type === 'meal_scan') {
      setScanMode('meal');
      setShowScan(true);
    } else if (type === 'injection') {
      setActionType('injection');
      setShowActionPopup(true);
    } else if (type === 'activity') {
      setActionType('activity');
      setShowActionPopup(true);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.content}>
        {/* Render all screens but only show active one - prevents unmount/remount lag */}
        <View style={[styles.screenWrapper, { display: activeTab === 'home' ? 'flex' : 'none' }]}>
          <MemoizedDashboard
            onNavigateAlerts={onNavigateAlerts}
            onNavigateDetail={onNavigateDetail}
            onSeeAllMeasurements={handleSeeAllMeasurements}
            onSeeAllRecommendations={() => handleTabPress('ai')}
            isActive={activeTab === 'home'}
          />
        </View>

        <View style={[styles.screenWrapper, { display: activeTab === 'log' ? 'flex' : 'none' }]}>
          <MemoizedLogbookScreen
            onNavigateDetail={onNavigateDetail}
            initialTypeFilter={logbookFilter}
            isActive={activeTab === 'log'}
          />
        </View>

        <View style={[styles.screenWrapper, { display: activeTab === 'ai' ? 'flex' : 'none' }]}>
          <MemoizedAIInsightsScreen
            onNavigateAlerts={onNavigateAlerts}
            isActive={activeTab === 'ai'}
          />
        </View>

        <View style={[styles.screenWrapper, { display: activeTab === 'settings' ? 'flex' : 'none' }]}>
          <MemoizedSettingsScreen
            onNavigateAccountSettings={onNavigateAccountSettings}
            onNavigatePayment={onNavigatePayment}
          />
        </View>
      </View>

      <ActionForms
        visible={showActionPopup}
        onClose={() => setShowActionPopup(false)}
        type={actionType}
        onSave={addLog}
      />

      {/* Camera Flow Overlay */}
      {showScan && (
        <View style={StyleSheet.absoluteFill}>
          <ScanFlow
            mode={scanMode}
            onBack={() => setShowScan(false)}
            onComplete={() => setShowScan(false)}
          />
        </View>
      )}

      {/* Bottom Tab Bar + Floating Action Button */}
      {!showScan && (
        <>
          <View style={[styles.tabBar, { backgroundColor: C.white, borderTopColor: C.redBorder }]}>
            <TabItem
              name="home"
              icon={Home}
              label="Home"
              isActive={activeTab === 'home'}
              onPress={() => handleTabPress('home')}
              activeColor={C.red}
              inactiveColor={NAV_INACTIVE}
            />
            <TabItem
              name="ai"
              icon={InsightsIcon}
              label="Insights"
              isActive={activeTab === 'ai'}
              onPress={() => handleTabPress('ai')}
              activeColor={C.red}
              inactiveColor={NAV_INACTIVE}
            />

            {/* Spacer slot for the floating action button (rendered above as InsightsFAB) */}
            <View style={styles.fabSpacer} />

            <TabItem
              name="log"
              icon={ClipboardList}
              label="Logbook"
              isActive={activeTab === 'log'}
              onPress={() => handleTabPress('log')}
              activeColor={C.red}
              inactiveColor={NAV_INACTIVE}
            />
            <TabItem
              name="settings"
              icon={SettingsIcon}
              label="Settings"
              isActive={activeTab === 'settings'}
              onPress={() => handleTabPress('settings')}
              activeColor={C.red}
              inactiveColor={NAV_INACTIVE}
            />
          </View>

          <InsightsFAB color={C.red} gradient={[C.red, C.redDark]} onAction={handleAddOption} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 90,
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  fabSpacer: {
    width: 64,
  },
  scanContainer: {
    top: -20,
    alignItems: 'center',
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  animatedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  menuContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 160,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    gap: 40,
  },
  menuItem: {
    alignItems: 'center',
    gap: 8,
  },
  menuIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuText: {
    fontSize: 12,
    fontWeight: '800',
  },
  closeMenuBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  screenWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    display: 'none',
  }
});

export default GlucoVisionHome;

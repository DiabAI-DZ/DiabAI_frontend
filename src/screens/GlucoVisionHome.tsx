import React, { useState, useCallback, useTransition } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { 
  Home, ClipboardList, Scan, MessageSquare, Settings as SettingsIcon, 
  Plus, Utensils, Syringe, Activity, X 
} from 'lucide-react-native';
import Dashboard from './Dashboard';
import LogbookScreen from './LogbookScreen';
import AIInsightsScreen from './AIInsightsScreen';
import SettingsScreen from './SettingsScreen';
import ScanFlow from './ScanFlow';
import ActionForms from '../components/ActionForms';
import { BlurView } from 'expo-blur';
import { useData } from '../context/DataContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

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
}

const GlucoVisionHome: React.FC<GlucoVisionHomeProps> = ({ 
  onNavigateAlerts, 
  onNavigateDetail,
  onNavigateAccountSettings 
}) => {
  const { C, isDark } = useTheme();
  const { addLog } = useData();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'ai' | 'settings'>('home');
  const [showScan, setShowScan] = useState(false);
  const [scanMode, setScanMode] = useState<'glucose' | 'meal'>('glucose');
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionType, setActionType] = useState<'injection' | 'activity'>('injection');

  // Animation values
  const expandProgress = useSharedValue(0);
  const isExpanded = useSharedValue(false);

  const [logbookFilter, setLogbookFilter] = useState<'all' | 'measurements' | 'meals' | 'injections' | 'activities'>('all');

  const handleTabPress = useCallback((tabName: 'home' | 'log' | 'ai' | 'settings') => {
    startTransition(() => {
      if (tabName === 'log') {
        setLogbookFilter('all');
      }
      setActiveTab(tabName);
    });
  }, []);

  const handleSeeAllMeasurements = useCallback(() => {
    startTransition(() => {
      setLogbookFilter('measurements');
      setActiveTab('log');
    });
  }, []);

  const handleAddOption = (type: 'glucose_scan' | 'meal_scan' | 'injection' | 'activity') => {
    toggleMenu();
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
  };

  const toggleMenu = () => {
    const nextValue = !isExpanded.value;
    isExpanded.value = nextValue;
    expandProgress.value = withSpring(nextValue ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    pointerEvents: expandProgress.value > 0.1 ? 'auto' : 'none',
  }));

  const menuStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(expandProgress.value, [0, 1], [200, 0]) },
      { scale: interpolate(expandProgress.value, [0, 1], [0.8, 1]) },
    ],
  }));

  const fabStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.2], [1, 0]),
    transform: [
      { scale: interpolate(expandProgress.value, [0, 0.2], [1, 0.8]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.2], [1, 0]),
  }));

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.content}>
        {/* Render all screens but only show active one - prevents unmount/remount lag */}
        <View style={[styles.screenWrapper, { display: activeTab === 'home' ? 'flex' : 'none' }]}>
          <MemoizedDashboard 
            onNavigateAlerts={onNavigateAlerts} 
            onNavigateDetail={onNavigateDetail} 
            onSeeAllMeasurements={handleSeeAllMeasurements}
          />
        </View>
        
        <View style={[styles.screenWrapper, { display: activeTab === 'log' ? 'flex' : 'none' }]}>
          <MemoizedLogbookScreen 
            onNavigateDetail={onNavigateDetail} 
            initialTypeFilter={logbookFilter} 
          />
        </View>
        
        <View style={[styles.screenWrapper, { display: activeTab === 'ai' ? 'flex' : 'none' }]}>
          <MemoizedAIInsightsScreen onNavigateAlerts={onNavigateAlerts} />
        </View>
        
        <View style={[styles.screenWrapper, { display: activeTab === 'settings' ? 'flex' : 'none' }]}>
          <MemoizedSettingsScreen onNavigateAccountSettings={onNavigateAccountSettings} />
        </View>
      </View>

      <ActionForms 
        visible={showActionPopup} 
        onClose={() => setShowActionPopup(false)}
        type={actionType}
        onSave={addLog}
      />

      {/* Animated Add Menu */}
      <Animated.View style={[styles.animatedOverlay, overlayStyle]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={toggleMenu}
        >
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.menuContent, menuStyle]}>
          <View style={styles.menuRow}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleAddOption('glucose_scan')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: C.red }]}>
                <Scan size={24} color="#FFF" />
              </View>
              <Text style={[styles.menuText, { color: C.text }]}>Glucose Scan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleAddOption('meal_scan')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: C.red }]}>
                <Utensils size={24} color="#FFF" />
              </View>
              <Text style={[styles.menuText, { color: C.text }]}>Meal Scan</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.menuRow, { marginTop: 20 }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleAddOption('injection')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: C.red }]}>
                <Syringe size={24} color="#FFF" />
              </View>
              <Text style={[styles.menuText, { color: C.text }]}>Add Injection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleAddOption('activity')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: C.red }]}>
                <Activity size={24} color="#FFF" />
              </View>
              <Text style={[styles.menuText, { color: C.text }]}>Add Activity</Text>
            </TouchableOpacity>
          </View>

          {/* New Central Close Button */}
          <TouchableOpacity 
            style={[styles.closeMenuBtn, { backgroundColor: C.red, marginTop: 40 }]} 
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <X size={32} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

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

      {/* Bottom Tab Bar */}
      {!showScan && (
        <View style={[styles.tabBar, { backgroundColor: C.white, borderTopColor: C.redBorder }]}>
          <TabItem 
            name="home" 
            icon={Home} 
            label="Home"
            isActive={activeTab === 'home'}
            onPress={() => handleTabPress('home')}
            activeColor={C.red}
            inactiveColor={C.textXs}
          />
          <TabItem 
            name="log" 
            icon={ClipboardList} 
            label="Logbook"
            isActive={activeTab === 'log'}
            onPress={() => handleTabPress('log')}
            activeColor={C.red}
            inactiveColor={C.textXs}
          />
          
          {/* Floating Add Button */}
          <Animated.View style={[styles.scanContainer, fabStyle]}>
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: C.red }]}
              onPress={toggleMenu}
            >
              <Plus size={32} color="#FFF" />
            </TouchableOpacity>
            <Animated.Text style={[styles.tabLabel, { color: C.textXs, marginTop: 4 }, labelStyle]}>Add</Animated.Text>
          </Animated.View>
  
          <TabItem 
            name="ai" 
            icon={MessageSquare} 
            label="AI Insights"
            isActive={activeTab === 'ai'}
            onPress={() => handleTabPress('ai')}
            activeColor={C.red}
            inactiveColor={C.textXs}
          />
          <TabItem 
            name="settings" 
            icon={SettingsIcon} 
            label="Settings"
            isActive={activeTab === 'settings'}
            onPress={() => handleTabPress('settings')}
            activeColor={C.red}
            inactiveColor={C.textXs}
          />
        </View>
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

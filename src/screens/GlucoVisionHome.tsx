import React, { useState } from 'react';
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
import { Animated, Modal } from 'react-native';
import { useData } from '../context/DataContext';

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
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'ai' | 'settings'>('home');
  const [showScan, setShowScan] = useState(false);
  const [scanMode, setScanMode] = useState<'glucose' | 'meal'>('glucose');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [actionType, setActionType] = useState<'injection' | 'activity'>('injection');

  const [logbookFilter, setLogbookFilter] = useState<'all' | 'measurements' | 'meals' | 'injections' | 'activities'>('all');


  const renderContent = () => {
    switch (activeTab) {
      case 'home': 
        return (
          <Dashboard 
            onNavigateAlerts={onNavigateAlerts} 
            onNavigateDetail={onNavigateDetail} 
            onSeeAllMeasurements={() => {
              setLogbookFilter('measurements');
              setActiveTab('log');
            }}
          />
        );
      case 'log': 
        return <LogbookScreen onNavigateDetail={onNavigateDetail} initialTypeFilter={logbookFilter} />;
      case 'ai': 
        return <AIInsightsScreen onNavigateAlerts={onNavigateAlerts} />;
      case 'settings': 
        return <SettingsScreen onNavigateAccountSettings={onNavigateAccountSettings} />;
      default: 
        return (
          <Dashboard 
            onNavigateAlerts={onNavigateAlerts} 
            onNavigateDetail={onNavigateDetail} 
            onSeeAllMeasurements={() => {
              setLogbookFilter('measurements');
              setActiveTab('log');
            }}
          />
        );
    }
  };

  const TabItem = ({ name, icon: Icon, label }: { name: any, icon: any, label: string }) => {
    const isActive = activeTab === name;
    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => {
          if (name === 'log') {
            setLogbookFilter('all');
          }
          setActiveTab(name);
        }}
      >
        <Icon size={24} color={isActive ? C.red : C.textXs} />
        <Text style={[styles.tabLabel, { color: isActive ? C.red : C.textXs }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const handleAddOption = (type: 'glucose_scan' | 'meal_scan' | 'injection' | 'activity') => {
    setAddMenuOpen(false);
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

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.content}>
        {renderContent()}
      </View>

      <ActionForms 
        visible={showActionPopup} 
        onClose={() => setShowActionPopup(false)}
        type={actionType}
        onSave={addLog}
      />

      {/* Scan Flow Modal */}
      <Modal
        visible={showScan}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScan(false)}
      >
        <ScanFlow 
          mode={scanMode} 
          onBack={() => setShowScan(false)} 
          onComplete={() => setShowScan(false)} 
        />
      </Modal>

      {/* Add Menu Modal */}
      <Modal
        visible={addMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setAddMenuOpen(false)}
        >
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          
          <View style={styles.menuContent}>
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

            <TouchableOpacity 
              style={[styles.closeMenuBtn, { backgroundColor: C.red }]}
              onPress={() => setAddMenuOpen(false)}
            >
              <X size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: C.white, borderTopColor: C.redBorder }]}>
        <TabItem name="home" icon={Home} label="Home" />
        <TabItem name="log" icon={ClipboardList} label="Logbook" />
        
        {/* Floating Add Button */}
        <View style={styles.scanContainer}>
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: C.red }]}
            onPress={() => setAddMenuOpen(true)}
          >
            <Plus size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.tabLabel, { color: C.textXs, marginTop: 4 }]}>Add</Text>
        </View>

        <TabItem name="ai" icon={MessageSquare} label="AI Insights" />
        <TabItem name="settings" icon={SettingsIcon} label="Settings" />
      </View>
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
  menuContent: {
    paddingBottom: 120,
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
  }
});

export default GlucoVisionHome;

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Home, ClipboardList, Scan, MessageSquare, Settings as SettingsIcon, Plus } from 'lucide-react-native';
import Dashboard from './Dashboard';
import LogbookScreen from './LogbookScreen';
import AIInsightsScreen from './AIInsightsScreen';
import SettingsScreen from './SettingsScreen';
import ScanFlow from './ScanFlow';

interface GlucoVisionHomeProps {
  onNavigateAlerts: () => void;
  onNavigateDetail: (entry: any) => void;
}

const GlucoVisionHome: React.FC<GlucoVisionHomeProps> = ({ onNavigateAlerts, onNavigateDetail }) => {
  const { C } = useTheme();
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'ai' | 'settings'>('home');
  const [showScan, setShowScan] = useState(false);

  if (showScan) {
    return <ScanFlow onBack={() => setShowScan(false)} onComplete={() => setShowScan(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard onNavigateAlerts={onNavigateAlerts} onNavigateDetail={onNavigateDetail} />;
      case 'log': return <LogbookScreen onNavigateDetail={onNavigateDetail} />;
      case 'ai': return <AIInsightsScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <Dashboard onNavigateAlerts={onNavigateAlerts} onNavigateDetail={onNavigateDetail} />;
    }
  };

  const TabItem = ({ name, icon: Icon, label }: { name: any, icon: any, label: string }) => {
    const isActive = activeTab === name;
    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => setActiveTab(name)}
      >
        <Icon size={24} color={isActive ? C.red : C.textXs} />
        <Text style={[styles.tabLabel, { color: isActive ? C.red : C.textXs }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: C.white, borderTopColor: C.redBorder }]}>
        <TabItem name="home" icon={Home} label="Home" />
        <TabItem name="log" icon={ClipboardList} label="Logbook" />
        
        {/* Floating Scan Button */}
        <View style={styles.scanContainer}>
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: C.red }]}
            onPress={() => setShowScan(true)}
          >
            <Scan size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.tabLabel, { color: C.textXs, marginTop: 4 }]}>Scan</Text>
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
});

export default GlucoVisionHome;

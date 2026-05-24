import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Search, Calendar, Activity, Utensils, ChevronRight, SlidersHorizontal, X } from 'lucide-react-native';

const LogbookScreen: React.FC<{ onNavigateDetail: (entry: any) => void }> = ({ onNavigateDetail }) => {
  const { C, isDark } = useTheme();
  const { logs, loading, refreshData } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'measurement' | 'meal'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = search.toLowerCase();
    
    // Enhanced search: match type, name, tags, and values
    const logMatch = log.type === 'measurement' 
      ? (`glucose reading ${log.value} ${log.unit} ${log.tag || ''}`.toLowerCase().includes(searchLower))
      : (`${log.name} ${log.mealType} ${log.tags?.join(' ') || ''} ${log.carbs}g`.toLowerCase().includes(searchLower));
      
    const matchesFilter = filter === 'all' || log.type === filter;
    return logMatch && matchesFilter;
  });

  const renderLogItem = ({ item }: { item: any }) => {
    const isMeasurement = item.type === 'measurement';
    return (
      <TouchableOpacity 
        style={[styles.logCard, { backgroundColor: C.white, borderColor: C.redBorder }]}
        onPress={() => onNavigateDetail(item)}
      >
        <View style={[styles.iconBox, { backgroundColor: isMeasurement ? C.redBg : C.amber + '15' }]}>
          {isMeasurement ? <Activity size={22} color={C.red} /> : <Utensils size={22} color={C.amber} />}
        </View>
        <View style={styles.logMain}>
          <Text style={[styles.logTitle, { color: C.text }]}>
            {isMeasurement ? 'Glucose Reading' : item.name}
          </Text>
          <View style={styles.logMeta}>
             <Calendar size={12} color={C.textXs} />
             <Text style={[styles.logTime, { color: C.textXs }]}>
               {item.time} · {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </Text>
          </View>
        </View>
        <View style={styles.logValue}>
          <Text style={[styles.valueText, { color: C.text }]}>
            {isMeasurement ? `${item.value} ${item.unit}` : `${item.carbs}g`}
          </Text>
          <ChevronRight size={18} color={C.textXs} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Logbook</Text>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <SlidersHorizontal size={20} color={C.red} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#222226' : '#F5F5F5', borderColor: C.divider }]}>
          <Search size={20} color={C.textXs} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search values, tags, or meals..."
            placeholderTextColor={C.textXs}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={C.textXs} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterTabs}>
        {(['all', 'measurement', 'meal'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.tab,
              filter === f && { backgroundColor: C.red, borderColor: C.red }
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: filter === f ? '#FFF' : C.textSm }
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: C.textSm }]}>
              {search ? 'No logs match your search' : 'No logs found yet'}
            </Text>
            {search && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                <Text style={{ color: C.red, fontWeight: '700' }}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        onScrollBeginDrag={Keyboard.dismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '900' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500' },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  logCard: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1.5, alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  logMain: { flex: 1 },
  logTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logTime: { fontSize: 12, fontWeight: '600' },
  logValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueText: { fontSize: 15, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  clearSearchBtn: { marginTop: 12 },
});

export default LogbookScreen;

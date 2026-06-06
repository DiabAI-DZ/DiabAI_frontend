import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Wraps content in a ScrollView when true. */
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** SafeAreaView edges. Defaults to top only (tab bar handles the bottom). */
  edges?: Edge[];
  testID?: string;
}

/**
 * Standard screen frame: themed SafeAreaView + status bar + background, with an optional
 * pull-to-refresh ScrollView. Layout only — owns no data and no effects.
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  edges = ['top'],
  testID,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView
      testID={testID}
      edges={edges}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

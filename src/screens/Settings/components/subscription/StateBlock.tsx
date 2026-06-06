import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { subStyles } from './styles';

interface StateBlockProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

/** Reusable loading / error / empty state for the subscription popups. */
export const StateBlock: React.FC<StateBlockProps> = ({ loading, error, empty, emptyText, onRetry }) => {
  const { C } = useTheme();
  if (loading) {
    return (
      <View style={subStyles.stateBlock}>
        <ActivityIndicator color={C.red} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={subStyles.stateBlock}>
        <AlertTriangle size={24} color={C.red} />
        <Text style={[subStyles.stateText, { color: C.text }]}>{error}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={[subStyles.retryBtn, { borderColor: C.red }]}>
            <Text style={[subStyles.retryText, { color: C.red }]}>Try again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={subStyles.stateBlock}>
        <Text style={[subStyles.stateText, { color: C.textSm }]}>{emptyText || 'Nothing here yet.'}</Text>
      </View>
    );
  }
  return null;
};

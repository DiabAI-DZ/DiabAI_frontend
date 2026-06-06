import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Heart,
  Target,
  AlertTriangle,
  Zap,
  Activity,
  Flame,
  Brain,
  Sparkles,
  Globe,
} from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

interface InsightCardProps {
  icon: string;
  title: string;
  body: string;
  // Overall reading status, used to tint positive (normal) cards green and
  // out-of-range (high/low) cards red, per the spec.
  status?: 'normal' | 'high' | 'low' | string;
}

// Maps a free-form icon name from the API to a lucide icon component.
function resolveIcon(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('heart')) return Heart;
  if (n.includes('target')) return Target;
  if (n.includes('globe') || n.includes('world')) return Globe;
  if (n.includes('alert') || n.includes('triangle') || n.includes('warn')) return AlertTriangle;
  if (n.includes('zap') || n.includes('bolt') || n.includes('flash')) return Zap;
  if (n.includes('activity') || n.includes('chart')) return Activity;
  if (n.includes('flame') || n.includes('fire') || n.includes('burn')) return Flame;
  if (n.includes('brain') || n.includes('mind') || n.includes('pattern')) return Brain;
  if (n.includes('spark') || n.includes('star') || n.includes('magic')) return Sparkles;
  return Sparkles;
}

// One AI insight row: a tinted card with an icon chip, bold title and muted body.
const InsightCard: React.FC<InsightCardProps> = ({ icon, title, body, status }) => {
  const { C } = useTheme();
  const Icon = resolveIcon(icon);

  // Positive (in-range) insights get a green tint; out-of-range get the light red tint.
  const positive = status === 'normal';
  const cardBg = positive ? C.greenBg : C.redBg;
  const cardBorder = positive ? C.greenBorder : C.redBorder;
  const chipBg = positive ? C.greenBorder : C.redBorder;
  const iconColor = positive ? C.green : C.red;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={[styles.chip, { backgroundColor: chipBg }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: C.text }]}>{title}</Text>
        <Text style={[styles.body, { color: C.textSm }]}>{body}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});

export default InsightCard;

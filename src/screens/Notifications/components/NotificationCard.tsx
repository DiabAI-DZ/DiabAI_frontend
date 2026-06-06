import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Clock, Eye, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { AlertItem } from '../../../types';
import { cardIcon, severityTag, sourceTag, timeAgo, unreadDotColor } from '../notificationVisuals';
import TagPill from './TagPill';
import CriticalBanner from './CriticalBanner';

interface NotificationCardProps {
  item: AlertItem;
  onMarkRead: (id: number) => void;
}

const CHEVRON_OVERLAY = 'rgba(255,255,255,0.85)';

/** Renders a single notification: icon, title/desc, severity + source + time tags, critical CTA. */
const NotificationCard: React.FC<NotificationCardProps> = ({ item, onMarkRead }) => {
  const { colors } = useTheme();
  const isCritical = item.severity === 'critical';
  const sevTag = severityTag(item.severity, colors);
  const src = sourceTag(item, colors);
  const ic = cardIcon(item, colors);
  const SrcIcon = src.Icon;
  const CardIconCmp = ic.Icon;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border, shadowColor: colors.shadow }]}>
      {isCritical && <CriticalBanner />}

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: ic.circle }]}>
            <CardIconCmp size={20} color={ic.color} strokeWidth={2.2} />
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.titleRow}>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: unreadDotColor(item.severity, colors) }]} />}
              <Text style={[styles.cardTitle, { fontWeight: item.read ? '600' : '800', color: colors.textPrimary }]} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            {!!item.desc && <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>{item.desc}</Text>}

            <View style={styles.tagsRow}>
              <TagPill
                label={sevTag.label}
                backgroundColor={sevTag.bg}
                textColor={sevTag.text}
                dotColor={sevTag.dot}
                borderColor={sevTag.filled ? undefined : sevTag.border}
              />
              <TagPill
                label={src.label}
                backgroundColor={src.bg}
                textColor={src.text}
                icon={<SrcIcon size={10} color={src.text} strokeWidth={2.4} />}
              />
              <View style={styles.timeWrap}>
                <Clock size={11} color={colors.textMuted} />
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeAgo(item.date) || item.time}</Text>
              </View>
            </View>
          </View>
        </View>

        {isCritical && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => onMarkRead(item.id)} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Eye size={15} color={colors.textOnPrimary} strokeWidth={2.2} />
            <Text style={[styles.actionBtnText, { color: colors.textOnPrimary }]}>View Details & Take Action</Text>
            <ChevronRight size={16} color={CHEVRON_OVERLAY} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: { padding: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 7 },
  cardTitle: { flex: 1, fontSize: 15, lineHeight: 19 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: 'auto' },
  timeText: { fontSize: 11.5, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: 13,
    marginTop: spacing.lg,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});

export default NotificationCard;

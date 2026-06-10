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

const CHEVRON_OVERLAY = 'rgba(255,255,255,0.8)';

/** Compact notification card: severity icon, title/desc, severity + source + time meta, critical CTA. */
const NotificationCard: React.FC<NotificationCardProps> = ({ item, onMarkRead }) => {
  const { C, colors } = useTheme();
  const isCritical = item.severity === 'critical';
  const sevTag = severityTag(item.severity, colors);
  const src = sourceTag(item, colors);
  const ic = cardIcon(item, colors);
  const SrcIcon = src.Icon;
  const CardIconCmp = ic.Icon;

  const cardSkin = isCritical
    ? { backgroundColor: C.redBg, borderColor: colors.criticalText + '55', shadowColor: colors.criticalText }
    : { backgroundColor: colors.backgroundCard, borderColor: colors.border, shadowColor: colors.shadow };

  return (
    <TouchableOpacity
      activeOpacity={item.read ? 1 : 0.85}
      onPress={() => !item.read && onMarkRead(item.id)}
      style={[styles.card, cardSkin, isCritical && styles.cardCritical, { opacity: item.read ? 0.85 : 1 }]}
    >
      {isCritical && <CriticalBanner />}

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: ic.circle, shadowColor: ic.circle }]}>
            <CardIconCmp size={17} color={ic.color} strokeWidth={2.3} />
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.titleRow}>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: unreadDotColor(item.severity, colors) }]} />}
              <Text style={[styles.cardTitle, { fontWeight: item.read ? '600' : '700', color: colors.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            {!!item.desc && (
              <Text style={[styles.cardDesc, { color: isCritical ? C.redMuted : colors.textSecondary }]} numberOfLines={1}>
                {item.desc}
              </Text>
            )}

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
                <Clock size={10} color={colors.textMuted} />
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeAgo(item.date) || item.time}</Text>
              </View>
            </View>

            {isCritical && !item.read && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => onMarkRead(item.id)} style={[styles.actionBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                <Eye size={13} color={colors.textOnPrimary} strokeWidth={2.3} />
                <Text style={[styles.actionBtnText, { color: colors.textOnPrimary }]}>View Details & Take Action</Text>
                <ChevronRight size={14} color={CHEVRON_OVERLAY} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCritical: {
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  cardBody: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  contentColumn: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  cardTitle: { flex: 1, fontSize: 14.5, lineHeight: 19 },
  cardDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  timeText: { fontSize: 10.5, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
});

export default NotificationCard;

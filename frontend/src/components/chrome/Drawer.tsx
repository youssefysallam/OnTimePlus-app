import React from 'react';
import { ChevronRight, Clock3, Home, MessageCircle, Route, Settings, Siren, X } from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerRouteName } from '../../navigation/DrawerNavigator';
import { tokens } from '../../theme';
import { Text } from '../primitives';

const items = [
  { name: 'Chat', label: 'Chat', icon: MessageCircle },
  { name: 'Today', label: 'Today', icon: Home },
  { name: 'Schedule', label: 'Schedule', icon: Route },
  { name: 'Alerts', label: 'Alerts', icon: Siren },
  { name: 'History', label: 'History', icon: Clock3 },
  { name: 'Settings', label: 'Settings', icon: Settings },
];

const pinned = [
  { label: 'Red Line southbound', color: tokens.color.lineRed },
  { label: 'JFK/UMass shuttle', color: tokens.color.modeShuttle },
];

type DrawerProps = {
  activeRoute: DrawerRouteName;
  onNavigate: (route: DrawerRouteName) => void;
  onClose: () => void;
};

export const Drawer: React.FC<DrawerProps> = ({ activeRoute, onNavigate, onClose }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.panel, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text variant="title" style={styles.brand}>OnTime+</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityLabel="Close menu"
          accessibilityRole="button"
          activeOpacity={0.6}
        >
          <X size={22} color={tokens.color.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="label" color={tokens.color.textDim} style={styles.section}>
          COMMUTE
        </Text>
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onNavigate(item.name as DrawerRouteName)}
              activeOpacity={0.7}
            >
              <Icon size={20} color={active ? tokens.color.textInverse : tokens.color.textMuted} />
              <Text
                variant="body"
                color={active ? tokens.color.textInverse : tokens.color.textMuted}
                style={styles.itemLabel}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text variant="label" color={tokens.color.textDim} style={[styles.section, styles.sectionSpaced]}>
          PINNED
        </Text>
        {pinned.map((pin) => (
          <View key={pin.label} style={styles.pinnedRow}>
            <View style={[styles.dot, { backgroundColor: pin.color }]} />
            <Text variant="caption" color={tokens.color.textMuted}>
              {pin.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text variant="label" color={tokens.color.accent}>OT</Text>
        </View>
        <View style={styles.profileText}>
          <Text variant="caption">Local schedule</Text>
          <Text variant="caption" color={tokens.color.textDim}>Device only</Text>
        </View>
        <ChevronRight size={18} color={tokens.color.textDim} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: tokens.color.smoke,
    borderRightWidth: 1,
    borderRightColor: tokens.color.smokeBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.smokeBorder,
  },
  brand: {
    fontSize: 22,
    lineHeight: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.md,
    paddingBottom: tokens.space.md,
  },
  section: {
    marginBottom: tokens.space.sm,
    paddingHorizontal: tokens.space.xs,
  },
  sectionSpaced: {
    marginTop: tokens.space.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    paddingVertical: 14,
    paddingHorizontal: tokens.space.md,
    borderRadius: tokens.radius.md,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: tokens.color.accent,
  },
  itemLabel: {
    flex: 1,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingVertical: tokens.space.sm,
    paddingHorizontal: tokens.space.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.color.smokeBorder,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.rgba.accent20,
  },
  profileText: {
    flex: 1,
  },
});

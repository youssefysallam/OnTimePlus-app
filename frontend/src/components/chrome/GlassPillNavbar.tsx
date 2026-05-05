import React from 'react';
import { Menu } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { tokens } from '../../theme';
import { GlassSurface, Text } from '../primitives';

type GlassPillNavbarProps = {
  title?: string;
  generating?: boolean;
  onMenu: () => void;
};

export const GlassPillNavbar: React.FC<GlassPillNavbarProps> = ({ title = 'OnTime+', generating, onMenu }) => (
  <View style={styles.wrap}>
    <GlassSurface tint="navbar" style={[styles.pill, generating && styles.thinkingPill]}>
      {generating ? (
        <Text variant="caption">Thinking...</Text>
      ) : (
        <>
          <TouchableOpacity accessibilityLabel="Open drawer" style={styles.menu} onPress={onMenu}>
            <Menu size={22} color={tokens.color.text} />
          </TouchableOpacity>
          <Text variant="title">{title}</Text>
          <View style={styles.menu} />
        </>
      )}
    </GlassSurface>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.sm,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    minHeight: 54,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thinkingPill: {
    width: 160,
    justifyContent: 'center',
  },
  menu: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

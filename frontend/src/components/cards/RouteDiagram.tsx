import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { TripLeg } from '../../types';
import { lineColor, modeColor, tokens } from '../../theme';
import { Text } from '../primitives';

export const RouteDiagram: React.FC<{ legs: TripLeg[] }> = ({ legs }) => (
  <View style={styles.row}>
    {legs.map((leg) => {
      const color = leg.line ? lineColor(leg.line) : modeColor(leg.mode);
      return (
        <View key={leg.id} style={[styles.segment, { borderColor: color }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text variant="caption">{leg.line ?? leg.mode}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xs,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
    backgroundColor: tokens.rgba.white04,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: tokens.radius.pill,
  },
});

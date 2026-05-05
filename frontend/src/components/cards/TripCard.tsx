import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { ClassEvent, TripEstimate } from '../../types';
import { tokens } from '../../theme';
import { TripCardBody } from './TripCardBody';

type TripCardProps = {
  estimate: TripEstimate;
  classEvent?: ClassEvent;
  onPress?: () => void;
};

export const TripCard: React.FC<TripCardProps> = ({ estimate, classEvent, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <TripCardBody estimate={estimate} classEvent={classEvent} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.smoke,
    borderWidth: 1,
    borderColor: tokens.color.smokeBorder,
    gap: tokens.space.sm,
  },
});

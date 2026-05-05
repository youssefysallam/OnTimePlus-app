import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme';

export const ChatTypingIndicator: React.FC = () => (
  <View style={styles.wrap}>
    <View style={styles.dot} />
    <View style={styles.dot} />
    <View style={styles.dot} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: tokens.space.xs,
    margin: tokens.space.md,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.smoke,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.textDim,
  },
});

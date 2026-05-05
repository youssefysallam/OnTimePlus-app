import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme';

export const CarbonBackground: React.FC<ViewProps> = ({ children, style, ...props }) => (
  <View {...props} style={[styles.root, style]}>
    <LinearGradient colors={[tokens.color.carbonHigh, tokens.color.charcoal, tokens.color.carbonLow]} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.weaveA]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.weaveB]} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.charcoal,
  },
  weaveA: {
    opacity: 0.55,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.rgba.white04,
  },
  weaveB: {
    opacity: 0.35,
    backgroundColor: tokens.rgba.white04,
  },
});

import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '../../theme';

type GlassSurfaceProps = ViewProps & {
  tint?: keyof typeof tokens.glass;
};

export const GlassSurface: React.FC<GlassSurfaceProps> = ({ tint = 'modal', children, style, ...props }) => {
  const recipe = tokens.glass[tint];
  return (
    <View {...props} style={[styles.frame, { borderColor: recipe.border }, style]}>
      <BlurView intensity={recipe.blur} tint="dark" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: recipe.bg }]} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: tokens.rgba.white06,
  },
});

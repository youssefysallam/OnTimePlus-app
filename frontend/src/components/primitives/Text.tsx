import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { tokens } from '../../theme';

type TextProps = RNTextProps & {
  variant?: keyof typeof tokens.type;
  color?: string;
};

export const Text: React.FC<TextProps> = ({ variant = 'body', color = tokens.color.text, style, ...props }) => (
  <RNText {...props} style={[styles.base, tokens.type[variant], { color }, style]} />
);

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
});

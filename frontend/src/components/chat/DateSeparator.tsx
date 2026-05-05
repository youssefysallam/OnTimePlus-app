import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme';
import { Text } from '../primitives';

export const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.wrap}>
    <Text variant="label" color={tokens.color.textDim}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: tokens.space.md,
  },
});

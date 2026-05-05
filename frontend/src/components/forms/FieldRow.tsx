import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { tokens } from '../../theme';
import { Text } from '../primitives';

type FieldRowProps = TextInputProps & {
  label: string;
};

export const FieldRow: React.FC<FieldRowProps> = ({ label, style, ...props }) => (
  <View style={styles.wrap}>
    <Text variant="label" color={tokens.color.textDim}>
      {label}
    </Text>
    <TextInput
      {...props}
      placeholderTextColor={tokens.color.textDim}
      style={[styles.input, style]}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space.xs,
    marginBottom: tokens.space.md,
  },
  input: {
    minHeight: 46,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.md,
    color: tokens.color.text,
    backgroundColor: tokens.rgba.white08,
    borderWidth: 1,
    borderColor: tokens.rgba.white12,
  },
});

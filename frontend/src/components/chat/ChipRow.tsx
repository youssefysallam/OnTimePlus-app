import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '../../theme';
import { Text } from '../primitives';

type ChipRowProps = {
  chips: string[];
  onPress: (chip: string) => void;
};

export const ChipRow: React.FC<ChipRowProps> = ({ chips, onPress }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
    {chips.map((chip) => (
      <TouchableOpacity key={chip} style={styles.chip} onPress={() => onPress(chip)}>
        <Text variant="caption">{chip}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  content: {
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
  },
  chip: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.rgba.white08,
    borderWidth: 1,
    borderColor: tokens.rgba.white12,
  },
});

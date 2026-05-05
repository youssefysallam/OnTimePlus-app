import React, { useState } from 'react';
import { Plus, Send } from 'lucide-react-native';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { tokens } from '../../theme';

type ComposerProps = {
  disabled?: boolean;
  onPlus: () => void;
  onSend: (text: string) => void;
};

export const Composer: React.FC<ComposerProps> = ({ disabled, onPlus, onSend }) => {
  const [value, setValue] = useState('');
  const submit = () => {
    const text = value.trim();
    if (!text) return;
    setValue('');
    onSend(text);
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity accessibilityLabel="Add class" style={styles.iconButton} onPress={onPlus}>
        <Plus size={20} color={tokens.color.text} />
      </TouchableOpacity>
      <TextInput
        value={value}
        editable={!disabled}
        onChangeText={setValue}
        placeholder="Ask about your commute"
        placeholderTextColor={tokens.color.textDim}
        multiline
        style={styles.input}
      />
      <TouchableOpacity accessibilityLabel="Send" disabled={disabled} style={[styles.iconButton, styles.send]} onPress={submit}>
        <Send size={18} color={tokens.color.textInverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.rgba.white08,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.rgba.white08,
  },
  send: {
    backgroundColor: tokens.color.accent,
  },
  input: {
    flex: 1,
    minHeight: 56,
    maxHeight: 120,
    borderRadius: tokens.radius.xl,
    paddingHorizontal: tokens.space.lg,
    paddingTop: Platform.OS === 'ios' ? 15 : 0,
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
    color: tokens.color.text,
    backgroundColor: tokens.color.smoke,
    fontSize: tokens.type.body.fontSize,
    lineHeight: tokens.type.body.lineHeight,
    textAlignVertical: 'center',
  },
});

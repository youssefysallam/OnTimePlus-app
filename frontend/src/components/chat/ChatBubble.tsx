import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme';
import { Text } from '../primitives';

type ChatBubbleProps = {
  variant: 'bot' | 'user';
  text: string;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ variant, text }) => {
  const isUser = variant === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      <View style={[styles.tail, isUser ? styles.tailUser : styles.tailBot]} />
      <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
        <Text color={isUser ? tokens.color.textInverse : tokens.color.text}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    maxWidth: '86%',
    marginHorizontal: tokens.space.md,
    marginVertical: tokens.space.xs,
  },
  rowBot: {
    alignSelf: 'flex-start',
  },
  rowUser: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radius.lg,
  },
  bot: {
    backgroundColor: tokens.color.smoke,
    borderBottomLeftRadius: tokens.radius.sm,
  },
  user: {
    backgroundColor: tokens.color.accent,
    borderBottomRightRadius: tokens.radius.sm,
  },
  tail: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
  },
  tailBot: {
    left: -2,
    backgroundColor: tokens.color.smoke,
  },
  tailUser: {
    right: -2,
    backgroundColor: tokens.color.accent,
  },
});

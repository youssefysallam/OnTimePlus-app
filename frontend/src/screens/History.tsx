import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { CarbonBackground, Text } from '../components/primitives';
import { storage } from '../storage/asyncStore';
import { tokens } from '../theme';
import type { Conversation } from '../types';

export const History: React.FC<any> = ({ navigation }) => {
  const [items, setItems] = useState<Conversation[]>([]);
  useEffect(() => {
    void storage.getHistory().then(setItems);
  }, []);

  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="History" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={styles.content}>
          {items.length === 0 ? <Text color={tokens.color.textDim}>No conversations yet.</Text> : null}
          {items.map((conversation) => (
            <View key={conversation.id} style={styles.row}>
              <Text variant="title">{new Date(conversation.startedAt).toLocaleString()}</Text>
              <Text variant="caption" color={tokens.color.textDim}>
                {conversation.messages.length} messages
              </Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </CarbonBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: tokens.space.md,
  },
  row: {
    marginBottom: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.smoke,
    borderWidth: 1,
    borderColor: tokens.color.smokeBorder,
  },
});

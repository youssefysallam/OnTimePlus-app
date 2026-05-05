import React, { useEffect, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground } from '../components/primitives';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatTypingIndicator } from '../components/chat/ChatTypingIndicator';
import { ChipRow } from '../components/chat/ChipRow';
import { Composer } from '../components/chat/Composer';
import { DateSeparator } from '../components/chat/DateSeparator';
import { SpecialCard } from '../components/cards/SpecialCard';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { ScheduleFormSheet, ScheduleFormSheetHandle } from '../components/forms/ScheduleFormSheet';
import { useAlerts } from '../hooks/useAlerts';
import { useBriefing } from '../hooks/useBriefing';
import { useChat } from '../hooks/useChat';
import { useSchedule } from '../hooks/useSchedule';
import { tokens } from '../theme';
import type { Message } from '../types';

export const Chat: React.FC<any> = ({ navigation }) => {
  const { messages, generating, send } = useChat();
  const { upsert } = useSchedule();
  useAlerts();
  const { fire } = useBriefing();
  const formRef = useRef<ScheduleFormSheetHandle>(null);
  const didBrief = useRef(false);

  useEffect(() => {
    if (!didBrief.current && messages.length === 0) {
      didBrief.current = true;
      void fire();
    }
  }, [fire, messages.length]);

  const renderItem = ({ item }: { item: Message }) => (
    <View>
      <ChatBubble variant={item.role === 'user' ? 'user' : 'bot'} text={item.text} />
      {item.cards?.map((card, index) => (
        <SpecialCard key={`${item.id}-${index}`} data={card} onEditClass={(classEvent) => formRef.current?.present(classEvent)} />
      ))}
      {item.chips?.length ? <ChipRow chips={item.chips} onPress={send} /> : null}
    </View>
  );

  return (
    <CarbonBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboard}
        >
          <GlassPillNavbar generating={generating} onMenu={() => navigation.openDrawer()} />
          <FlatList
            data={messages}
            keyExtractor={(message) => message.id}
            renderItem={renderItem}
            ListHeaderComponent={<DateSeparator label="TODAY" />}
            ListFooterComponent={generating ? <ChatTypingIndicator /> : null}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
          <Composer disabled={generating} onSend={send} onPlus={() => formRef.current?.present()} />
        </KeyboardAvoidingView>
        <ScheduleFormSheet ref={formRef} onSave={upsert} />
      </SafeAreaView>
    </CarbonBackground>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  listContent: {
    paddingBottom: tokens.space.lg,
  },
});

import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { DimensionValue, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '../../theme';

export type BottomSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

type SheetProps = {
  children: React.ReactNode;
  snapPoints?: string[];
  onDismiss?: () => void;
};

export const BottomSheet = forwardRef<BottomSheetHandle, SheetProps>(({ children, snapPoints, onDismiss }, ref) => {
  const [visible, setVisible] = useState(false);
  const maxHeight = useMemo<DimensionValue>(() => (snapPoints?.[0] as DimensionValue | undefined) ?? '72%', [snapPoints]);

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss,
  }));

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" style={styles.scrim} onPress={dismiss} />
        <View style={[styles.sheet, { maxHeight }]}>
          <View style={styles.handle} />
          <View style={styles.content}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.rgba.scrim,
  },
  sheet: {
    backgroundColor: tokens.color.smoke,
    borderColor: tokens.color.smokeBorder,
    borderWidth: 1,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: tokens.radius.pill,
    marginTop: tokens.space.sm,
    backgroundColor: tokens.color.textDim,
  },
  content: {
    padding: tokens.space.lg,
  },
});

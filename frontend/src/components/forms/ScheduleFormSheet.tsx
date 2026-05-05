import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { ClassEvent, DayOfWeek } from '../../types';
import { newId } from '../../utils/uuid';
import { tokens } from '../../theme';
import { BottomSheet, BottomSheetHandle } from '../chrome/BottomSheet';
import { Text } from '../primitives';
import { FieldRow } from './FieldRow';

export type ScheduleFormSheetHandle = {
  present: (classEvent?: ClassEvent) => void;
  dismiss: () => void;
};

type ScheduleFormSheetProps = {
  onSave: (classEvent: ClassEvent) => void;
};

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const blank = (): ClassEvent => ({
  id: newId(),
  name: '',
  days: ['MON', 'WED'],
  startTime: '10:00',
  endTime: '11:15',
  location: 'Campus Center',
});

export const ScheduleFormSheet = forwardRef<ScheduleFormSheetHandle, ScheduleFormSheetProps>(({ onSave }, ref) => {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [draft, setDraft] = useState<ClassEvent>(blank());

  useImperativeHandle(ref, () => ({
    present: (classEvent) => {
      setDraft(classEvent ?? blank());
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const toggleDay = (day: DayOfWeek) => {
    setDraft((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day],
    }));
  };

  const save = () => {
    onSave({ ...draft, name: draft.name.trim() || 'Class' });
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheet ref={sheetRef}>
      <Text variant="title" style={styles.title}>
        Class details
      </Text>
      <FieldRow label="NAME" value={draft.name} placeholder="Algorithms" onChangeText={(name) => setDraft((current) => ({ ...current, name }))} />
      <Text variant="label" color={tokens.color.textDim}>
        DAYS
      </Text>
      <View style={styles.days}>
        {DAYS.map((day) => {
          const active = draft.days.includes(day);
          return (
            <TouchableOpacity key={day} style={[styles.day, active && styles.dayActive]} onPress={() => toggleDay(day)}>
              <Text variant="caption" color={active ? tokens.color.textInverse : tokens.color.textMuted}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.timeRow}>
        <FieldRow label="START" value={draft.startTime} onChangeText={(startTime) => setDraft((current) => ({ ...current, startTime }))} />
        <FieldRow label="END" value={draft.endTime} onChangeText={(endTime) => setDraft((current) => ({ ...current, endTime }))} />
      </View>
      <FieldRow label="LOCATION" value={draft.location} onChangeText={(location) => setDraft((current) => ({ ...current, location }))} />
      <TouchableOpacity style={styles.save} onPress={save}>
        <Text color={tokens.color.textInverse}>Save class</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  title: {
    marginBottom: tokens.space.lg,
  },
  days: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    marginVertical: tokens.space.sm,
  },
  day: {
    minWidth: 48,
    alignItems: 'center',
    borderRadius: tokens.radius.pill,
    padding: tokens.space.sm,
    backgroundColor: tokens.rgba.white08,
  },
  dayActive: {
    backgroundColor: tokens.color.accent,
  },
  timeRow: {
    flexDirection: 'row',
    gap: tokens.space.md,
  },
  save: {
    alignItems: 'center',
    borderRadius: tokens.radius.pill,
    padding: tokens.space.md,
    backgroundColor: tokens.color.accent,
  },
});

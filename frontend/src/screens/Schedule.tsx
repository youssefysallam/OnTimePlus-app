import React, { useRef } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { ScheduleFormSheet, ScheduleFormSheetHandle } from '../components/forms/ScheduleFormSheet';
import { CarbonBackground, Text } from '../components/primitives';
import { useSchedule } from '../hooks/useSchedule';
import { tokens } from '../theme';
import { formatClock } from '../utils/time';

export const Schedule: React.FC<any> = ({ navigation }) => {
  const { classes, upsert, remove } = useSchedule();
  const formRef = useRef<ScheduleFormSheetHandle>(null);

  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="Schedule" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={styles.content}>
          {classes.map((classEvent) => (
            <TouchableOpacity key={classEvent.id} style={styles.row} onPress={() => formRef.current?.present(classEvent)}>
              <Text variant="title">{classEvent.name}</Text>
              <Text variant="caption" color={tokens.color.textDim}>
                {classEvent.days.join(' ')} | {formatClock(classEvent.startTime)}-{formatClock(classEvent.endTime)} | {classEvent.location}
              </Text>
              <TouchableOpacity style={styles.remove} onPress={() => remove(classEvent.id)}>
                <Text variant="caption" color={tokens.color.severityErr}>
                  Remove
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.add} onPress={() => formRef.current?.present()}>
            <Text color={tokens.color.textInverse}>Add class</Text>
          </TouchableOpacity>
        </ScrollView>
        <ScheduleFormSheet ref={formRef} onSave={upsert} />
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
    gap: tokens.space.xs,
  },
  remove: {
    alignSelf: 'flex-end',
    paddingVertical: tokens.space.xs,
  },
  add: {
    marginTop: tokens.space.md,
    alignItems: 'center',
    borderRadius: tokens.radius.pill,
    padding: tokens.space.md,
    backgroundColor: tokens.color.accent,
  },
});

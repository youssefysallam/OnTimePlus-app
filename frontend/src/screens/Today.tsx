import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { TripCard } from '../components/cards/TripCard';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { CarbonBackground, Text } from '../components/primitives';
import { useAlerts } from '../hooks/useAlerts';
import { useSchedule } from '../hooks/useSchedule';
import { tokens } from '../theme';
import type { TripEstimate } from '../types';
import { todayDayOfWeek } from '../utils/time';

export const Today: React.FC<any> = ({ navigation }) => {
  const { classes } = useSchedule();
  const { alerts } = useAlerts();
  const [estimate, setEstimate] = useState<TripEstimate | null>(null);
  const todaysClasses = classes.filter((classEvent) => classEvent.days.includes(todayDayOfWeek()));

  useEffect(() => {
    void api.getBriefingEstimate(classes, alerts).then(setEstimate);
  }, [alerts, classes]);

  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="Today" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={{ padding: tokens.space.md }}>
          <Text variant="display">Today</Text>
          {todaysClasses.length === 0 ? (
            <Text color={tokens.color.textDim} style={{ marginTop: tokens.space.md }}>
              No classes today.
            </Text>
          ) : null}
          {estimate
            ? todaysClasses.map((classEvent) => (
                <View key={classEvent.id} style={{ marginTop: tokens.space.md }}>
                  <TripCard estimate={estimate} classEvent={classEvent} onPress={() => navigation.navigate('Chat')} />
                </View>
              ))
            : null}
        </ScrollView>
      </SafeAreaView>
    </CarbonBackground>
  );
};

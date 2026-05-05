import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpecialCard } from '../components/cards/SpecialCard';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { CarbonBackground, Text } from '../components/primitives';
import { useAlerts } from '../hooks/useAlerts';
import { tokens } from '../theme';

export const Alerts: React.FC<any> = ({ navigation }) => {
  const { alerts } = useAlerts();
  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="Alerts" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={{ padding: tokens.space.md }}>
          {alerts.length === 0 ? <Text color={tokens.color.textDim}>No active alerts.</Text> : null}
          {alerts.map((alert) => (
            <SpecialCard key={alert.id} data={{ type: 'ALERT', alert }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </CarbonBackground>
  );
};

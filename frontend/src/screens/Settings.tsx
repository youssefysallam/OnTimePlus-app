import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { CarbonBackground, Text } from '../components/primitives';
import { tokens } from '../theme';

const rows = ['Notifications: inline prompts', 'Home address: local only', 'Theme: Nightshift', 'Privacy: device storage'];

export const Settings: React.FC<any> = ({ navigation }) => (
  <CarbonBackground>
    <SafeAreaView style={{ flex: 1 }}>
      <GlassPillNavbar title="Settings" onMenu={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="label" color={tokens.color.textDim}>
          PREFERENCES
        </Text>
        {rows.map((row) => (
          <View key={row} style={styles.row}>
            <Text>{row}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  </CarbonBackground>
);

const styles = StyleSheet.create({
  content: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
  row: {
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.smoke,
    borderWidth: 1,
    borderColor: tokens.color.smokeBorder,
  },
});

import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from './src/navigation/RootStack';
import { tokens } from './src/theme';

const navTheme: Theme = {
  dark: true,
  colors: {
    primary: tokens.color.accent,
    background: tokens.color.charcoal,
    card: tokens.color.smoke,
    text: tokens.color.text,
    border: tokens.color.smokeBorder,
    notification: tokens.color.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tokens.color.charcoal }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <RootStack />
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

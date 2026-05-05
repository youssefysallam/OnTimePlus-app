import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { storage } from '../storage/asyncStore';
import { tokens } from '../theme';
import { Welcome } from '../screens/Welcome';
import { DrawerNavigator } from './DrawerNavigator';

const Stack = createNativeStackNavigator();

export const RootStack: React.FC = () => {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    void storage.getOnboarded().then(setOnboarded);
  }, []);

  if (onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.charcoal }}>
        <ActivityIndicator color={tokens.color.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded ? (
        <Stack.Screen name="Welcome">
          {({ navigation }) => <Welcome onStart={() => navigation.replace('Main')} />}
        </Stack.Screen>
      ) : null}
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
};

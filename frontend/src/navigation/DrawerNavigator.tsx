import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Drawer } from '../components/chrome/Drawer';
import { Alerts } from '../screens/Alerts';
import { Chat } from '../screens/Chat';
import { History } from '../screens/History';
import { Schedule } from '../screens/Schedule';
import { Settings } from '../screens/Settings';
import { Today } from '../screens/Today';
import { tokens } from '../theme';

const screens = { Chat, Today, Schedule, Alerts, History, Settings };

export type DrawerRouteName = keyof typeof screens;

export const DrawerNavigator: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<DrawerRouteName>('Chat');
  const [visible, setVisible] = useState(false);
  const { width } = useWindowDimensions();
  const navWidth = Math.min(Math.round(width * 0.78), 310);

  const slideAnim = useRef(new Animated.Value(-navWidth)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;

  const openNav = () => {
    slideAnim.setValue(-navWidth);
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 0,
        speed: 16,
        useNativeDriver: true,
      }),
      Animated.timing(scrimOpacity, {
        toValue: 1,
        duration: tokens.motion.base,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeNav = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -navWidth,
        duration: tokens.motion.fast,
        useNativeDriver: true,
      }),
      Animated.timing(scrimOpacity, {
        toValue: 0,
        duration: tokens.motion.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      callback?.();
    });
  };

  const navigate = (route: DrawerRouteName) => {
    closeNav(() => setActiveRoute(route));
  };

  const navigation = { navigate, openDrawer: openNav };
  const ActiveScreen = screens[activeRoute];

  return (
    <View style={styles.root}>
      <ActiveScreen navigation={navigation} />
      {visible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeNav()}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            />
          </Animated.View>
          <Animated.View style={[styles.panel, { width: navWidth, transform: [{ translateX: slideAnim }] }]}>
            <Drawer activeRoute={activeRoute} onNavigate={navigate} onClose={() => closeNav()} />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.charcoal,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.rgba.scrim,
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});

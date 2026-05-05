import React from 'react';
import { ArrowRight } from 'lucide-react-native';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CarbonBackground, Text } from '../components/primitives';
import { storage } from '../storage/asyncStore';
import { tokens } from '../theme';

type WelcomeProps = {
  onStart: () => void;
};

export const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  const start = async () => {
    await storage.setOnboarded(true);
    onStart();
  };

  return (
    <CarbonBackground>
      <ImageBackground style={styles.hero} imageStyle={styles.image}>
        <View style={styles.content}>
          <Text variant="display">OnTime+</Text>
          <Text color={tokens.color.textMuted} style={styles.copy}>
            Schedule-aware MBTA guidance for getting to campus with confidence.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={start}>
            <Text color={tokens.color.textInverse}>Get started</Text>
            <ArrowRight size={18} color={tokens.color.textInverse} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </CarbonBackground>
  );
};

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  image: {
    opacity: 0.28,
  },
  content: {
    padding: tokens.space.xl,
    paddingBottom: tokens.space.xxl,
  },
  copy: {
    marginTop: tokens.space.sm,
    maxWidth: 320,
  },
  cta: {
    marginTop: tokens.space.xl,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    backgroundColor: tokens.color.accent,
  },
});

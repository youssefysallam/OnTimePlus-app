import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ClassEvent, Severity, SpecialCardData } from '../../types';
import { lineColor, modeColor, severityTint, tokens } from '../../theme';
import { Text } from '../primitives';
import { AlertCardBody } from './AlertCardBody';
import { BriefingCardBody } from './BriefingCardBody';
import { ScheduleConfirmCardBody } from './ScheduleConfirmCardBody';
import { TripCardBody } from './TripCardBody';

type SpecialCardProps = {
  data: SpecialCardData;
  onEditClass?: (classEvent: ClassEvent) => void;
};

const cardMeta = (data: SpecialCardData): { color: string; severity: Severity; label: string } => {
  if (data.type === 'ALERT') {
    return {
      color: data.alert.line ? lineColor(data.alert.line) : modeColor(data.alert.mode),
      severity: data.alert.severity,
      label: data.alert.line ?? data.alert.mode ?? 'TRANSIT',
    };
  }
  if (data.type === 'TRIP' || data.type === 'BRIEFING') {
    const riskSeverity: Severity = data.estimate.risk === 'LOW' ? 'ON_TIME' : data.estimate.risk === 'MEDIUM' ? 'MODERATE' : 'SEVERE';
    return { color: lineColor(data.estimate.legs[0]?.line), severity: riskSeverity, label: 'TRIP' };
  }
  return { color: tokens.color.accent, severity: 'ON_TIME', label: 'SCHEDULE' };
};

export const SpecialCard: React.FC<SpecialCardProps> = ({ data, onEditClass }) => {
  const meta = cardMeta(data);
  const severity = severityTint(meta.severity);
  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: meta.color }]} />
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: meta.color }]}>
          <Text variant="label">{meta.label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: severity.bg, borderColor: severity.border }]}>
          <Text variant="label" color={severity.fg}>
            {meta.severity.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {data.type === 'ALERT' ? <AlertCardBody alert={data.alert} /> : null}
      {data.type === 'TRIP' ? <TripCardBody estimate={data.estimate} classEvent={data.classEvent} /> : null}
      {data.type === 'BRIEFING' ? <BriefingCardBody summary={data.summary} estimate={data.estimate} classEvent={data.classEvent} /> : null}
      {data.type === 'SCHEDULE_CONFIRM' ? <ScheduleConfirmCardBody classEvent={data.classEvent} onEdit={onEditClass} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginHorizontal: tokens.space.md,
    marginVertical: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.smoke,
    borderWidth: 1,
    borderColor: tokens.color.smokeBorder,
    gap: tokens.space.sm,
  },
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    marginTop: tokens.space.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
  },
});

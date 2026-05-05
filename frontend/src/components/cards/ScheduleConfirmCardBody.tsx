import React from 'react';
import { TouchableOpacity } from 'react-native';
import type { ClassEvent } from '../../types';
import { formatClock } from '../../utils/time';
import { tokens } from '../../theme';
import { Text } from '../primitives';

export const ScheduleConfirmCardBody: React.FC<{ classEvent: ClassEvent; onEdit?: (classEvent: ClassEvent) => void }> = ({
  classEvent,
  onEdit,
}) => (
  <>
    <Text variant="title">{classEvent.name}</Text>
    <Text color={tokens.color.textMuted} style={{ marginTop: tokens.space.xs }}>
      {classEvent.days.join(' ')} from {formatClock(classEvent.startTime)} to {formatClock(classEvent.endTime)}
    </Text>
    <Text variant="caption" color={tokens.color.textDim} style={{ marginTop: tokens.space.xs }}>
      {classEvent.location}
    </Text>
    <TouchableOpacity style={{ marginTop: tokens.space.sm }} onPress={() => onEdit?.(classEvent)}>
      <Text variant="caption" color={tokens.color.accent}>
        Edit details
      </Text>
    </TouchableOpacity>
  </>
);

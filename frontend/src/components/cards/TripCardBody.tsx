import React from 'react';
import type { ClassEvent, TripEstimate } from '../../types';
import { formatClock } from '../../utils/time';
import { tokens } from '../../theme';
import { Text } from '../primitives';
import { RouteDiagram } from './RouteDiagram';

export const TripCardBody: React.FC<{ estimate: TripEstimate; classEvent?: ClassEvent }> = ({ estimate, classEvent }) => (
  <>
    <Text variant="title">Leave by {formatClock(estimate.leaveBy)}</Text>
    <Text color={tokens.color.textMuted} style={{ marginTop: tokens.space.xs }}>
      Arrive by {formatClock(estimate.arriveBy)} with {estimate.bufferMin} min buffer
    </Text>
    {classEvent ? (
      <Text variant="caption" color={tokens.color.textDim} style={{ marginTop: tokens.space.xs }}>
        {classEvent.name} at {classEvent.location}
      </Text>
    ) : null}
    <RouteDiagram legs={estimate.legs} />
  </>
);

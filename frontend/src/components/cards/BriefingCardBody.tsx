import React from 'react';
import type { ClassEvent, TripEstimate } from '../../types';
import { tokens } from '../../theme';
import { Text } from '../primitives';
import { TripCardBody } from './TripCardBody';

export const BriefingCardBody: React.FC<{ summary: string; estimate: TripEstimate; classEvent?: ClassEvent }> = ({
  summary,
  estimate,
  classEvent,
}) => (
  <>
    <Text color={tokens.color.textMuted} style={{ marginBottom: tokens.space.sm }}>
      {summary}
    </Text>
    <TripCardBody estimate={estimate} classEvent={classEvent} />
  </>
);

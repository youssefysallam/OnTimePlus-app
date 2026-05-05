import React from 'react';
import type { Alert } from '../../types';
import { tokens } from '../../theme';
import { Text } from '../primitives';

export const AlertCardBody: React.FC<{ alert: Alert }> = ({ alert }) => (
  <>
    <Text variant="title">{alert.title}</Text>
    <Text color={tokens.color.textMuted} style={{ marginTop: tokens.space.xs }}>
      {alert.description}
    </Text>
    {alert.affectedSegment ? (
      <Text variant="caption" color={tokens.color.textDim} style={{ marginTop: tokens.space.sm }}>
        {alert.affectedSegment}
      </Text>
    ) : null}
  </>
);

import type { Severity, TransitLine, TransitMode } from '../types';
import { tokens } from './tokens';

export const lineColor = (line?: TransitLine): string => {
  if (!line) return tokens.color.smokeHigh;
  const colors: Record<TransitLine, string> = {
    RED: tokens.color.lineRed,
    ORANGE: tokens.color.lineOrange,
    BLUE: tokens.color.lineBlue,
    GREEN_B: tokens.color.lineGreen,
    GREEN_C: tokens.color.lineGreen,
    GREEN_D: tokens.color.lineGreen,
    GREEN_E: tokens.color.lineGreen,
    SILVER: tokens.color.lineSilver,
    COMMUTER_RAIL: tokens.color.lineCR,
    FERRY: tokens.color.lineFerry,
  };
  return colors[line];
};

export const modeColor = (mode?: TransitMode): string => {
  if (mode === 'BUS') return tokens.color.modeBus;
  if (mode === 'SHUTTLE') return tokens.color.modeShuttle;
  if (mode === 'FERRY') return tokens.color.lineFerry;
  if (mode === 'COMMUTER_RAIL') return tokens.color.lineCR;
  return tokens.color.smokeHigh;
};

export const severityTint = (severity: Severity) => {
  const map: Record<Severity, { bg: string; fg: string; border: string }> = {
    ON_TIME: {
      bg: 'rgba(48,209,88,0.12)',
      fg: tokens.color.severityOk,
      border: 'rgba(48,209,88,0.30)',
    },
    MODERATE: {
      bg: 'rgba(255,179,0,0.12)',
      fg: tokens.color.severityWarn,
      border: 'rgba(255,179,0,0.30)',
    },
    SEVERE: {
      bg: 'rgba(255,59,48,0.12)',
      fg: tokens.color.severityErr,
      border: 'rgba(255,59,48,0.30)',
    },
    SUSPENDED: {
      bg: tokens.color.transparent,
      fg: tokens.color.severityErr,
      border: tokens.color.severityErr,
    },
  };
  return map[severity];
};

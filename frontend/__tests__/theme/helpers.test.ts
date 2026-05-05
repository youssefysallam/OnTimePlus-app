import { lineColor, severityTint } from '../../src/theme/helpers';

describe('theme helpers', () => {
  it('maps Red Line color', () => {
    expect(lineColor('RED')).toBe('#DA291C');
  });

  it('maps suspended severity', () => {
    expect(severityTint('SUSPENDED').border).toBe('#FF3B30');
  });
});

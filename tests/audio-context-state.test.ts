import { describe, expect, it } from 'vitest';
import { isPausedAudioContextState } from '../src/audio/audio-context-state';

describe('isPausedAudioContextState', () => {
  it('treats suspended and interrupted as paused', () => {
    expect(isPausedAudioContextState('suspended')).toBe(true);
    expect(isPausedAudioContextState('interrupted')).toBe(true);
  });

  it('treats running and closed as not paused', () => {
    expect(isPausedAudioContextState('running')).toBe(false);
    expect(isPausedAudioContextState('closed')).toBe(false);
  });
});

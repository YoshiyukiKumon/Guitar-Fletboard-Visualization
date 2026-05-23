/** Safari 拡張を含む AudioContext の一時停止状態 */
export function isPausedAudioContextState(state: string): boolean {
  return state === 'suspended' || state === 'interrupted';
}

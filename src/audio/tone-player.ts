import { midiNoteForFret } from '../domain/data/fretboard-matrix';
import {
  orderedSemitonesForChordArpeggio,
  orderedSemitonesForChordPlayback,
} from '../domain/chord-playback';
import { midiNoteNumber, orderedSemitonesFromTones } from '../domain/tone-sequence';
import type { ChordDef } from '../domain/data/chords';
import type { KeyDef } from '../domain/data/keys';
import type { ScaleDef } from '../domain/data/scales';

const SCALE_NOTE_DURATION_SEC = 0.38;
const SCALE_NOTE_GAP_SEC = 0.04;
const CHORD_DURATION_SEC = 1.4;
const FRET_TAP_DURATION_SEC = 0.55;
const PEAK_GAIN = 0.22;

export class TonePlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sessionId = 0;
  private volume = 0.8;

  setVolume(percent: number): void {
    this.volume = Math.min(100, Math.max(0, percent)) / 100;
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return Math.round(this.volume * 100);
  }

  async playScale(scaleKey: KeyDef, scale: ScaleDef): Promise<void> {
    const semitones = orderedSemitonesFromTones(scale.tones);
    if (semitones.length === 0) {
      return;
    }

    const ctx = await this.prepareContext();
    const session = ++this.sessionId;
    const startAt = ctx.currentTime + 0.05;
    let time = startAt;

    for (const semitone of semitones) {
      if (session !== this.sessionId) {
        return;
      }
      const midi = midiNoteNumber(scaleKey.pitchClass, semitone);
      this.scheduleNote(ctx, midi, time, SCALE_NOTE_DURATION_SEC);
      time += SCALE_NOTE_DURATION_SEC + SCALE_NOTE_GAP_SEC;
    }
  }

  /** 指板上の1音（タップ／クリック用。進行中のスケール再生は止めない） */
  async playFret(stringIndex: number, fret: number): Promise<void> {
    const ctx = await this.prepareContext();
    const midi = midiNoteForFret(stringIndex, fret);
    this.scheduleNote(ctx, midi, ctx.currentTime + 0.01, FRET_TAP_DURATION_SEC);
  }

  async playChord(chordKey: KeyDef, chord: ChordDef): Promise<void> {
    const semitones = orderedSemitonesForChordPlayback(
      chord.tones,
      chord.name,
    );
    await this.playChordSemitones(chordKey, semitones, 'block');
  }

  /** コードトーンをルートから順にアルペジオ再生 */
  async playChordArpeggio(chordKey: KeyDef, chord: ChordDef): Promise<void> {
    const semitones = orderedSemitonesForChordArpeggio(
      chord.tones,
      chord.name,
    );
    await this.playChordSemitones(chordKey, semitones, 'arpeggio');
  }

  private async playChordSemitones(
    chordKey: KeyDef,
    semitones: number[],
    style: 'block' | 'arpeggio',
  ): Promise<void> {
    if (semitones.length === 0) {
      return;
    }

    const ctx = await this.prepareContext();
    const session = ++this.sessionId;
    const startAt = ctx.currentTime + 0.05;

    if (style === 'block') {
      if (session !== this.sessionId) {
        return;
      }
      for (const semitone of semitones) {
        const midi = midiNoteNumber(chordKey.pitchClass, semitone);
        this.scheduleNote(ctx, midi, startAt, CHORD_DURATION_SEC);
      }
      return;
    }

    let time = startAt;
    for (const semitone of semitones) {
      if (session !== this.sessionId) {
        return;
      }
      const midi = midiNoteNumber(chordKey.pitchClass, semitone);
      this.scheduleNote(ctx, midi, time, SCALE_NOTE_DURATION_SEC);
      time += SCALE_NOTE_DURATION_SEC + SCALE_NOTE_GAP_SEC;
    }
  }

  stop(): void {
    this.sessionId++;
  }

  private async prepareContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context;
  }

  private scheduleNote(
    ctx: AudioContext,
    midi: number,
    start: number,
    duration: number,
  ): void {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;

    const attack = 0.02;
    const release = 0.08;
    gain.gain.setValueAtTime(0, start);
    const peak = PEAK_GAIN;
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.setValueAtTime(peak, start + duration - release);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    const destination = this.masterGain ?? ctx.destination;
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }
}

export const tonePlayer = new TonePlayer();

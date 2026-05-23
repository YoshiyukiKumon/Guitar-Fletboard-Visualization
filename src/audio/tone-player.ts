import { midiNoteForFret } from '../domain/data/fretboard-matrix';
import {
  orderedSemitonesForChordArpeggio,
  orderedSemitonesForChordPlayback,
} from '../domain/chord-playback';
import {
  midiNoteNumberForScaleChordPlayback,
  orderedSemitonesFromTones,
} from '../domain/tone-sequence';
import type { ChordDef } from '../domain/data/chords';
import type { KeyDef } from '../domain/data/keys';
import type { ScaleDef } from '../domain/data/scales';
import {
  DEFAULT_INSTRUMENT_ID,
  getInstrumentDefinition,
  instrumentUsesSamples,
  normalizeInstrumentId,
  sampleBaseUrlForInstrument,
  sampleMaxDurationSec,
  samplePitchRate,
  instrumentUsesGuitarStrum,
  type InstrumentDefinition,
  type InstrumentId,
} from '../domain/settings/instrument-catalog';
import {
  createDistortionNode,
  getSynthPreset,
  type SynthPreset,
} from './synth-presets';
import {
  nearestSampleForMidi,
  playbackRateForMidi,
  type SampleManifest,
} from './guitar-samples';

const SCALE_NOTE_DURATION_SEC = 0.42;
const SCALE_NOTE_GAP_SEC = 0.06;
const CHORD_DURATION_SEC = 1.5;
/** ギター系コード同時再生の音間隔（秒） */
const GUITAR_STRUM_NOTE_GAP_SEC = 0.032;
const FRET_TAP_DURATION_SEC = 1.5;
const SAMPLE_PEAK_GAIN = 0.92;
const PREVIEW_MIDI = 60;

interface InstrumentSampleState {
  manifest: SampleManifest | null;
  manifestPromise: Promise<SampleManifest | null> | null;
  bufferByFile: Map<string, AudioBuffer>;
  prefetchStarted: boolean;
}

export class TonePlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sessionId = 0;
  private volume = 0.8;
  private instrumentId: InstrumentId = DEFAULT_INSTRUMENT_ID;
  private sampleStateByInstrument = new Map<InstrumentId, InstrumentSampleState>();

  setVolume(percent: number): void {
    this.volume = Math.min(100, Math.max(0, percent)) / 100;
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return Math.round(this.volume * 100);
  }

  setInstrument(instrumentId: InstrumentId): void {
    const normalized = normalizeInstrumentId(instrumentId);
    if (normalized === this.instrumentId) {
      return;
    }
    this.instrumentId = normalized;
    this.sessionId += 1;
    const state = this.getSampleState(normalized);
    state.prefetchStarted = false;
  }

  getInstrument(): InstrumentId {
    return this.instrumentId;
  }

  /** iOS Safari 向け: ユーザー操作の同期スタック内で AudioContext を解放する */
  unlockFromUserGesture(): void {
    const ctx = this.ensureContextSync();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    this.playSilentBuffer(ctx);
    void this.prefetchCurrentInstrument();
  }

  async previewInstrument(instrumentId: InstrumentId): Promise<void> {
    this.unlockFromUserGesture();
    const previous = this.instrumentId;
    const normalized = normalizeInstrumentId(instrumentId);
    this.instrumentId = normalized;
    const ctx = await this.prepareContext();
    this.scheduleNote(
      ctx,
      PREVIEW_MIDI,
      ctx.currentTime + 0.01,
      FRET_TAP_DURATION_SEC,
    );
    this.instrumentId = previous;
  }

  async playScale(scaleKey: KeyDef, scale: ScaleDef): Promise<void> {
    this.unlockFromUserGesture();
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
      const midi = midiNoteNumberForScaleChordPlayback(
        scaleKey.pitchClass,
        semitone,
      );
      this.scheduleNote(ctx, midi, time, SCALE_NOTE_DURATION_SEC);
      time += SCALE_NOTE_DURATION_SEC + SCALE_NOTE_GAP_SEC;
    }
  }

  async playFret(stringIndex: number, fret: number): Promise<void> {
    this.unlockFromUserGesture();
    const ctx = await this.prepareContext();
    const midi = midiNoteForFret(stringIndex, fret);
    this.scheduleNote(
      ctx,
      midi,
      ctx.currentTime + 0.01,
      FRET_TAP_DURATION_SEC,
    );
  }

  async playChord(chordKey: KeyDef, chord: ChordDef): Promise<void> {
    this.unlockFromUserGesture();
    const semitones = orderedSemitonesForChordPlayback(
      chord.tones,
      chord.name,
    );
    await this.playChordSemitones(chordKey, semitones, 'block');
  }

  async playChordSemitonesFromRoot(
    chordKey: KeyDef,
    semitonesFromRoot: readonly number[],
  ): Promise<void> {
    this.unlockFromUserGesture();
    await this.playChordSemitones(chordKey, [...semitonesFromRoot], 'block');
  }

  async playChordArpeggio(chordKey: KeyDef, chord: ChordDef): Promise<void> {
    this.unlockFromUserGesture();
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
    const definition = this.getInstrumentDefinition();
    const useGuitarStrum =
      style === 'block' && instrumentUsesGuitarStrum(definition);
    const playbackSemitones = useGuitarStrum
      ? [...semitones].sort((a, b) => a - b)
      : semitones;

    if (style === 'block') {
      if (session !== this.sessionId) {
        return;
      }
      for (let i = 0; i < playbackSemitones.length; i++) {
        const semitone = playbackSemitones[i];
        const noteStart = useGuitarStrum
          ? startAt + i * GUITAR_STRUM_NOTE_GAP_SEC
          : startAt;
        const midi = midiNoteNumberForScaleChordPlayback(
          chordKey.pitchClass,
          semitone,
        );
        this.scheduleNote(ctx, midi, noteStart, CHORD_DURATION_SEC);
      }
      return;
    }

    let time = startAt;
    for (const semitone of playbackSemitones) {
      if (session !== this.sessionId) {
        return;
      }
      const midi = midiNoteNumberForScaleChordPlayback(
        chordKey.pitchClass,
        semitone,
      );
      this.scheduleNote(ctx, midi, time, SCALE_NOTE_DURATION_SEC);
      time += SCALE_NOTE_DURATION_SEC + SCALE_NOTE_GAP_SEC;
    }
  }

  stop(): void {
    this.sessionId += 1;
  }

  private getInstrumentDefinition(): InstrumentDefinition {
    return getInstrumentDefinition(this.instrumentId);
  }

  private getSampleState(instrumentId: InstrumentId): InstrumentSampleState {
    let state = this.sampleStateByInstrument.get(instrumentId);
    if (state === undefined) {
      state = {
        manifest: null,
        manifestPromise: null,
        bufferByFile: new Map(),
        prefetchStarted: false,
      };
      this.sampleStateByInstrument.set(instrumentId, state);
    }
    return state;
  }

  private ensureContextSync(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.context.destination);
    }
    return this.context;
  }

  private playSilentBuffer(ctx: AudioContext): void {
    try {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const destination = this.masterGain ?? ctx.destination;
      source.connect(destination);
      source.start(0);
      source.stop(0);
    } catch {
      // ignore unlock failures
    }
  }

  private async prepareContext(): Promise<AudioContext> {
    const ctx = this.ensureContextSync();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  private async prefetchCurrentInstrument(): Promise<void> {
    const definition = this.getInstrumentDefinition();
    if (definition.kind !== 'sample') {
      return;
    }

    const state = this.getSampleState(definition.id);
    if (state.prefetchStarted) {
      return;
    }
    state.prefetchStarted = true;

    const manifest = await this.loadManifest(definition);
    if (manifest === null || !this.context) {
      return;
    }

    const ctx = this.context;
    const files = [...new Set(manifest.entries.map((entry) => entry.file))];
    await Promise.all(
      files.map((file) => this.loadBuffer(ctx, definition, file)),
    );
  }

  private async prefetchSampleForMidi(
    definition: InstrumentDefinition,
    midi: number,
  ): Promise<void> {
    if (definition.kind !== 'sample' || !this.context) {
      return;
    }
    const manifest = await this.loadManifest(definition);
    if (manifest === null) {
      return;
    }
    const mapping = nearestSampleForMidi(midi, manifest.entries);
    if (mapping === undefined) {
      return;
    }
    await this.loadBuffer(this.context, definition, mapping.file);
  }

  private async loadManifest(
    definition: InstrumentDefinition,
  ): Promise<SampleManifest | null> {
    const sampleBase = sampleBaseUrlForInstrument(definition);
    if (sampleBase === undefined) {
      return null;
    }

    const state = this.getSampleState(definition.id);
    if (state.manifest !== null) {
      return state.manifest;
    }
    if (state.manifestPromise !== null) {
      return state.manifestPromise;
    }

    state.manifestPromise = (async () => {
      try {
        const response = await fetch(`${sampleBase}manifest.json`);
        if (!response.ok) {
          return null;
        }
        const data = (await response.json()) as SampleManifest;
        state.manifest = data;
        return data;
      } catch {
        return null;
      }
    })();

    return state.manifestPromise;
  }

  private async loadBuffer(
    ctx: AudioContext,
    definition: InstrumentDefinition,
    file: string,
  ): Promise<AudioBuffer | null> {
    const sampleBase = sampleBaseUrlForInstrument(definition);
    if (sampleBase === undefined) {
      return null;
    }

    const state = this.getSampleState(definition.id);
    const cached = state.bufferByFile.get(file);
    if (cached !== undefined) {
      return cached;
    }
    try {
      const response = await fetch(`${sampleBase}${file}`);
      if (!response.ok) {
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      state.bufferByFile.set(file, buffer);
      return buffer;
    } catch {
      return null;
    }
  }

  private scheduleNote(
    ctx: AudioContext,
    midi: number,
    start: number,
    duration: number,
  ): void {
    const definition = this.getInstrumentDefinition();

    if (definition.kind === 'synth') {
      this.scheduleSynthNote(
        ctx,
        midi,
        start,
        duration,
        getSynthPreset(definition.synthPresetId),
      );
      return;
    }

    if (
      instrumentUsesSamples(definition)
      && this.tryScheduleCachedSampleNote(ctx, definition, midi, start, duration)
    ) {
      return;
    }

    const preset = getSynthPreset(definition.synthPresetId);
    this.scheduleSynthNote(ctx, midi, start, duration, preset);
  }

  private tryScheduleCachedSampleNote(
    ctx: AudioContext,
    definition: InstrumentDefinition,
    midi: number,
    start: number,
    _duration: number,
  ): boolean {
    const state = this.getSampleState(definition.id);
    const manifest = state.manifest;
    if (manifest === null) {
      void this.prefetchSampleForMidi(definition, midi);
      return false;
    }

    const mapping = nearestSampleForMidi(midi, manifest.entries);
    if (mapping === undefined) {
      return false;
    }

    const buffer = state.bufferByFile.get(mapping.file);
    if (buffer === undefined) {
      void this.prefetchSampleForMidi(definition, midi);
      return false;
    }

    this.scheduleSampleFromBuffer(
      ctx,
      definition,
      buffer,
      midi,
      mapping.rootMidi,
      start,
    );
    return true;
  }

  private scheduleSampleFromBuffer(
    ctx: AudioContext,
    definition: InstrumentDefinition,
    buffer: AudioBuffer,
    midi: number,
    rootMidi: number,
    start: number,
  ): void {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    const rate = playbackRateForMidi(midi, rootMidi) * samplePitchRate(definition);
    source.playbackRate.value = rate;

    const naturalDuration = buffer.duration / rate;
    const maxDuration = sampleMaxDurationSec(definition);
    const playDuration = Math.min(maxDuration, naturalDuration);
    const attack = 0.003;
    const tailFade = Math.min(
      maxDuration * 0.35,
      Math.max(0.08, playDuration * 0.25),
    );

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(SAMPLE_PEAK_GAIN, start + attack);
    gain.gain.setValueAtTime(
      SAMPLE_PEAK_GAIN,
      start + playDuration - tailFade,
    );
    gain.gain.linearRampToValueAtTime(0, start + playDuration);

    const destination = this.masterGain ?? ctx.destination;
    source.connect(gain);
    gain.connect(destination);
    source.start(start);
    source.stop(start + playDuration + 0.02);
  }

  private scheduleSynthNote(
    ctx: AudioContext,
    midi: number,
    start: number,
    duration: number,
    preset: SynthPreset,
  ): void {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = preset.oscillatorType;
    oscillator.frequency.value = frequency;

    let outputNode: AudioNode = gain;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(preset.peakGain, start + preset.attackSec);
    gain.gain.setValueAtTime(
      preset.peakGain,
      start + duration - preset.releaseSec,
    );
    gain.gain.linearRampToValueAtTime(0, start + duration);

    oscillator.connect(gain);

    if (preset.filterCutoffHz !== undefined) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = preset.filterCutoffHz;
      filter.Q.value = preset.filterQ ?? 1;
      gain.connect(filter);
      outputNode = filter;
    }

    if (preset.distortionAmount !== undefined && preset.distortionAmount > 0) {
      const shaper = createDistortionNode(ctx, preset.distortionAmount);
      outputNode.connect(shaper);
      outputNode = shaper;
    }

    const destination = this.masterGain ?? ctx.destination;
    outputNode.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }
}

export const tonePlayer = new TonePlayer();

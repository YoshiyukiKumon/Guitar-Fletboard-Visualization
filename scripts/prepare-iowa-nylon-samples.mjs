/**
 * Iowa MIS Guitar.mono.1644.1.zip から mf 単音を抽出し acoustic-nylon 用 WAV を生成する。
 *
 * Usage:
 *   node scripts/prepare-iowa-nylon-samples.mjs temp-iowa-check/Guitar.mono.1644.1.zip
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'samples', 'acoustic-nylon');
const TRIM_SEC = 1.5;

const NOTE_TOKEN = /([A-G])(Bb|Db|Gb|Ab|Eb|#|b)?(\d+)/g;

const NOTE_TO_PC = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function accidentalOffset(acc) {
  if (acc === undefined || acc === '') {
    return 0;
  }
  if (acc === '#') {
    return 1;
  }
  if (acc === 'b' || acc === 'Bb' || acc === 'Db' || acc === 'Gb' || acc === 'Ab' || acc === 'Eb') {
    return -1;
  }
  return 0;
}

function noteNameToMidi(letter, acc, octave) {
  const pcBase = NOTE_TO_PC[letter];
  if (pcBase === undefined) {
    return undefined;
  }
  const pc = (pcBase + accidentalOffset(acc) + 12) % 12;
  return pc + (octave + 1) * 12;
}

function parseNotesFromFilename(name) {
  const base = path.basename(name, '.aif');
  const match = base.match(/Guitar\.mf\.[^.]+\.(.+)$/i);
  if (match === null) {
    return [];
  }
  const notes = [];
  for (const token of match[1].matchAll(NOTE_TOKEN)) {
    const midi = noteNameToMidi(token[1], token[2], Number(token[3]));
    if (midi !== undefined) {
      notes.push(midi);
    }
  }
  return notes;
}

function slugify(name) {
  return name
    .replace(/^1644mono\//, '')
    .replace(/\.aif$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
}

function runFfmpeg(args) {
  const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${args.join(' ')}`);
  }
}

function main() {
  const zipPath = process.argv[2];
  if (zipPath === undefined) {
    console.error(
      'Usage: node scripts/prepare-iowa-nylon-samples.mjs <Guitar.mono.1644.1.zip>',
    );
    process.exit(1);
  }
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found');
  }

  const tmpDir = path.join(rootDir, 'temp-iowa-extract');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const unzip = spawnSync(
    'unzip',
    ['-j', zipPath, '1644mono/Guitar.mf.*.aif', '-d', tmpDir],
    { stdio: 'inherit' },
  );
  if (unzip.status !== 0) {
    throw new Error('unzip failed');
  }

  const aiffFiles = fs
    .readdirSync(tmpDir)
    .filter((f) => f.endsWith('.aif'))
    .sort();

  const entries = [];

  for (const aiff of aiffFiles) {
    const notes = parseNotesFromFilename(aiff);
    if (notes.length === 0) {
      console.warn(`skip (no notes): ${aiff}`);
      continue;
    }
    const rootMidi = notes[0];
    const wavName = `${slugify(aiff)}.wav`;
    const wavPath = path.join(outDir, wavName);
    const aiffPath = path.join(tmpDir, aiff);

    runFfmpeg([
      '-y',
      '-i',
      aiffPath,
      '-t',
      String(TRIM_SEC),
      '-af',
      'loudnorm=I=-14:TP=-0.5:LRA=11',
      '-ac',
      '1',
      '-ar',
      '44100',
      '-sample_fmt',
      's16',
      wavPath,
    ]);

    entries.push({
      midi: rootMidi,
      rootMidi,
      file: wavName,
      source: aiff,
    });
    console.log(`wrote ${wavName} root=${rootMidi} notes=${notes.join(',')}`);
  }

  const manifest = {
    source: 'University of Iowa MIS Guitar (mono 16/44.1, classical/nylon)',
    sourceUrl: 'https://theremin.music.uiowa.edu/MISguitar.html',
    license: 'Use without restrictions (University of Iowa Electronic Music Studios)',
    entries: entries.sort((a, b) => a.midi - b.midi),
  };

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Done: ${entries.length} note mappings in ${outDir}`);
}

main();

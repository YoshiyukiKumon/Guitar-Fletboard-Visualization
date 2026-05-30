#!/usr/bin/env node
/**
 * 各楽器サンプル pack の最大ピークを計測し、ナイロン基準の平準化倍率を出力する。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesRoot = path.join(__dirname, '../public/samples');

const REFERENCE_DIR = 'acoustic-nylon';

function readWavPeak(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.toString('ascii', 0, 4) !== 'RIFF') {
    return null;
  }

  let offset = 12;
  let bitsPerSample = 16;
  let numChannels = 1;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === 'fmt ') {
      numChannels = buf.readUInt16LE(chunkStart + 2);
      bitsPerSample = buf.readUInt16LE(chunkStart + 14);
    } else if (chunkId === 'data') {
      dataOffset = chunkStart;
      dataSize = chunkSize;
      break;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (dataOffset < 0 || bitsPerSample !== 16) {
    return null;
  }

  const sampleCount = Math.floor(dataSize / (bitsPerSample / 8) / numChannels);
  let peak = 0;

  for (let i = 0; i < sampleCount; i += 1) {
    for (let ch = 0; ch < numChannels; ch += 1) {
      const idx = dataOffset + (i * numChannels + ch) * 2;
      const sample = buf.readInt16LE(idx) / 32768;
      const abs = Math.abs(sample);
      if (abs > peak) {
        peak = abs;
      }
    }
  }

  return peak;
}

function measurePack(dirName) {
  const dir = path.join(samplesRoot, dirName);
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const files = [...new Set(manifest.entries.map((e) => e.file))];

  let maxPeak = 0;
  let maxFile = '';

  for (const file of files) {
    const peak = readWavPeak(path.join(dir, file));
    if (peak === null) {
      continue;
    }
    if (peak > maxPeak) {
      maxPeak = peak;
      maxFile = file;
    }
  }

  return { dirName, maxPeak, maxFile, fileCount: files.length };
}

const dirs = fs
  .readdirSync(samplesRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const results = dirs.map(measurePack);
const reference = results.find((r) => r.dirName === REFERENCE_DIR);

if (!reference || reference.maxPeak <= 0) {
  console.error('Reference pack not found or empty');
  process.exit(1);
}

console.log(`Reference: ${REFERENCE_DIR} maxPeak=${reference.maxPeak.toFixed(6)} (${reference.maxFile})\n`);

for (const r of results.sort((a, b) => a.dirName.localeCompare(b.dirName))) {
  const norm = reference.maxPeak / r.maxPeak;
  console.log(
    `${r.dirName.padEnd(22)} peak=${r.maxPeak.toFixed(6)}  norm=${norm.toFixed(4)}  files=${r.fileCount}`,
  );
}

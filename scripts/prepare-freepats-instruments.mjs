#!/usr/bin/env node
/**
 * FreePats 楽器サンプルを一括ダウンロードし public/samples/ に生成する。
 * 要: p7zip (`brew install p7zip`), ffmpeg-static (npm)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const downloadDir = path.join(rootDir, 'temp-freepats-download');

const PACKS = [
  {
    file: 'electric-clean-small.7z',
    url: 'http://freepats.zenvoid.org/ElectricGuitar/FSBS-EGuitar/EGuitarFSBS-bridge-clean-small-SFZ-20220911.7z',
    sampleDir: 'electric-clean',
    meta: {
      source: 'FreePats FSBS Electric Guitar Clean #1 (small)',
      sourceUrl:
        'http://freepats.zenvoid.org/ElectricGuitar/clean-electric-guitar.html',
      license: 'CC0 1.0',
    },
  },
  {
    file: 'electric-overdrive-dist2.7z',
    url: 'https://freepats.zenvoid.org/ElectricGuitar/FSBS-EGuitar/EGuitarFSBS-bridge-dist2-SFZ+FLAC-20220911.7z',
    sampleDir: 'electric-overdrive',
    meta: {
      source: 'FreePats FSBS Electric Guitar Distorted #2',
      sourceUrl:
        'https://freepats.zenvoid.org/ElectricGuitar/distorted-electric-guitar.html',
      license: 'CC0 1.0',
    },
  },
  {
    file: 'electric-distortion-dist1.7z',
    url: 'https://freepats.zenvoid.org/ElectricGuitar/FSBS-EGuitar/EGuitarFSBS-bridge-dist1-SFZ+FLAC-20220911.7z',
    sampleDir: 'electric-distortion',
    meta: {
      source: 'FreePats FSBS Electric Guitar Distorted #1',
      sourceUrl:
        'https://freepats.zenvoid.org/ElectricGuitar/distorted-electric-guitar.html',
      license: 'CC0 1.0',
    },
  },
  {
    file: 'piano-small.7z',
    url: 'https://freepats.zenvoid.org/Piano/UprightPianoKW/UprightPianoKW-small-SFZ-20190703.7z',
    sampleDir: 'piano',
    meta: {
      source: 'FreePats Upright Piano KW (small)',
      sourceUrl:
        'https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html',
      license: 'CC0 1.0',
    },
  },
];

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: 'inherit',
    cwd: rootDir,
  });
  if (result.status !== 0) {
    throw new Error(`Failed: node ${script} ${args.join(' ')}`);
  }
}

async function download(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`skip download (exists): ${path.basename(dest)}`);
    return;
  }
  console.log(`download: ${url}`);
  const result = spawnSync('curl', ['-L', '-o', dest, url], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`curl failed: ${url}`);
  }
}

async function main() {
  fs.mkdirSync(downloadDir, { recursive: true });
  const prepareScript = path.join(__dirname, 'prepare-sfz-pack.mjs');

  for (const pack of PACKS) {
    const archivePath = path.join(downloadDir, pack.file);
    await download(pack.url, archivePath);
    runNode(prepareScript, [
      archivePath,
      pack.sampleDir,
      JSON.stringify(pack.meta),
    ]);
  }

  console.log('All FreePats sample packs prepared.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * FreePats FSS Steel-String Acoustic Guitar (small SFZ) から単音 WAV と manifest を生成する。
 *
 * Usage:
 *   curl -L -o /tmp/steel-small.tar.xz \
 *     "https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-small-SFZ-20200521.tar.xz"
 *   node scripts/prepare-steel-guitar-samples.mjs /tmp/steel-small.tar.xz
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'samples', 'steel-guitar');

const SOURCE = {
  name: 'FreePats FSS Steel-String Acoustic Guitar (small)',
  sourceUrl:
    'https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html',
  license:
    'GPL-3.0+ with FreePats sound sample exception (FlameStudios / FreePats)',
};

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${cmd} failed: ${args.join(' ')}`);
  }
}

function runFfmpeg(args) {
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found');
  }
  run(ffmpegPath, args);
}

function extractArchive(archivePath, destDir) {
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  if (archivePath.endsWith('.tar.xz')) {
    run('tar', ['-xf', archivePath, '-C', destDir]);
    return;
  }
  throw new Error('Unsupported archive (expected .tar.xz)');
}

function findSfzRoot(extractDir) {
  const entries = fs.readdirSync(extractDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const dir = path.join(extractDir, entry.name);
    const sfz = fs
      .readdirSync(dir)
      .find((name) => name.endsWith('.sfz'));
    if (sfz !== undefined) {
      return dir;
    }
  }
  throw new Error('SFZ bundle not found in archive');
}

function parseSfzRegions(sfzPath) {
  const text = fs.readFileSync(sfzPath, 'utf8');
  const regions = [];
  let current = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '<region>') {
      if (current !== null) {
        regions.push(current);
      }
      current = {};
      continue;
    }
    if (current === null || trimmed.startsWith('//') || trimmed === '') {
      continue;
    }
    for (const token of trimmed.split(/\s+/)) {
      const eq = token.indexOf('=');
      if (eq === -1) {
        continue;
      }
      const key = token.slice(0, eq);
      const value = token.slice(eq + 1);
      current[key] = value;
    }
  }
  if (current !== null) {
    regions.push(current);
  }

  return regions
    .filter((r) => r.sample !== undefined && r.pitch_keycenter !== undefined)
    .map((r) => ({
      loMidi: Number(r.lokey ?? r.pitch_keycenter),
      hiMidi: Number(r.hikey ?? r.pitch_keycenter),
      rootMidi: Number(r.pitch_keycenter),
      sample: r.sample.replace(/^samples\//, ''),
    }));
}

function slugifySampleName(name) {
  return name.replace(/\.wav$/i, '').toLowerCase().replace(/#/g, 's') + '.wav';
}

function buildManifestEntries(regions, fileBySource) {
  const entries = [];
  for (const region of regions) {
    const file = fileBySource.get(region.sample);
    if (file === undefined) {
      continue;
    }
    for (let midi = region.loMidi; midi <= region.hiMidi; midi += 1) {
      entries.push({
        midi,
        rootMidi: region.rootMidi,
        file,
        source: region.sample,
      });
    }
  }
  return entries.sort((a, b) => a.midi - b.midi);
}

function main() {
  const archivePath = process.argv[2];
  if (archivePath === undefined) {
    console.error(
      'Usage: node scripts/prepare-steel-guitar-samples.mjs <FSS-SteelStringGuitar-small-SFZ-*.tar.xz>',
    );
    process.exit(1);
  }

  const extractDir = path.join(rootDir, 'temp-steel-extract');
  extractArchive(archivePath, extractDir);
  const bundleDir = findSfzRoot(extractDir);
  const sfzPath = fs
    .readdirSync(bundleDir)
    .filter((name) => name.endsWith('.sfz'))
    .map((name) => path.join(bundleDir, name))[0];
  const regions = parseSfzRegions(sfzPath);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const fileBySource = new Map();
  for (const region of regions) {
    if (fileBySource.has(region.sample)) {
      continue;
    }
    const srcPath = path.join(bundleDir, 'samples', region.sample);
    const outName = slugifySampleName(region.sample);
    const outPath = path.join(outDir, outName);
    runFfmpeg([
      '-y',
      '-i',
      srcPath,
      '-af',
      'loudnorm=I=-14:TP=-0.5:LRA=11',
      '-ac',
      '1',
      '-ar',
      '44100',
      '-sample_fmt',
      's16',
      outPath,
    ]);
    fileBySource.set(region.sample, outName);
    console.log(`wrote ${outName} root=${region.rootMidi}`);
  }

  const entries = buildManifestEntries(regions, fileBySource);
  const manifest = {
    source: SOURCE.name,
    sourceUrl: SOURCE.sourceUrl,
    license: SOURCE.license,
    entries,
  };

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const readmeSrc = path.join(bundleDir, 'readme.txt');
  if (fs.existsSync(readmeSrc)) {
    fs.copyFileSync(readmeSrc, path.join(outDir, 'readme.txt'));
  }
  const gplSrc = path.join(bundleDir, 'gpl.txt');
  if (fs.existsSync(gplSrc)) {
    fs.copyFileSync(gplSrc, path.join(outDir, 'gpl.txt'));
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
  console.log(`Done: ${entries.length} note mappings in ${outDir}`);
}

main();

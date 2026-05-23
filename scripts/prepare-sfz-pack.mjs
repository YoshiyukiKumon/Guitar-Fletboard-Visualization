/**
 * FreePats 等の SFZ アーカイブ（.7z / .tar.xz）から mono WAV + manifest.json を生成する。
 *
 * Usage:
 *   node scripts/prepare-sfz-pack.mjs <archive> <sampleDir> '<json-meta>'
 *
 * Example:
 *   node scripts/prepare-sfz-pack.mjs temp/clean.7z electric-clean \
 *     '{"source":"...","sourceUrl":"...","license":"CC0"}'
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const SEVEN_Z = process.env.SEVEN_Z ?? '/opt/homebrew/bin/7z';

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
  if (archivePath.endsWith('.7z')) {
    if (!fs.existsSync(SEVEN_Z)) {
      throw new Error(`7z not found at ${SEVEN_Z}. Install p7zip or set SEVEN_Z.`);
    }
    run(SEVEN_Z, ['x', '-y', `-o${destDir}`, archivePath]);
    return;
  }
  if (archivePath.endsWith('.tar.xz') || archivePath.endsWith('.tar.gz')) {
    run('tar', ['-xf', archivePath, '-C', destDir]);
    return;
  }
  throw new Error(`Unsupported archive: ${archivePath}`);
}

function findSfzBundle(extractDir) {
  const sfzPaths = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.sfz')) {
        sfzPaths.push(full);
      }
    }
  }
  walk(extractDir);
  if (sfzPaths.length === 0) {
    throw new Error('SFZ file not found in archive');
  }
  sfzPaths.sort();
  const sfzPath = sfzPaths[0];
  return { bundleDir: path.dirname(sfzPath), sfzPath };
}

function applySfzTokens(target, line) {
  for (const token of line.split(/\s+/)) {
    const eq = token.indexOf('=');
    if (eq === -1) {
      continue;
    }
    target[token.slice(0, eq)] = token.slice(eq + 1);
  }
}

/** SFZ の group / region 構造を正しく解釈する */
function parseSfzZones(sfzPath) {
  const text = fs.readFileSync(sfzPath, 'utf8');
  const zones = [];
  let group = {};
  let region = null;

  function flushRegion() {
    if (region === null || region.sample === undefined) {
      region = null;
      return;
    }
    const merged = { ...group, ...region };
    const rootMidi = Number(merged.pitch_keycenter);
    if (Number.isNaN(rootMidi)) {
      region = null;
      return;
    }
    zones.push({
      loMidi: Number(merged.lokey ?? rootMidi),
      hiMidi: Number(merged.hikey ?? rootMidi),
      rootMidi,
      sample: merged.sample.replace(/\\/g, '/'),
    });
    region = null;
  }

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '<group>') {
      flushRegion();
      group = {};
      continue;
    }
    if (trimmed === '<region>') {
      flushRegion();
      region = {};
      continue;
    }
    if (trimmed.startsWith('//') || trimmed === '') {
      continue;
    }
    if (region !== null) {
      applySfzTokens(region, trimmed);
    } else {
      applySfzTokens(group, trimmed);
    }
  }
  flushRegion();
  return zones;
}

function sampleChoiceScore(samplePath) {
  const base = path.basename(samplePath).toLowerCase();
  let score = 0;
  if (!base.includes('soft')) {
    score += 10;
  }
  if (/_04\.(flac|wav|aif)$/i.test(base)) {
    score += 5;
  }
  return score;
}

function pickRepresentativeZones(zones) {
  const byRange = new Map();
  for (const zone of zones) {
    const key = `${zone.loMidi}-${zone.hiMidi}-${zone.rootMidi}`;
    const existing = byRange.get(key);
    if (existing === undefined || sampleChoiceScore(zone.sample) > sampleChoiceScore(existing.sample)) {
      byRange.set(key, zone);
    }
  }
  return [...byRange.values()].sort((a, b) => a.rootMidi - b.rootMidi);
}

function parseSfzRegions(sfzPath) {
  return pickRepresentativeZones(parseSfzZones(sfzPath));
}

function resolveSamplePath(bundleDir, sampleRef) {
  const direct = path.join(bundleDir, sampleRef);
  if (fs.existsSync(direct)) {
    return direct;
  }
  const base = path.basename(sampleRef);
  const alt = path.join(bundleDir, 'samples', base);
  if (fs.existsSync(alt)) {
    return alt;
  }
  throw new Error(`Sample not found: ${sampleRef}`);
}

function slugifySampleName(name) {
  const base = path.basename(name).replace(/\.(wav|flac|aif|aiff)$/i, '');
  return `${base.toLowerCase().replace(/#/g, 's')}.wav`;
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
        source: path.basename(region.sample),
      });
    }
  }
  return entries.sort((a, b) => a.midi - b.midi);
}

function main() {
  const archivePath = process.argv[2];
  const sampleDir = process.argv[3];
  const metaJson = process.argv[4];
  if (archivePath === undefined || sampleDir === undefined || metaJson === undefined) {
    console.error(
      'Usage: node scripts/prepare-sfz-pack.mjs <archive> <sampleDir> \'<json-meta>\'',
    );
    process.exit(1);
  }

  const meta = JSON.parse(metaJson);
  const outDir = path.join(rootDir, 'public', 'samples', sampleDir);
  const extractDir = path.join(rootDir, 'temp-sfz-extract', sampleDir);

  extractArchive(path.resolve(archivePath), extractDir);
  const { bundleDir, sfzPath } = findSfzBundle(extractDir);
  const regions = parseSfzRegions(sfzPath);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const fileBySource = new Map();
  for (const region of regions) {
    if (fileBySource.has(region.sample)) {
      continue;
    }
    const srcPath = resolveSamplePath(bundleDir, region.sample);
    const outName = slugifySampleName(region.sample);
    const outPath = path.join(outDir, outName);
    runFfmpeg([
      '-y',
      '-i',
      srcPath,
      '-t',
      '2.5',
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

  const manifest = {
    source: meta.source,
    sourceUrl: meta.sourceUrl,
    license: meta.license,
    entries: buildManifestEntries(regions, fileBySource),
  };

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  fs.rmSync(extractDir, { recursive: true, force: true });
  console.log(`Done: ${manifest.entries.length} mappings -> ${outDir}`);
}

main();

/**
 * カプセルの表示矩形とクリック応答を調査
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'standalone', 'guitar-practice.html');
const url = pathToFileURL(htmlPath).href;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(url, { waitUntil: 'load' });
await page.locator('.fretboard').waitFor();

await page.evaluate(() => {
  window.__clickLog = [];
  document.querySelectorAll('button.interval-capsule--playable').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        window.__clickLog.push(btn.textContent);
      },
      { capture: true },
    );
  });
});

const capsule = page.locator('.interval-capsule--root').first();
const box = await capsule.boundingBox();
if (!box) {
  throw new Error('no capsule box');
}

const points = [
  { name: 'left-25%', rx: 0.25 },
  { name: 'center', rx: 0.5 },
  { name: 'right-75%', rx: 0.75 },
  { name: 'right-95%', rx: 0.95 },
];

const results = [];
for (const p of points) {
  const x = box.x + box.width * p.rx;
  const y = box.y + box.height / 2;
  await page.evaluate(() => {
    window.__clickLog = [];
  });
  await page.mouse.click(x, y);
  const topEl = await page.evaluate(({ px, py }) => {
    const el = document.elementFromPoint(px, py);
    if (!el) {
      return 'none';
    }
    return `${el.tagName}.${[...el.classList].slice(0, 4).join('.')}`;
  }, { px: x, py: y });
  const hits = await page.evaluate(() => window.__clickLog.length);
  results.push({ ...p, x, y, topEl, hits });
}

const overlap = await page.evaluate(() => {
  const btn = document.querySelector('button.interval-capsule--root');
  if (!btn) {
    return null;
  }
  const r = btn.getBoundingClientRect();
  const midY = r.top + r.height / 2;
  const rightX = r.left + r.width * 0.85;
  const leftX = r.left + r.width * 0.15;
  const elR = document.elementFromPoint(rightX, midY);
  const elL = document.elementFromPoint(leftX, midY);
  return {
    capsule: { w: r.width, h: r.height, l: r.left, r: r.right },
    leftPoint: leftX,
    rightPoint: rightX,
    elLeft: elL?.className ?? null,
    elRight: elR?.className ?? null,
    same: elL === elR,
  };
});

console.log('Capsule box:', box);
console.log('Overlap probe:', overlap);
console.log('Click probe:');
for (const r of results) {
  console.log(
    `  ${r.name}: buttonClicks=${r.hits} elementFromPoint=${r.topEl}`,
  );
}

await browser.close();

const fs = require('fs');
const path = require('path');

const srcPreloadTs = path.join(__dirname, '..', 'electron', 'preload.ts');
const outDir = path.join(__dirname, '..', 'dist', 'main');
const outPreload = path.join(outDir, 'preload.cjs');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// naive transpile: strip TS types and export as CJS with same content (no types used)
const raw = fs.readFileSync(srcPreloadTs, 'utf8');
const noTypes = raw.replace(/: [A-Za-z_][A-Za-z0-9_<>\[\]| ]*/g, '');
const cjs = noTypes
  .replace("from 'electron'", "from 'electron'")
  .replace('export {}', '');

fs.writeFileSync(outPreload, cjs);
console.log('Copied preload to dist/main/preload.cjs');


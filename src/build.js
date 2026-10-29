// Writes every sprite of the pack as <out>/<name>.png, checks the list against the manifest's required sprites, and
//  copies the manifest: `node src/build.js <out dir> <manifest.json>`.
const fs = require('fs'),
  path = require('path');
const { png, unit } = require('./lib');
const { terrainSprites, specials, imp, fog } = require('./terrain');
const units = require('./units');
const combat = require('./combat');
const misc = require('./misc');

const [out, manifestPath] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sprites = {};
for (const [k, s] of Object.entries(terrainSprites)) sprites[`terrain/${k}`] = s;
for (const [k, s] of Object.entries(specials)) sprites[`terrain/${k}`] = s;
for (const [k, s] of Object.entries(imp)) sprites[`improvements/${k}`] = s;
for (const [k, s] of Object.entries(fog)) sprites[`map/${k}`] = s;
for (const [k, f] of Object.entries(units)) sprites[`units/${k}`] = unit(f);
for (const [k, f] of Object.entries(combat)) sprites[`units/${k}`] = f();
for (const [k, f] of Object.entries(misc)) sprites[k] = f();

const wanted = [...manifest.assets.required, ...manifest.assets.optional];
const missing = wanted.filter((n) => !sprites[n]),
  extra = Object.keys(sprites).filter((n) => !wanted.includes(n));
for (const n of wanted) if (sprites[n]) png(sprites[n], 1, path.join(out, `${n}.png`));
fs.copyFileSync(manifestPath, path.join(out, 'tileset.json'));
console.log(`${wanted.length - missing.length}/${wanted.length} sprites written`);
if (missing.length) console.log('missing:', missing.join(' '));
if (extra.length) console.log('not in the manifest:', extra.join(' '));
process.exit(missing.filter((n) => manifest.assets.required.includes(n)).length ? 1 : 0);

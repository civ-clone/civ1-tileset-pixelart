// The 16 join variants of the named terrains on the land base, at 4×: `node src/sheet-masks.js <out.png> mountains hills`.
const { S, Spr, png } = require('../src/lib');
const { terrainSprites: T, MASKS } = require('../src/terrain');
const names = process.argv.slice(3),
  out = new Spr(16 * (S + 2), names.length * (S + 2));
names.forEach((n, r) =>
  MASKS.forEach((m, i) =>
    out.over(T.land, i * (S + 2), r * (S + 2)).over(T[m.length ? `${n}_${m.join('')}` : n], i * (S + 2), r * (S + 2))
  )
);
png(out, 4, process.argv[2]);

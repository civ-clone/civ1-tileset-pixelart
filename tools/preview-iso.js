// EXPLORATION: a staggered isometric map drawn the way civ.one's `IsoProjection` draws one (rows 16px apart, odd rows
//  32px across, top to bottom), twice: with `src/iso.js`'s native diamonds, and with the square pack's sprites warped
//  into diamonds, to compare. `node tools/preview-iso.js <out.png> [scale]`.
const { Spr, png, recolour } = require('../src/lib');
const { W, H, ROW, DIRS, named, owns, sprites: T } = require('../src/iso');
const { terrainSprites } = require('../src/terrain');
const hexMap = require('../src/hex-map');
const misc = require('../src/misc');

const MAP = [
  '..............',
  '......ggpp....',
  '.....ggppdd...',
  '....gggphhdd..',
  '....ggfphmmd..',
  '...gffpphmmdd.',
  '...gfffgghmd..',
  '...ssffggghdd.',
  '..sssjjgggpp..',
  '...ssjjjggpp..',
  '...tsjjjggg...',
  '....ttjjgg....',
  '....tttgg.....',
  '.....tt.......',
  '..............',
];
const K = {
  '.': 'ocean',
  g: 'grassland',
  p: 'plains',
  d: 'desert',
  h: 'hills',
  m: 'mountains',
  f: 'forest',
  j: 'jungle',
  s: 'swamp',
  t: 'tundra',
};
const rows = MAP.length,
  cols = MAP[0].length;
const at = (c, r) => (MAP[r] && MAP[r][c] !== undefined ? K[MAP[r][c]] : 'ocean');
// Staggered-iso edge neighbours, by the row's parity (odd rows sit half a tile right).
const STEPS = [
  { ne: [0, -1], se: [0, 1], sw: [-1, 1], nw: [-1, -1] },
  { ne: [1, -1], se: [1, 1], sw: [0, 1], nw: [0, -1] },
];
const neighbour = (c, r, d) => {
  const [dc, dr] = STEPS[r & 1][d];
  return at(c + dc, r + dr);
};

// The square pack's 32 × 32 sprite turned 45° and squashed to a 64 × 32 diamond, nearest pixel: square n e s w become
//  the diamond's ne se sw nw.
const warp = (sq) => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const u = x + 0.5 - 32,
        v = 2 * (y + 0.5),
        sx = Math.floor((v + u) / 2),
        sy = Math.floor((v - u) / 2);
      t.set(x, y, sq.get(Math.min(31, Math.max(0, sx)), Math.min(31, Math.max(0, sy))));
    }
  return t;
};
const SQ = { ne: 'n', se: 'e', sw: 's', nw: 'w' };
const warped = (name, mask) => warp(terrainSprites[mask.length ? `${name}_${mask.map((d) => SQ[d]).join('')}` : name]);

const draw = (native) => {
  const out = new Spr(cols * W + W / 2, ((rows + 1) * H) / 2 + 16);
  const put = (s, c, r, dx = 0, dy = 0) => out.over(s, c * W + (r & 1) * (W / 2) + dx, r * ROW + 16 + dy);
  const land = native ? T['terrain/land'] : warp(terrainSprites.land);
  const ocean = native ? T['terrain/ocean'] : warp(terrainSprites.ocean);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const t = at(c, r);
      if (t === 'ocean') {
        put(ocean, c, r);
        if (native) for (const d of DIRS) if (neighbour(c, r, d) !== 'ocean') put(T[`terrain/coast/${d}`], c, r);
        continue;
      }
      put(land, c, r);
      const mask = DIRS.filter((d) => neighbour(c, r, d) === t);
      put(native ? T[mask.length ? `terrain/${t}/${named(mask)}` : `terrain/${t}/isolated`] : warped(t, mask), c, r);
    }
  // The square pack's 32px units and city, unchanged, standing on the diamonds (feet near the middle, reaching 16px up).
  const red = (s) => recolour(s, '#e04040', '#801818'),
    blue = (s) => recolour(s, '#4060e0', '#182080');
  put(misc['map/city'](), 6, 6, 16, -12);
  put(red(hexMap['units/settlers']), 7, 8, 16, -12);
  put(red(hexMap['units/warrior']), 8, 5, 16, -12);
  put(blue(hexMap['units/knight']), 9, 9, 16, -12);
  put(blue(hexMap['units/trireme']), 2, 6, 16, -12);
  return out;
};

const [file, scale = 2] = process.argv.slice(2);
const a = draw(true),
  b = draw(false),
  both = new Spr(a.w * 2 + 16, a.h);
both.over(a, 0, 0);
both.over(b, a.w + 16, 0);
png(both, Number(scale), file);
// The isolated and fully joined sprites of each terrain, side by side, for a closer look.
const names = ['grassland', 'plains', 'desert', 'forest', 'jungle', 'hills', 'mountains', 'swamp', 'tundra'],
  sheet = new Spr(names.length * (W + 4), 2 * (H + 4));
names.forEach((n, i) => {
  sheet.over(T[`terrain/${n}/isolated`], i * (W + 4), 0);
  sheet.over(T[`terrain/${n}/${named(DIRS)}`], i * (W + 4), H + 4);
});
png(sheet, Number(scale) * 2, file.replace(/\.png$/, '-tiles.png'));

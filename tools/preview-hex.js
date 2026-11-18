// A hexagonal map drawn the way civ.one draws one (land or ocean base, the coast's six wedges, river mouths, terrain
//  joined over its six edges, improvements), to check the joins: `node tools/preview-hex.js <out.png> [scale]`.
const { Spr, png, recolour } = require('../src/lib');
const { W, ROW, DIRS, named } = require('../src/hex');
const T = require('../src/hex-map');

// Odd rows sit half a hex to the right.
const MAP = [
  '.......................',
  '....ggppddd......aaaa..',
  '...ggpphmmmd..ttaaaaa..',
  '..gggphmmmmhd..tttaa...',
  '..gfffphhmmmhd..tt.....',
  '..gffffgpgghmpddp......',
  '...fffjjggggmmpddo.....',
  '...ssfjjjggg.hhpdd.gg..',
  '....ssjjjjggggpp..gfmg.',
  '.....ssjjjgg.gg...ggg..',
  '......s................',
  '.......................',
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
  a: 'arctic',
  r: 'river',
  o: 'desert',
};
const rows = MAP.length,
  cols = MAP[0].length,
  out = new Spr(cols * W + W / 2, rows * ROW + 9);
// A river running south east and on to the sea, one hex to the next.
const RIVER = new Set(['9,4', '9,5', '9,6', '9,7', '10,8', '10,9']);
const at = (c, r) => (RIVER.has(`${c},${r}`) ? 'river' : MAP[r] && MAP[r][c] !== undefined ? K[MAP[r][c]] : 'ocean');
// The odd-r neighbour steps, by the row's parity.
const STEPS = [
  { ne: [0, -1], e: [1, 0], se: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1] },
  { ne: [1, -1], e: [1, 0], se: [1, 1], sw: [0, 1], w: [-1, 0], nw: [0, -1] },
];
const neighbour = (c, r, d) => {
  const [dc, dr] = STEPS[r & 1][d];
  return at(c + dc, r + dr);
};
const put = (name, c, r) => {
  const s = T[name];
  if (!s) throw new Error(`no sprite ${name}`);
  out.over(s, c * W + (r & 1) * (W / 2), r * ROW);
};

for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++) {
    const t = at(c, r);
    if (t === 'ocean') {
      put('terrain/ocean', c, r);
      const isLand = (d) => neighbour(c, r, d) !== 'ocean';
      if (DIRS.some(isLand))
        for (const d of DIRS) {
          const i = DIRS.indexOf(d),
            bits = [DIRS[(i + 5) % 6], d, DIRS[(i + 1) % 6]].map((e) => (isLand(e) ? '1' : '0')).join('');
          put(`terrain/coast_${d}_${bits}`, c, r);
        }
      for (const d of DIRS) if (neighbour(c, r, d) === 'river') put(`terrain/river_mouth_${d}`, c, r);
      continue;
    }
    put('terrain/land', c, r);
    const matches = t === 'river' ? (n) => n === 'river' || n === 'ocean' : (n) => n === t;
    const mask = DIRS.filter((d) => matches(neighbour(c, r, d)));
    put(mask.length ? `terrain/${t}_${named(mask)}` : `terrain/${t}`, c, r);
  }

// Improvements, a road with a railroad on part of it, specials, a city, units, a hut, a fort, and fog on the
//  unexplored east.
const ROAD = ['4,5', '5,5', '6,5', '7,5', '8,5', '9,5', '10,6', '11,6', '12,6', '13,6', '13,7'],
  RAIL = new Set(['10,6', '11,6', '12,6', '13,6', '13,7']),
  roads = new Set(ROAD);
for (const key of ROAD) {
  const [c, r] = key.split(',').map(Number);
  for (const d of DIRS) {
    const [dc, dr] = STEPS[r & 1][d],
      n = `${c + dc},${r + dr}`;
    if (roads.has(n)) put(`improvements/${RAIL.has(key) && RAIL.has(n) ? 'railroad' : 'road'}_${d}`, c, r);
  }
}
for (const [name, c, r] of [
  ['improvements/irrigation', 6, 6],
  ['improvements/irrigation', 7, 6],
  ['improvements/irrigation', 6, 7],
  ['improvements/mine', 8, 3],
  ['terrain/horse', 10, 8],
  ['terrain/coal', 13, 4],
  ['terrain/gold', 9, 2],
  ['terrain/fish', 3, 9],
  ['terrain/oasis', 16, 6],
  ['terrain/seal', 19, 2],
  ['terrain/oil', 17, 3],
  ['improvements/pollution', 12, 8],
  ['map/hut', 3, 3],
  ['map/fort', 14, 5],
])
  put(name, c, r);
// The shield goes where the descriptor anchors it, not at the tile's corner.
out.over(T['terrain/shield'], 5 * W + 11, 2 * ROW + 12);
const player = (s, light, dark) => recolour(s, light, dark);
const at2 = (s, c, r) => out.over(s, c * W + (r & 1) * (W / 2), r * ROW);
at2(T['map/city'], 7, 5);
at2(player(T['map/city_rim'], '#e04040', '#801818'), 7, 5);
at2(T['map/city'], 11, 7);
at2(player(T['map/city_rim'], '#4060e0', '#182080'), 11, 7);
for (const [u, c, r, light, dark] of [
  ['settlers', 5, 6, '#e04040', '#801818'],
  ['warrior', 8, 6, '#e04040', '#801818'],
  ['knight', 11, 5, '#4060e0', '#182080'],
  ['trireme', 6, 9, '#e04040', '#801818'],
  ['musketman', 13, 6, '#4060e0', '#182080'],
])
  at2(player(T[`units/${u}`], light, dark), c, r);
at2(T['map/fortify'], 13, 6);
// Fog: the east beyond column 18 is unexplored, and its edge fades.
for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++) {
    const seen = (cc) => cc < 19;
    if (!seen(c)) {
      const black = new Spr(W, 36);
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < W; x++) if (T['terrain/ocean'].get(x, y)) black.set(x, y, '#000000');
      at2(black, c, r);
      continue;
    }
    for (const d of DIRS) {
      const [dc] = STEPS[r & 1][d];
      if (!seen(c + dc)) put(`map/fog_${d}`, c, r);
    }
  }

png(out, Number(process.argv[3] ?? 2), process.argv[2]);

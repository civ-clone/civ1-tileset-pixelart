// A staggered isometric map drawn the way civ.one draws one (land or ocean base, the coast's four quarters, river
//  mouths, terrain joined over its four edges, improvements, then cities and units over the landscape, row by row), to
//  check the joins: `node tools/preview-iso.js <out.png> [scale]`.
// Whether terrain `t` joins a neighbour `n`, as the descriptor's `families.terrain.matches` says (by default, only
//  the same terrain).
const joinsTo = (desc) => (t, n) => {
  const cap = (s) => s[0].toUpperCase() + s.slice(1),
    list = desc.families.terrain.matches[cap(t)];
  return list ? list.some((m) => (m === '@water' ? n === 'ocean' : m.toLowerCase() === n)) : n === t;
};
const joins = joinsTo(require('../tileset-iso.json'));
const { Spr, png, recolour } = require('../src/lib');
const { W, H, ROW, DIRS, ALL, CORNERS, named } = require('../src/iso');
const T = require('../src/iso-map');

// Odd rows sit half a diamond to the right.
const MAP = [
  '..............',
  '.......aa.....',
  '......aatt....',
  '.....ggppdd...',
  '....gggphhdd..',
  '....ggfphmmd..',
  '...gffpphmmdd.',
  '...gfffgghmd..',
  '...ssffggghdd.',
  '..sssjjgggpp..',
  '...ssjjjggpp..',
  '...tsjjjggg...',
  '....ttjjgg..g.',
  '....tttgg..gg.',
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
  a: 'arctic',
};
const rows = MAP.length,
  cols = MAP[0].length;
// A river running down from the hills to the sea.
const RIVER = new Set(['8,6', '8,7', '8,8', '8,9', '9,10', '9,11']);
const at = (c, r) => (RIVER.has(`${c},${r}`) ? 'river' : MAP[r] && MAP[r][c] !== undefined ? K[MAP[r][c]] : 'ocean');
// Staggered-iso neighbours, by the row's parity, as the engine's `StaggeredIsoTopology` steps.
const STEPS = [
  { n: [0, -2], ne: [0, -1], e: [1, 0], se: [0, 1], s: [0, 2], sw: [-1, 1], w: [-1, 0], nw: [-1, -1] },
  { n: [0, -2], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 2], sw: [0, 1], w: [-1, 0], nw: [0, -1] },
];
const step = (c, r, d) => {
  const [dc, dr] = STEPS[r & 1][d];
  return [c + dc, r + dr];
};
const neighbour = (c, r, d) => at(...step(c, r, d));

const out = new Spr(cols * W + W / 2, ((rows + 1) * H) / 2 + 16),
  box = (c, r) => [c * W + (r & 1) * (W / 2), r * ROW + 16],
  put = (name, c, r, dy = 0) => {
    const s = typeof name === 'string' ? T[name] : name;
    if (!s) throw new Error(`no sprite ${name}`);
    const [x, y] = box(c, r);
    out.over(s, x, y + dy);
  };

for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++) {
    const t = at(c, r);
    if (t === 'ocean') {
      put('terrain/ocean', c, r);
      const isLand = (d) => neighbour(c, r, d) !== 'ocean';
      for (const [q, around] of Object.entries(CORNERS)) {
        const bits = around.map((d) => (isLand(d) ? '1' : '0')).join('');
        if (bits !== '000') put(`terrain/coast_${q}_${bits}`, c, r);
      }
      for (const d of DIRS) if (neighbour(c, r, d) === 'river') put(`terrain/river_mouth_${d}`, c, r);
      continue;
    }
    put('terrain/land', c, r);
    const mask = DIRS.filter((d) => joins(t, neighbour(c, r, d)));
    put(mask.length ? `terrain/${t}_${named(mask)}` : `terrain/${t}`, c, r);
  }

// Roads, with a railroad on part of them.
const ROAD = ['5,6', '6,6', '6,7', '7,8', '8,8', '9,8', '9,7', '10,7', '10,6'],
  RAIL = new Set(['9,8', '9,7', '10,7', '10,6']),
  CITIES = new Set(['8,8', '10,6']),
  roads = new Set(ROAD);
for (const key of ROAD) {
  const [c, r] = key.split(',').map(Number);
  for (const d of ALL) {
    const n = step(c, r, d).join(',');
    // As the renderer does, a railroad runs on into a city beside it.
    if (roads.has(n))
      put(`improvements/${RAIL.has(key) && (RAIL.has(n) || CITIES.has(n)) ? 'railroad' : 'road'}_${d}`, c, r);
  }
}
for (const [name, c, r] of [
  ['improvements/irrigation', 7, 9],
  ['improvements/farmland', 8, 10],
  ['improvements/airbase', 8, 9],
  ['improvements/irrigation', 7, 10],
  ['improvements/mine', 9, 5],
  ['terrain/horse', 10, 10],
  ['terrain/coal', 8, 4],
  ['terrain/gold', 9, 6],
  ['terrain/fish', 2, 7],
  ['terrain/oasis', 11, 7],
  ['terrain/seal', 7, 1],
  ['terrain/game', 5, 7],
  ['terrain/gems', 6, 10],
  ['improvements/pollution', 9, 12],
  ['map/hut', 4, 4],
  ['map/fort', 10, 4],
])
  put(name, c, r);
// The shield goes where the descriptor anchors it.
{
  const [x, y] = box(5, 3);
  out.over(T['terrain/shield'], x + 27, y + 10);
}

// Cities, then units, over the landscape, each row in front of the one above. A city is drawn as the renderer draws it:
//  the city, its walls in the tile, then its rim.
const RED = ['#e04040', '#801818'],
  BLUE = ['#4060e0', '#182080'],
  player = (s, [light, dark]) => recolour(s, light, dark);
const tall = [
  [8, 8, () => [T['map/city'], player(T['map/city_rim'], RED)]],
  [10, 6, () => [T['map/city'], [T['map/walls'], 0], player(T['map/city_rim'], BLUE)]],
  [7, 9, () => [player(T['units/settlers'], RED)]],
  [6, 6, () => [player(T['units/warrior'], RED)]],
  [10, 5, () => [player(T['units/knight'], BLUE)]],
  [3, 8, () => [player(T['units/trireme'], RED)]],
  [11, 8, () => [player(T['units/musketman'], BLUE), T['map/fortify']]],
  [9, 10, () => [player(T['units/catapult'], RED)]],
].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
// A layer is drawn 16px up, as the descriptor anchors units and cities, unless it says otherwise (the walls, in the tile).
for (const [c, r, layers] of tall)
  for (const s of layers()) Array.isArray(s) ? put(s[0], c, r, s[1]) : put(s, c, r, -16);

// Fog: the far right is unexplored, and its edge fades.
const seen = (c) => c < 12;
for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++) {
    if (!seen(c)) {
      const [x, y] = box(c, r);
      for (let yy = 0; yy < H; yy++)
        for (let xx = 0; xx < W; xx++) if (T['terrain/land'].get(xx, yy)) out.set(x + xx, y + yy, '#000000');
      continue;
    }
    for (const d of DIRS) if (!seen(step(c, r, d)[0])) put(`map/fog_${d}`, c, r);
  }

const [file, scale = 2] = process.argv.slice(2);
png(out, Number(scale), file);

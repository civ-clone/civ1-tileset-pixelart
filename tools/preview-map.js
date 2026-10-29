// A map drawn the way the renderer draws it (land/ocean base, coast cut from the strip by the 8-neighbour mask,
//  terrain joined on edges, river mouths, specials, roads), to check the joins: `node src/preview-map.js <out.png>`.
const { S, Spr, png, recolour, unit } = require('../src/lib');
const { terrainSprites: T, specials, imp } = require('../src/terrain');
const units = require('../src/units');

const MAP = [
  '..........................',
  '....ggppddd.......aaaa....',
  '..ggpphmmmdd..ttaaaaaaaa..',
  '.gggphmmmmhdd..tttaaaa....',
  '.gfffphhmmmhdd...tt.......',
  '.gffffgpr.hmpddp..........',
  '..fffjjgr..mmpddo.........',
  '..ssfjjjrr..hhpdd...gg....',
  '...ssjjjjrrgggpp...gfmg...',
  '....ssjjjg..rgg....ggg....',
  '.....s........r...........',
  '..........................',
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
const H = MAP.length,
  W = MAP[0].length,
  out = new Spr(W * S, H * S);
const at = (x, y) => (MAP[y] && MAP[y][x] !== undefined ? K[MAP[y][x]] : 'ocean');
const isLand = (x, y) => at(x, y) !== 'ocean';
const N8 = { w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1] };
const put = (spr, x, y) => out.over(spr, x * S, y * S);
const roads = new Set(['7,5', '8,5', '9,4', '10,4', '11,4', '12,4', '20,8', '21,8', '13,8', '14,8', '15,8']);
const rails = new Set(['13,8', '14,8', '15,8']);

for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const t = at(x, y);
    if (t === 'ocean') {
      put(T.ocean, x, y);
      const bits = Object.values(N8).reduce((m, [dx, dy], i) => (isLand(x + dx, y + dy) ? m | (1 << i) : m), 0);
      if (bits) {
        const cell = (c, qx, qy) => {
          const q = new Spr(S / 2, S / 2);
          for (let j = 0; j < S / 2; j++)
            for (let i = 0; i < S / 2; i++) q.set(i, j, T.coast_sprite.get(c * S + qx + i, qy + j));
          return q;
        };
        out.over(cell(bits & 7, 0, 0), x * S, y * S);
        out.over(cell((bits >> 2) & 7, S / 2, 0), x * S + S / 2, y * S);
        out.over(cell((bits >> 4) & 7, S / 2, S / 2), x * S + S / 2, y * S + S / 2);
        out.over(cell(((bits >> 6) & 7) | ((bits & 1) << 2), 0, S / 2), x * S, y * S + S / 2);
      }
      for (const d of ['n', 'e', 's', 'w'])
        if (at(x + N8[d][0], y + N8[d][1]) === 'river') put(T[`river_mouth_${d}`], x, y);
      continue;
    }
    put(T.land, x, y);
    if (x === 3 && y === 2) put(imp.irrigation, x, y);
    const joins = ['n', 'e', 's', 'w'].filter((d) => {
      const n = at(x + N8[d][0], y + N8[d][1]);
      return n === t || (t === 'river' && n === 'ocean');
    });
    const name = t === 'grassland' || true ? (joins.length ? `${t}_${joins.join('')}` : t) : t;
    put(T[name], x, y);
    const key = `${x},${y}`;
    if (roads.has(key)) {
      const dirs = Object.entries(N8)
        .filter(([, [dx, dy]]) => roads.has(`${x + dx},${y + dy}`))
        .map(([d]) => d);
      for (const d of dirs)
        put(
          (rails.has(key) && rails.has(`${x + N8[d][0]},${y + N8[d][1]}`) ? imp : imp)[
            `${rails.has(key) && rails.has(`${x + N8[d][0]},${y + N8[d][1]}`) ? 'railroad' : 'road'}_${d}`
          ],
          x,
          y
        );
    }
  }
put(specials.coal, 12, 7);
put(specials.gold, 8, 3);
put(specials.horse, 14, 7);
put(specials.doe, 3, 5);
put(specials.gems, 7, 8);
put(specials.oasis, 12, 2);
put(specials.fish, 3, 10);
put(specials.seal, 21, 2);
put(specials.game, 16, 3);
out.over(specials.shield, 2 * S + 10, 8 * S + 9);
put(imp.mine, 12, 6);
put(recolour(unit(units.settlers), '#e04838', '#7a1810'), 5, 4);
put(recolour(unit(units.trireme), '#e04838', '#7a1810'), 1, 6);
put(recolour(unit(units.knight), '#4870e0', '#182c78'), 10, 3);
png(out, Number(process.argv[3] ?? 2), process.argv[2]);

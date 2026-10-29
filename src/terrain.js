// Terrain: the land and ocean bases, every terrain's 16 join variants, the coast strip, river mouths, specials, the
//  tile improvements and fog. Every texture repeats every 32px, so a sprite meets its own neighbours (and the other
//  join variants of its terrain) without a seam.
const { S, OUTLINE, ramp, R, Spr, hash } = require('./lib');

const wrap = (v) => ((v % S) + S) % S;
// Value noise that repeats every 32px; `f` divides 32.
const pnoise = (x, y, f, s) => {
  const n = S / f,
    m = (v) => ((v % n) + n) % n,
    e = (t) => t * t * (3 - 2 * t);
  const xi = Math.floor(x / f),
    yi = Math.floor(y / f),
    tx = e(x / f - xi),
    ty = e(y / f - yi);
  const a = hash(m(xi), m(yi), s),
    b = hash(m(xi + 1), m(yi), s),
    c = hash(m(xi), m(yi + 1), s),
    d = hash(m(xi + 1), m(yi + 1), s);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
};
const pfbm = (x, y, s) =>
  pnoise(x, y, 8, s) * 0.55 + pnoise(x, y, 4, s + 7) * 0.3 + hash(wrap(x), wrap(y), s + 13) * 0.15;
const pick = (n, cs) => cs[Math.max(0, Math.min(cs.length - 1, Math.floor(n * cs.length)))];
const h1 = (x, y, s) => hash(wrap(x), wrap(y), s);

const DIRS = ['n', 'e', 's', 'w'];
const MASKS = [...Array(16).keys()].map((m) => DIRS.filter((d, i) => m & (1 << i)));

// ---------- coverage ----------
// Where a terrain overlay is drawn: the whole tile, less a ragged fringe along every edge whose neighbour is not the
//  same terrain, where the land base shows through. The fringe (soft band included) is at most 8px deep and corners
//  at most 9px, which is what lets features cross a joined edge (see `overlay`).
const coverage = (mask, seed) => {
  const c = new Array(S * S).fill(1);
  const edge = { n: (x, y) => [y, x], s: (x, y) => [S - 1 - y, x], w: (x, y) => [x, y], e: (x, y) => [S - 1 - x, y] };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let v = 1;
      for (const d of DIRS) {
        if (mask.includes(d)) continue;
        const [dist, t] = edge[d](x, y),
          depth = 2.5 + pnoise(t, DIRS.indexOf(d) * 8, 4, seed) * 4;
        if (dist < depth) v = 0;
        else if (dist < depth + 1.5 && v) v = 2;
      }
      for (const [a, b] of [
        ['n', 'w'],
        ['n', 'e'],
        ['s', 'w'],
        ['s', 'e'],
      ]) {
        if (mask.includes(a) || mask.includes(b)) continue;
        const cx = b === 'w' ? 8.5 : S - 8.5,
          cy = a === 'n' ? 8.5 : S - 8.5;
        if (
          (b === 'w' ? x < cx : x > cx) &&
          (a === 'n' ? y < cy : y > cy) &&
          Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > 6.5
        )
          v = 0;
      }
      c[y * S + x] = v === 2 ? (h1(x, y, seed + 3) < 0.5 ? 0 : 2) : v;
    }
  return c;
};

// ---------- overlay ----------
// A terrain sprite for `mask`: its ground where the coverage is, and its features. Features repeat every tile, and one
//  that crosses into a neighbour is drawn by both tiles, so one is kept only when it is the same either side: it may
//  cross one joined edge, keeping 8px clear of the corners.
const overlay = (def) => {
  const layers = [];
  for (const d of def.features ?? [])
    for (let ty = 0; ty < 3; ty++)
      for (let tx = 0; tx < 3; tx++) {
        const l = new Spr(S * 3, S * 3);
        d.draw(l, d.x + tx * S, d.y + ty * S);
        l.outline(def.outline ?? OUTLINE);
        let x0 = 99,
          y0 = 99,
          x1 = -1,
          y1 = -1;
        l.p.forEach((c, i) => {
          if (!c) return;
          const x = i % l.w,
            y = Math.floor(i / l.w);
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        });
        if (x1 < S || x0 >= 2 * S || y1 < S || y0 >= 2 * S) continue;
        layers.push({ l, x0, y0, x1, y1, ay: d.y + ty * S, ax: d.x + tx * S, p: d.p, id: def.features.indexOf(d) });
      }
  layers.sort((a, b) => a.ay - b.ay || a.ax - b.ax);

  return (mask) => {
    const cov = coverage(mask, def.seed),
      out = new Spr();
    if (def.ground)
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (cov[y * S + x]) out.set(x, y, def.ground(x, y));
    const big = new Spr(S * 3, S * 3);
    const mi = MASKS.findIndex((m) => m.join('') === mask.join(''));
    for (const { l, x0, y0, x1, y1, p, id } of layers) {
      const tiles = new Set();
      for (const ty of [Math.floor(y0 / S), Math.floor(y1 / S)])
        for (const tx of [Math.floor(x0 / S), Math.floor(x1 / S)]) tiles.add(`${tx},${ty}`);
      tiles.delete('1,1');
      if (tiles.size > 1) continue;
      if (tiles.size === 1) {
        const [tx, ty] = [...tiles][0].split(',').map(Number);
        if (tx !== 1 && ty !== 1) continue;
        const dir = ty === 0 ? 'n' : ty === 2 ? 's' : tx === 0 ? 'w' : 'e';
        if (!mask.includes(dir)) continue;
        const [a0, a1] = dir === 'n' || dir === 's' ? [x0, x1] : [y0, y1];
        if (a0 < S + 8 || a1 > 2 * S - 9) continue;
        if (dir === 'n' && y1 >= 2 * S - 9) continue;
        if (dir === 's' && y0 < S + 9) continue;
        if (dir === 'w' && x1 >= 2 * S - 9) continue;
        if (dir === 'e' && x0 < S + 9) continue;
      } else {
        // Wholly inside this tile, so no neighbour draws it: some are left out of some variants, for variety.
        if (hash(mi, id, def.seed + 1) >= p) continue;
      }
      big.over(l);
    }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) out.set(x, y, big.get(x + S, y + S));
    return out;
  };
};

// ---------- features ----------
const peak =
  (h, w, snow = true) =>
  (d, x, base) => {
    const k = (v) => Math.round(v);
    const left = [
      [x - w, base],
      [x - w * 0.62, base - h * 0.38],
      [x - w * 0.42, base - h * 0.52],
      [x - w * 0.18, base - h * 0.84],
    ];
    const right = [
      [x + w * 0.22, base - h * 0.8],
      [x + w * 0.45, base - h * 0.62],
      [x + w * 0.6, base - h * 0.4],
      [x + w, base],
    ];
    const top = [x, base - h];
    d.poly([...left, top, ...right], '#7c7264');
    d.poly([...left, top, [x + 1, base - h * 0.55], [x - w * 0.1, base]], '#a89e8c');
    d.line(k(x - w * 0.45), k(base - h * 0.2), k(x - w * 0.15), k(base - h * 0.45), '#c2b8a4');
    d.line(k(x + w * 0.35), k(base - h * 0.3), k(x + w * 0.55), k(base - 1), '#625a4e');
    if (snow) {
      d.poly(
        [
          top,
          [x + w * 0.22, base - h * 0.8],
          [x + w * 0.38, base - h * 0.6],
          [x + w * 0.12, base - h * 0.66],
          [x - w * 0.05, base - h * 0.56],
          [x - w * 0.2, base - h * 0.66],
          [x - w * 0.32, base - h * 0.6],
          [x - w * 0.18, base - h * 0.84],
        ],
        '#eef2f8'
      );
      d.poly(
        [
          top,
          [x + w * 0.22, base - h * 0.8],
          [x + w * 0.38, base - h * 0.6],
          [x + w * 0.12, base - h * 0.66],
          [x + 1, base - h * 0.75],
        ],
        '#b8c4dc'
      );
    }
  };
const hillR = ramp('#5a6a22', '#7a8c30', '#9cae44', '#c0cc68');
const mound = (rx, h) => (d, cx, base) => {
  const m = new Spr(d.w, d.h);
  m.ball(cx, base, rx, h, hillR);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (y >= base) m.p[y * m.w + x] = null;
  for (let i = 0; i < Math.round(rx / 2); i++) {
    const x = Math.floor(cx - rx * 0.6 + hash(i, rx, 50) * rx * 1.2),
      y = Math.floor(base - 2 - hash(i, h, 51) * h * 0.6);
    if (m.get(x, y) && m.get(x + 2, y))
      m.set(x, y, hillR.d)
        .set(x + 1, y, hillR.d)
        .set(x + 2, y - 1, hillR.d);
  }
  d.over(m);
};
const conifer =
  (h, cs = ['#174e20', '#1f6228', '#2a7832', '#3a8c3a']) =>
  (d, x, base) => {
    d.rect(x, base - 2, 2, 3, R.wood.d);
    for (let i = 0; i < 3; i++) {
      const top = base - h + i * (h / 4),
        bot = base - 2 - (2 - i) * (h / 5),
        w = 2 + i * 1.6;
      d.poly(
        [
          [x + 1, top],
          [x + 1 + w, bot],
          [x + 1 - w, bot],
        ],
        cs[i]
      );
      d.line(Math.round(x + 1), Math.round(top + 1), Math.round(x + 1 - w * 0.6), Math.round(bot - 1), cs[3]);
    }
  };
const broadleaf =
  (r, rp = ramp('#1a521c', '#2a7224', '#40922e', '#62ae44')) =>
  (d, x, base) => {
    d.rect(x - 1, base - 3, 2, 4, R.wood.m);
    d.ball(x, base - 3 - r * 0.8, r, r * 0.85, rp);
    d.ball(x - r * 0.45, base - 3 - r * 0.6, r * 0.55, r * 0.5, rp);
  };
const palm =
  (h, lean = 1) =>
  (d, x, base) => {
    for (let i = 0; i <= h; i++)
      d.set(x + Math.round(lean * Math.sin((i / h) * 1.4) * 2.5), base - i, i % 3 ? R.wood.l : R.wood.d);
    const tx = x + Math.round(lean * Math.sin(1.4) * 2.5),
      ty = base - h;
    for (const [dx, dy] of [
      [-5, 2],
      [5, 2],
      [-4, -2],
      [4, -2],
      [0, -3],
    ])
      d.line(tx, ty, tx + dx, ty + dy, '#2e8a2a', 1);
    for (const [dx, dy] of [
      [-5, 3],
      [5, 3],
    ])
      d.set(tx + dx, ty + dy, '#1e6a1e');
    d.set(tx, ty + 1, '#7a4a22').set(tx + 1, ty + 1, '#5a3010');
  };
const fern = (r) => (d, x, base) => {
  const rp = ramp('#1e6a1c', '#2e8a26', '#4caa32', '#78c44a');
  d.ball(x, base - r * 0.7, r, r * 0.75, rp);
  d.set(x - 1, base - r, '#e04060').set(x + 2, base - r * 0.5, '#f07090');
};
const reeds = (d, x, base) => {
  for (const [dx, hgt, lean] of [
    [0, 7, 0],
    [3, 9, 1],
    [-3, 5, -1],
  ]) {
    d.line(x + dx, base, x + dx + lean, base - hgt, '#8a9a40');
    if (hgt > 6) d.rect(x + dx + lean, base - hgt - 1, 1, 3, '#7a4a20');
  }
};
const rock = (r) => (d, x, base) => d.ball(x, base - r * 0.6, r, r * 0.7, R.stone);
const cactus = (d, x, base) => {
  const g = ramp('#2a5a20', '#3e7a2c', '#5a9a3c', '#7ab452');
  d.rect(x, base - 8, 3, 8, g.m)
    .rect(x - 3, base - 6, 2, 3, g.m)
    .rect(x - 2, base - 5, 2, 1, g.m)
    .rect(x + 4, base - 5, 2, 3, g.m)
    .rect(x + 3, base - 3, 2, 1, g.m)
    .bevel(g);
};
const shrub = (d, x, base) => d.ball(x, base - 2, 2.6, 2.2, ramp('#3a4a24', '#56643a', '#74804a', '#8a9658'));
const ice = (d, x, base) => {
  const r = ramp('#7a9ac8', '#a8c4e8', '#d4e4f6', '#ffffff');
  d.poly(
    [
      [x - 6, base],
      [x - 4, base - 3],
      [x - 1, base - 4],
      [x + 2, base - 2],
      [x + 4, base - 3],
      [x + 6, base],
    ],
    r.m
  ).bevel(r);
};
const F = (x, y, draw, p = 1) => ({ x, y, draw, p });

// ---------- terrains ----------
const landColours = ['#4c8a2c', '#539230', '#5a9c33', '#62a437'];
const land = (x, y) => (h1(x, y, 5) > 0.94 && h1(x, y + 1, 5) < 0.7 ? '#3e7a24' : pick(pfbm(x, y, 1), landColours));

const defs = {
  grassland: {
    seed: 100,
    ground: (x, y) => {
      if (h1(x, y, 102) > 0.988) return pick(h1(x, y, 103), ['#f4e468', '#ffffff', '#ec7a96']);
      if (pnoise(x, y, 8, 101) > 0.58)
        return h1(x, y, 104) > 0.9 ? '#447e26' : pick(pnoise(x, y, 4, 105), ['#6cb23c', '#74ba40', '#7cc246']);
      return null;
    },
    features: [F(6, 12, shrub, 0.4), F(24, 26, shrub, 0.4)],
  },
  plains: {
    seed: 110,
    ground: (x, y) => {
      if ((x + Math.floor(y / 4)) % 4 === 0 && pnoise(x, y, 4, 111) > 0.42) return y % 4 === 0 ? '#eed678' : '#b0922c';
      return pick(pfbm(x, y, 112), ['#b0a43e', '#b8ac46', '#c2b44e', '#ccbc56']);
    },
    features: [F(26, 9, shrub, 0.4)],
  },
  desert: {
    seed: 120,
    ground: (x, y) => {
      const v = y + 2.5 * Math.sin((2 * Math.PI * x) / S) + 1.2 * Math.sin((4 * Math.PI * x) / S + 1);
      const band = ((Math.floor(v) % 8) + 8) % 8;
      if (band === 0) return '#c4a050';
      if (band === 1) return '#f6e2a4';
      if (h1(x, y, 121) > 0.96) return '#b08c44';
      return pick(pfbm(x, y, 122), ['#dab866', '#e2c070', '#e8c87a', '#eccf84']);
    },
    features: [F(23, 14, cactus, 0.2), F(9, 26, rock(2), 0.5), F(8, 12, rock(1.5), 0.4), F(24, 27, cactus, 0.1)],
  },
  tundra: {
    seed: 130,
    ground: (x, y) => {
      if (h1(x, y, 131) > 0.975) return '#dce4e8';
      if (h1(x, y, 132) < 0.04) return '#a8964a';
      return pick(pfbm(x, y, 133), ['#76866a', '#808c6e', '#8a9476', '#949c7e']);
    },
    features: [F(8, 11, shrub, 0.6), F(22, 22, shrub, 0.6), F(15, 28, rock(1.6), 0.5)],
  },
  arctic: {
    seed: 140,
    ground: (x, y) => {
      if (Math.abs(pnoise(x, y, 4, 141) - 0.5) < 0.03) return '#a4bcdc';
      return pick(pfbm(x, y, 142), ['#c4d6ec', '#d4e2f2', '#e2ecf8', '#f2f6fc']);
    },
    outline: '#5a7aa8',
    features: [F(13, 13, ice, 0.35), F(22, 27, ice, 0.25)],
  },
  swamp: {
    seed: 150,
    ground: (x, y) => {
      const w = pnoise(x, y, 8, 151);
      if (w > 0.6) return h1(x, y, 152) > 0.9 ? '#7a9a88' : w > 0.68 ? '#2e4c40' : '#3a5a4a';
      return pick(pfbm(x, y, 153), ['#46562a', '#50602e', '#5a6834', '#647238']);
    },
    outline: '#26301a',
    features: [F(7, 12, reeds, 0.7), F(22, 18, reeds, 0.7), F(13, 28, reeds, 0.7)],
  },
  forest: {
    seed: 160,
    ground: (x, y) => pick(pfbm(x, y, 161), ['#1c461a', '#22521e', '#2a5e22', '#326a26']),
    outline: '#0e2410',
    features: [
      F(7, 13, conifer(11)),
      F(22, 10, broadleaf(4.5)),
      F(14, 22, broadleaf(5)),
      F(27, 24, conifer(10)),
      F(5, 30, broadleaf(4)),
      F(19, 31, conifer(9)),
      F(0, 21, broadleaf(4)),
      F(15, 3, conifer(10)),
    ],
  },
  jungle: {
    seed: 170,
    ground: (x, y) =>
      h1(x, y, 171) > 0.92 ? '#5aaa38' : pick(pfbm(x, y, 172), ['#1c5a1e', '#226822', '#2a7626', '#32842a']),
    outline: '#0c2a0e',
    features: [
      F(8, 14, palm(10, 1)),
      F(22, 12, fern(4.5)),
      F(15, 24, fern(5)),
      F(26, 27, palm(9, -1)),
      F(5, 29, fern(3.5)),
      F(0, 21, fern(4)),
      F(16, 3, palm(9, 1)),
    ],
  },
  hills: {
    seed: 180,
    ground: (x, y) => pick(pfbm(x, y, 181), ['#6e7a34', '#76823a', '#7e8a40', '#869246']),
    outline: '#2a3410',
    features: [
      F(16, 27, mound(11, 13)),
      F(0, 21, mound(8, 9)),
      F(16, 4, mound(7, 8)),
      F(6, 13, mound(5, 5), 0.6),
      F(26, 13, mound(5, 6), 0.6),
    ],
  },
  mountains: {
    seed: 190,
    ground: (x, y) =>
      h1(x, y, 191) > 0.93 ? '#6a6252' : pick(pfbm(x, y, 192), ['#78705e', '#827a66', '#8c846e', '#968e78']),
    features: [
      F(16, 26, peak(21, 13)),
      F(0, 22, peak(12, 8)),
      F(16, 4, peak(12, 7)),
      F(6, 14, peak(8, 5, false), 0.6),
      F(27, 13, peak(9, 5, false), 0.6),
    ],
  },
};

const terrainSprites = {};
for (const [name, def] of Object.entries(defs)) {
  const draw = overlay(def);
  for (const m of MASKS) terrainSprites[m.length ? `${name}_${m.join('')}` : name] = draw(m);
}

// ---------- rivers ----------
const WATER = ['#3c6cc4', '#4a7ad0', '#5888da'],
  BANK = '#8c7a48';
const ends = { n: [16, -1], e: [S, 16], s: [16, S], w: [-1, 16] };
const riverSprite = (mask) => {
  const water = new Spr();
  const brush = (x, y, r) => water.ellipse(x, y, r, r, '#000001');
  brush(16, 16, mask.length ? 3.6 : 4.6);
  for (const d of mask) {
    const [ex, ey] = ends[d];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40,
        wob = Math.sin(t * Math.PI) * 2.2 * (d === 'n' || d === 'e' ? 1 : -1);
      const x = 16 + (ex - 16) * t + (d === 'n' || d === 's' ? wob : 0),
        y = 16 + (ey - 16) * t + (d === 'e' || d === 'w' ? wob : 0);
      brush(x, y, 2.8);
    }
  }
  const out = new Spr();
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (water.get(x, y)) {
        const edge = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => water.in(x + dx, y + dy) && !water.get(x + dx, y + dy));
        out.set(
          x,
          y,
          edge
            ? '#2c54a4'
            : (x + 2 * y) % 7 === 0 && h1(x, y, 201) > 0.4
            ? '#a8c8f4'
            : pick(pnoise(x, y, 4, 200), WATER)
        );
      } else if (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
        ].some(([dx, dy]) => water.get(x + dx, y + dy))
      )
        out.set(x, y, h1(x, y, 202) > 0.5 ? BANK : '#6e6a34');
    }
  return out;
};
for (const m of MASKS) terrainSprites[m.length ? `river_${m.join('')}` : 'river'] = riverSprite(m);

// ---------- bases ----------
const base = (fn) => {
  const t = new Spr();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) t.set(x, y, fn(x, y));
  return t;
};
const OCEAN = ['#22408c', '#28489a', '#2e50a6', '#3458b0'];
const ocean = (x, y) => {
  const cx = Math.floor(x / 8),
    cy = Math.floor(y / 8);
  if (hash(cx & 3, cy & 3, 40) > 0.4) {
    const len = 3 + Math.floor(hash(cx & 3, cy & 3, 43) * 3),
      lx = x - cx * 8 - Math.floor(hash(cx & 3, cy & 3, 41) * 3),
      ly = y - cy * 8 - 2 - Math.floor(hash(cx & 3, cy & 3, 42) * 4);
    if (ly === -1 && lx === Math.floor(len / 2)) return '#c8dcf8';
    if (ly === 0 && lx >= 0 && lx < len) return lx === 0 || lx === len - 1 ? '#6a90d8' : '#a8c4f0';
    if (ly === 1 && lx >= 1 && lx < len + 1) return '#1c3478';
  }
  return pick(pfbm(x, y, 3), OCEAN);
};
terrainSprites.land = base(land);
terrainSprites.ocean = base(ocean);

// ---------- coast ----------
// The strip the renderer cuts coast quarters from: 8 cells, cell c holding, in each quarter, the coast for that
//  corner's three neighbours as the bits of c (counter-clockwise edge, diagonal, clockwise edge).
const QUARTERS = { tl: ['w', 'nw', 'n'], tr: ['n', 'ne', 'e'], br: ['e', 'se', 's'], bl: ['s', 'sw', 'w'] };
const distTo = (x, y, dir) => {
  const px = x + 0.5,
    py = y + 0.5;
  const dx = dir.includes('w') ? px : dir.includes('e') ? S - px : 0,
    dy = dir.includes('n') ? py : dir.includes('s') ? S - py : 0;
  if (dir.length === 2) return Math.hypot(dx, dy);
  return dir === 'n' || dir === 's' ? dy : dx;
};
const coastTile = (landDirs) => {
  const t = new Spr();
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const d = Math.min(...landDirs.map((dir) => distTo(x, y, dir)), 99),
        n = pnoise(x, y, 4, 60) * 1.6;
      if (d < 1.2 + n) t.set(x, y, h1(x, y, 61) > 0.85 ? '#c8b06a' : '#e4d090');
      else if (d < 2.2 + n) t.set(x, y, '#b8a46a');
      else if (d < 3.2 + n) t.set(x, y, h1(x, y, 62) > 0.45 ? '#e8f0fc' : '#7ea4e0');
      else if (d < 6.5 + n * 1.5)
        t.set(x, y, (x + y) % 2 && d > 5 + n ? null : h1(x, y, 63) > 0.92 ? '#8cb0e8' : '#3e74c4');
    }
  return t;
};
const coastStrip = new Spr(S * 8, S);
for (let c = 0; c < 8; c++)
  for (const [q, dirs] of Object.entries(QUARTERS)) {
    const t = coastTile(dirs.filter((d, i) => c & (1 << i))),
      ox = q[1] === 'l' ? 0 : S / 2,
      oy = q[0] === 't' ? 0 : S / 2;
    for (let y = oy; y < oy + S / 2; y++)
      for (let x = ox; x < ox + S / 2; x++) coastStrip.set(c * S + x, y, t.get(x, y));
  }
terrainSprites.coast_sprite = coastStrip;

const riverMouth = (dir) => {
  const t = new Spr(),
    [ex, ey] = ends[dir];
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const along = dir === 'n' ? y : dir === 's' ? S - 1 - y : dir === 'w' ? x : S - 1 - x,
        across = dir === 'n' || dir === 's' ? x - 15.5 : y - 15.5;
      const w = 3 + along * 0.55 + pnoise(x, y, 4, 70) * 1.5;
      if (along > 12 || Math.abs(across) > w) continue;
      if (Math.abs(across) > w - 1.4 && along < 8) t.set(x, y, '#e0cc8a');
      else t.set(x, y, along > 9 && (x + y) % 2 ? null : (x * 3 + y) % 7 === 0 ? '#a8c8f4' : '#4a80d4');
    }
  return t;
};
for (const d of DIRS) terrainSprites[`river_mouth_${d}`] = riverMouth(d);

// ---------- specials ----------
const special = (draw, ox = 0, oy = 0, w = S, h = S) => {
  const s = new Spr(w, h);
  draw(s);
  s.outline();
  return s;
};
const specials = {
  shield: special(
    (s) => {
      s.poly(
        [
          [1, 1],
          [9, 1],
          [9, 6],
          [5, 10],
          [1, 6],
        ],
        R.bronze.m
      ).bevel(R.bronze);
      s.rect(4, 3, 2, 4, R.bronze.d);
    },
    0,
    0,
    11,
    12
  ),
  fish: special((s) => {
    const r = ramp('#1e5a6a', '#3a8aa0', '#6ab8c8', '#c0ecf4');
    s.ball(22, 21, 4, 2, r);
    s.poly(
      [
        [18, 21],
        [15, 18],
        [15, 24],
      ],
      r.m
    );
    s.set(24, 20, OUTLINE);
    s.line(15, 26, 19, 26, '#e8f0fc').line(25, 26, 29, 26, '#e8f0fc').line(20, 27, 24, 27, '#a8c4f0');
  }),
  horse: special((s) => {
    s.ball(21, 22, 6, 3.4, R.horse);
    s.poly(
      [
        [25, 21],
        [27, 15],
        [30, 15],
        [30, 18],
        [28, 19],
        [27, 23],
      ],
      R.horse.m
    ).bevel(R.horse);
    for (const x of [17, 19, 23, 25]) s.line(x, 24, x, 29, x % 2 ? R.horse.d : R.horse.m);
    s.line(15, 20, 13, 26, R.horse.d).line(26, 14, 27, 19, R.fur.d);
  }),
  doe: special((s) => {
    const r = ramp('#6a3a18', '#a0602c', '#c8844a', '#e0a066');
    s.ball(20, 22, 5.5, 3, r);
    s.poly(
      [
        [24, 21],
        [26, 15],
        [29, 15],
        [29, 17],
        [27, 18],
        [26, 22],
      ],
      r.m
    ).bevel(r);
    s.line(26, 14, 26, 13, r.d).line(28, 14, 28, 13, r.d);
    for (const x of [16, 18, 22, 24]) s.line(x, 24, x, 29, r.d);
    s.set(18, 21, '#f0e0c0').set(21, 20, '#f0e0c0');
  }),
  game: special((s) => {
    const r = ramp('#3c2c1c', '#6a5034', '#8c6c48', '#a8885e');
    s.ball(20, 23, 6, 3.4, r);
    s.poly(
      [
        [25, 22],
        [27, 17],
        [30, 17],
        [30, 20],
        [27, 24],
      ],
      r.m
    ).bevel(r);
    s.line(27, 17, 24, 11, '#e0d4b0').line(25, 13, 23, 13, '#e0d4b0').line(29, 17, 31, 11, '#e0d4b0');
    for (const x of [16, 18, 22, 24]) s.line(x, 25, x, 30, r.d);
    s.rect(22, 20, 4, 3, '#d8ccb0');
  }),
  coal: special((s) => {
    for (const [x, y, r] of [
      [18, 26, 3.2],
      [24, 27, 2.8],
      [21, 22, 2.6],
      [27, 23, 2],
    ])
      s.ball(x, y, r, r * 0.8, R.dark);
    s.set(17, 24, '#8a8c98').set(23, 25, '#8a8c98');
  }),
  gold: special((s) => {
    for (const [x, y, r] of [
      [19, 26, 2.6],
      [24, 27, 2.2],
      [22, 23, 2],
    ])
      s.ball(x, y, r, r * 0.8, R.bronze);
    s.line(27, 18, 27, 22, '#ffffff').line(25, 20, 29, 20, '#ffffff');
  }),
  gems: special((s) => {
    const gem = (x, y, c) =>
      s
        .poly(
          [
            [x, y - 3],
            [x + 3, y],
            [x, y + 3],
            [x - 3, y],
          ],
          c.m
        )
        .bevel(c);
    gem(19, 25, ramp('#6a0a2a', '#c0204a', '#f05a7a', '#ffb0c0'));
    gem(25, 24, ramp('#0a3a6a', '#2060c0', '#5a9af0', '#b0d4ff'));
    gem(22, 19, ramp('#0a5a2a', '#1aa050', '#50d080', '#b0f0c8'));
  }),
  oil: special((s) => {
    s.line(18, 30, 23, 14, R.dark.l)
      .line(28, 30, 23, 14, R.dark.l)
      .line(19, 26, 27, 26, R.dark.l)
      .line(21, 20, 25, 20, R.dark.l);
    s.ellipse(23, 30, 5, 1.5, '#141418');
  }),
  oasis: special((s) => {
    s.ellipse(20, 27, 7, 3, '#3a78c8').ellipse(19, 26, 4, 1.5, '#78a8e8');
    palm(10, 1)(s, 24, 25);
  }),
  seal: special((s) => {
    const r = ramp('#3a3a44', '#5c5c6a', '#86869a', '#a8a8b8');
    s.ball(21, 26, 7, 3, r);
    s.ball(16, 22, 3, 3, r);
    s.poly(
      [
        [27, 26],
        [31, 23],
        [31, 29],
      ],
      r.m
    );
    s.set(15, 21, OUTLINE);
  }),
};

// ---------- improvements ----------
const imp = {};
imp.irrigation = (() => {
  const t = new Spr();
  for (let y = 5; y < 27; y++)
    for (let x = 5; x < 27; x++) {
      if ((x + y) % 6 === 0) t.set(x, y, (x + y) % 12 === 0 ? '#5a90e0' : '#3a6ec0');
      else if ((x + y) % 6 === 1) t.set(x, y, '#6a5a2a');
    }
  t.rect(4, 4, 24, 1, '#6a5a2a')
    .rect(4, 27, 24, 1, '#6a5a2a')
    .rect(4, 4, 1, 24, '#6a5a2a')
    .rect(27, 4, 1, 24, '#6a5a2a');
  return t;
})();
imp.mine = special((s) => {
  s.ball(16, 26, 9, 6, R.stone);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (y > 27) s.p[y * S + x] = null;
  s.rect(12, 18, 9, 10, '#141418');
  s.rect(11, 16, 2, 12, R.wood.m).rect(20, 16, 2, 12, R.wood.m).rect(10, 15, 13, 2, R.wood.l);
  s.line(23, 27, 28, 20, R.wood.l).line(26, 19, 30, 22, R.metal.l, 1);
});
imp.pollution = special((s) => {
  for (const [x, y, r] of [
    [10, 12, 4],
    [21, 9, 3.5],
    [16, 21, 5],
    [25, 22, 3.6],
    [8, 25, 3],
  ]) {
    s.ellipse(x, y, r, r * 0.7, '#4a4a2a');
    s.ellipse(x - 0.5, y - 0.5, r * 0.6, r * 0.4, '#7a7a3a');
    s.set(x + 1, y - 1, '#b8b860');
  }
});
const roadLine = (dir) => {
  const [dx, dy] = { n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1] }[
    dir
  ];
  return { dx, dy, len: 16.5 * Math.max(Math.abs(dx), Math.abs(dy)) };
};
for (const dir of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
  const { dx, dy } = roadLine(dir),
    road = new Spr(),
    rail = new Spr();
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const x = 15.5 + dx * i,
      y = 15.5 + dy * i;
    road.ellipse(x + 0.5, y + 0.5, 2.3, 2.3, '#8a6a3c');
  }
  for (let i = 0; i <= steps; i++) {
    const x = 15.5 + dx * i,
      y = 15.5 + dy * i;
    road.ellipse(x + 0.5, y + 0.5, 1.4, 1.4, '#b89460');
    if (h1(Math.round(x), Math.round(y), 90) > 0.7) road.set(x, y, '#a07e4a');
  }
  // sleepers every 4px measured from the edge, so neighbouring tiles' sleepers line up
  const px = -dy,
    py = dx,
    norm = Math.hypot(px, py) || 1,
    ux = px / norm,
    uy = py / norm;
  for (let i = 0; i <= steps; i++) {
    const x = 15.5 + dx * i,
      y = 15.5 + dy * i,
      along = dx ? wrap(Math.round(x)) : wrap(Math.round(y));
    if (along % 4 === 2)
      for (let k = -3; k <= 3; k++) rail.set(Math.round(x + ux * k), Math.round(y + uy * k), R.wood.m);
  }
  for (let i = 0; i <= steps * 2; i++) {
    const x = 15.5 + (dx * i) / 2,
      y = 15.5 + (dy * i) / 2;
    for (const k of [-2, 2]) rail.set(Math.round(x + ux * k), Math.round(y + uy * k), '#c4ccd4');
  }
  imp[`road_${dir}`] = road;
  imp[`railroad_${dir}`] = rail;
}

// ---------- fog ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const fog = {};
for (const d of DIRS) {
  const t = new Spr();
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dist = d === 'n' ? y : d === 's' ? S - 1 - y : d === 'w' ? x : S - 1 - x;
      const along = d === 'n' || d === 's' ? x : y,
        depth = 7 + pnoise(along, DIRS.indexOf(d) * 8, 4, 80) * 5;
      if (BAYER[(y % 4) * 4 + (x % 4)] / 16 < 1 - dist / depth) t.set(x, y, '#000000');
    }
  fog[`fog_${d}`] = t;
}

module.exports = { terrainSprites, specials, imp, fog, MASKS, defs, coverage };

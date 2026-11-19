// The hexagonal pack's tile-shaped sprites: pointy-topped hexes 32 × 36, in rows 27px apart with every odd row shifted
//  16px across, as civ.one's hexagonal grid (`hex-odd-r`) draws them. See SPEC-HEX.md.
//
// Every sprite owns exactly the pixels civ.one's hexagonal projection gives its tile (`owns`), so neighbouring tiles
//  meet with no gap and no pixel drawn twice. Textures repeat on the grid's lattice, every 32px across and every 27px
//  down with a 16px shift (`lnoise`, `lhash`), so a sprite meets copies of itself, and its terrain's other join
//  variants, with no seam on any of its six edges.
const { OUTLINE, ramp, R, Spr, hash } = require('./lib');
const { defs } = require('./terrain');

const W = 32,
  H = 36,
  ROW = 27;

// ---------- geometry ----------
// The tile civ.one's `HexProjection.pixelToTile` puts a pixel in, for tiles W × H with tile (0, 0)'s box at the
//  origin: worked in half pixels, so every pixel is in exactly one tile.
const tileOf = (px, py) => {
  const x = 2 * px + 1,
    y = 2 * py + 1,
    quarter = H / 2,
    rowStep = 3 * quarter,
    box = 2 * W,
    band = Math.floor(y / rowStep),
    into = y - band * rowStep,
    column = (row) => Math.floor((x - (row & 1) * W) / box);
  if (into >= quarter) return [column(band), band];
  const here = column(band),
    middle = (band & 1) * W + here * box + W,
    across = x < middle ? middle - x : x - middle;
  if (into * W >= quarter * across) return [here, band];
  return [column(band - 1), band - 1];
};
const owns = (x, y) => {
  const [c, r] = tileOf(x, y);
  return c === 0 && r === 0;
};

// The six neighbours, as the engine names them, clockwise from the top right: where each one's box is, and the
//  storage step to it from an even row.
const DIRS = ['ne', 'e', 'se', 'sw', 'w', 'nw'];
const OFFSET = { ne: [16, -ROW], e: [W, 0], se: [16, ROW], sw: [-16, ROW], w: [-W, 0], nw: [-16, -ROW] };
const STEP = { '0,-1': 'ne', '1,0': 'e', '0,1': 'se', '-1,1': 'sw', '-1,0': 'w', '-1,-1': 'nw' };
// Which tile, of this one (`''`) and its six neighbours, a pixel in this tile's coordinates is in; null further away.
const whose = (x, y) => {
  const [c, r] = tileOf(x, y);
  return c === 0 && r === 0 ? '' : STEP[`${c},${r}`] ?? null;
};

// The hexagon's corners, and its six edges as the corners either end, clockwise from the top.
const V = { n: [16, 0], ne: [32, 9], se: [32, 27], s: [16, 36], sw: [0, 27], nw: [0, 9] };
const EDGE = {
  ne: [V.n, V.ne],
  e: [V.ne, V.se],
  se: [V.se, V.s],
  sw: [V.s, V.sw],
  w: [V.sw, V.nw],
  nw: [V.nw, V.n],
};
// How far a pixel's centre is inside the edge `d`, and how far along it from its first corner.
const edgeDist = (x, y, d) => {
  const [[ax, ay], [bx, by]] = EDGE[d],
    len = Math.hypot(bx - ax, by - ay),
    ux = (bx - ax) / len,
    uy = (by - ay) / len,
    px = x + 0.5 - ax,
    py = y + 0.5 - ay;
  // The inward normal of a clockwise edge points right of its direction.
  return { dist: -px * uy + py * ux, along: px * ux + py * uy, len };
};
// The middle of each edge, where a road or a river crosses into the neighbour.
const MID = Object.fromEntries(DIRS.map((d) => [d, EDGE[d][0].map((v, i) => (v + EDGE[d][1][i]) / 2)]));
const CENTRE = [16, 18];

// Every subset of the six neighbours, in the engine's order, named as civ.one names a bitmask sprite: `ne-e-se`.
const MASKS = [...Array(64).keys()].map((m) => DIRS.filter((d, i) => m & (1 << i)));
const named = (mask) => mask.join('-');

// ---------- lattice-periodic noise ----------
// Lattice coordinates: (s, t) step by whole numbers between a tile and its neighbours, so anything periodic in both is
//  the same in every tile and across every edge.
const lattice = (x, y) => [x / W - y / (2 * ROW), y / ROW];
const smoothstep = (t) => t * t * (3 - 2 * t);
// Value noise with `ns` cells across a tile and `nt` down a row.
const lnoise = (x, y, ns, nt, seed) => {
  const [s, t] = lattice(x + 0.5, y + 0.5),
    u = s * ns,
    v = t * nt,
    xi = Math.floor(u),
    yi = Math.floor(v),
    m = (a, n) => ((a % n) + n) % n,
    tx = smoothstep(u - xi),
    ty = smoothstep(v - yi);
  const a = hash(m(xi, ns), m(yi, nt), seed),
    b = hash(m(xi + 1, ns), m(yi, nt), seed),
    c = hash(m(xi, ns), m(yi + 1, nt), seed),
    d = hash(m(xi + 1, ns), m(yi + 1, nt), seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
};
// A pixel's place in the lattice's fundamental tile: 32 across, 27 down.
const canon = (x, y) => {
  const k = Math.floor(y / ROW),
    yr = y - ROW * k,
    xr = (((x - 16 * k) % W) + W) % W;
  return [xr, yr];
};
const lhash = (x, y, seed) => {
  const [a, b] = canon(x, y);
  return hash(a, b, seed);
};
// An ordered dither on the lattice: a 4 × 3 threshold table, which repeats on it exactly (4 divides the 32px step
//  and the 16px shift, 3 divides the 27px row). A checker can't: the row's odd 27px step would flip it. In [0, 1).
const DITHER = [0, 6, 4, 10, 5, 11, 1, 7, 8, 2, 9, 3];
const dither = (x, y) => {
  const [xr, yr] = canon(x, y);
  return DITHER[(yr % 3) * 4 + (xr % 4)] / 12;
};
// A glint on water: in about a third of the lattice's 4 × 3 cells, a stroke 2px long, so it is never cut at an edge.
const glint = (x, y, seed) => {
  const [xr, yr] = canon(x, y),
    cx = Math.floor(xr / 4),
    cy = Math.floor(yr / 3);
  if (hash(cx, cy, seed) <= 0.65 || yr - cy * 3 !== Math.floor(hash(cx, cy, seed + 1) * 3)) return false;
  const lx = xr - cx * 4 - Math.floor(hash(cx, cy, seed + 2) * 3);
  return lx === 0 || lx === 1;
};
// Coarse noise about 8px across, finer noise about 4px across, and a speckle.
const lfbm = (x, y, seed) =>
  lnoise(x, y, 4, 3, seed) * 0.55 + lnoise(x, y, 8, 6, seed + 7) * 0.3 + lhash(x, y, seed + 13) * 0.15;
const pick = (n, cs) => cs[Math.max(0, Math.min(cs.length - 1, Math.floor(n * cs.length)))];

// ---------- grounds ----------
// The square pack's ground colours, worked on the hexagonal lattice.
const landColours = ['#4c8a2c', '#539230', '#5a9c33', '#62a437'];
const land = (x, y) =>
  lhash(x, y, 5) > 0.94 && lhash(x, y + 1, 5) < 0.7 ? '#3e7a24' : pick(lfbm(x, y, 1), landColours);
// Short strokes, each kept inside its own cell of `cw` × `ch` in the lattice's fundamental tile (which `cw` divides
//  across and `ch` down), so none is cut at a tile's edge.
const strokes = (x, y, cw, ch, seed) => {
  const [xr, yr] = canon(x, y),
    cx = Math.floor(xr / cw),
    cy = Math.floor(yr / ch);
  return { on: hash(cx, cy, seed) > 0.4, lx: xr - cx * cw, ly: yr - cy * ch, cx, cy };
};

const GROUND = {
  grassland: (x, y) => {
    if (lhash(x, y, 102) > 0.988) return pick(lhash(x, y, 103), ['#f4e468', '#ffffff', '#ec7a96']);
    if (lnoise(x, y, 4, 3, 101) > 0.58)
      return lhash(x, y, 104) > 0.9 ? '#447e26' : pick(lnoise(x, y, 8, 6, 105), ['#6cb23c', '#74ba40', '#7cc246']);
    return null;
  },
  // Wheat: short gold strokes, two to a cell, over golden green.
  plains: (x, y) => {
    const { on, lx, ly } = strokes(x, y, 4, 3, 111);
    if (on && ly === 1 && lx < 3) return '#b0922c';
    if (on && ly === 0 && lx === 1) return '#eed678';
    return pick(lfbm(x, y, 112), ['#b0a43e', '#b8ac46', '#c2b44e', '#ccbc56']);
  },
  // Dune ripples: bands 9px apart, so a row (27px) is three of them and they run on from row to row.
  desert: (x, y) => {
    const [s] = lattice(x + 0.5, y + 0.5),
      v = y + 2.5 * Math.sin(2 * Math.PI * s) + 1.2 * Math.sin(4 * Math.PI * s + 1),
      band = ((Math.floor(v) % 9) + 9) % 9;
    if (band === 0) return '#c4a050';
    if (band === 1) return '#f6e2a4';
    if (lhash(x, y, 121) > 0.96) return '#b08c44';
    return pick(lfbm(x, y, 122), ['#dab866', '#e2c070', '#e8c87a', '#eccf84']);
  },
  tundra: (x, y) => {
    if (lhash(x, y, 131) > 0.975) return '#dce4e8';
    if (lhash(x, y, 132) < 0.04) return '#a8964a';
    return pick(lfbm(x, y, 133), ['#76866a', '#808c6e', '#8a9476', '#949c7e']);
  },
  arctic: (x, y) => {
    if (Math.abs(lnoise(x, y, 8, 6, 141) - 0.5) < 0.03) return '#a4bcdc';
    return pick(lfbm(x, y, 142), ['#c4d6ec', '#d4e2f2', '#e2ecf8', '#f2f6fc']);
  },
  swamp: (x, y) => {
    const w = lnoise(x, y, 4, 3, 151);
    if (w > 0.6) return lhash(x, y, 152) > 0.9 ? '#7a9a88' : w > 0.68 ? '#2e4c40' : '#3a5a4a';
    return pick(lfbm(x, y, 153), ['#46562a', '#50602e', '#5a6834', '#647238']);
  },
  forest: (x, y) => pick(lfbm(x, y, 161), ['#1c461a', '#22521e', '#2a5e22', '#326a26']),
  jungle: (x, y) =>
    lhash(x, y, 171) > 0.92 ? '#5aaa38' : pick(lfbm(x, y, 172), ['#1c5a1e', '#226822', '#2a7626', '#32842a']),
  hills: (x, y) => pick(lfbm(x, y, 181), ['#6e7a34', '#76823a', '#7e8a40', '#869246']),
  mountains: (x, y) =>
    lhash(x, y, 191) > 0.93 ? '#6a6252' : pick(lfbm(x, y, 192), ['#78705e', '#827a66', '#8c846e', '#968e78']),
};

// The square pack's features, placed on the hex: each list keeps the square pack's drawings (`defs`), at places that
//  suit a hexagon. A feature near an edge reaches into that neighbour.
const sq = (name) => defs[name].features;
const Fx = (from, x, y, p) => ({ ...from, x, y, p: p ?? from.p });
const FEATURES = {
  grassland: [Fx(sq('grassland')[0], 8, 15), Fx(sq('grassland')[1], 23, 27)],
  plains: [Fx(sq('plains')[0], 24, 12)],
  desert: (([cactus, rock2, rock15, cactus2]) => [
    Fx(cactus, 22, 16),
    Fx(rock2, 10, 27),
    Fx(rock15, 9, 14),
    Fx(cactus2, 23, 29),
  ])(sq('desert')),
  tundra: (([a, b, c]) => [Fx(a, 9, 14), Fx(b, 22, 24), Fx(c, 15, 31)])(sq('tundra')),
  arctic: (([a, b]) => [Fx(a, 13, 16), Fx(b, 21, 29)])(sq('arctic')),
  swamp: (([a, b, c]) => [Fx(a, 8, 15), Fx(b, 22, 20), Fx(c, 14, 30)])(sq('swamp')),
  // Trees: most sit at or near an edge's middle and run on into a joined neighbour (and are kept out of an unjoined
  //  one), so an isolated forest keeps only the two wholly inside it.
  forest: (([c11, b45, b5, c10, b4, c9, b4b, c10b]) => [
    Fx(c11, 9, 17),
    Fx(b45, 22, 14),
    Fx(b5, 16, 27),
    Fx(c10, 27, 25),
    Fx(b4, 6, 31),
    Fx(c9, 21, 35),
    Fx(b4b, 0, 22),
    Fx(c10b, 8, 7),
  ])(sq('forest')),
  jungle: (([p10, f45, f5, p9, f35, f4, p9b]) => [
    Fx(p10, 9, 17),
    Fx(f45, 22, 15),
    Fx(f5, 16, 27),
    Fx(p9, 27, 28),
    Fx(f35, 6, 31),
    Fx(f4, 0, 22),
    Fx(p9b, 8, 8),
  ])(sq('jungle')),
  hills: (([big, left, top, s1, s2]) => [
    Fx(big, 16, 28),
    Fx(left, 0, 23),
    Fx(top, 24, 8),
    Fx(s1, 7, 16),
    Fx(s2, 26, 16),
  ])(sq('hills')),
  mountains: (([big, left, top, s1, s2]) => [
    Fx(big, 16, 27),
    Fx(left, 0, 24),
    Fx(top, 24, 9),
    Fx(s1, 7, 17),
    Fx(s2, 26, 16),
  ])(sq('mountains')),
};
const OUTLINES = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.outline ?? OUTLINE]));
const SEEDS = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.seed]));

// ---------- edges ----------
// Noise for something cut back from the edge `d` (a fringe, a fade), in [0, 1]: taken at the point of the edge beside
//  the pixel, which is the same point in the tile across that edge. Within 1px of a corner it is the noise at the corner
//  itself, blending into the edge's own over the next 2px, so where two neighbouring tiles both cut back from a third,
//  they meet at the same depth on their shared edge, with no notch. (Their pixels by the shared edge are all beside the
//  corner, or past it.)
//  (ns, nt) are the noise's cells per lattice step: the default's are about 2px along an edge, (4, 3)'s about 8px.
const edgeNoise = (x, y, d, seed, ns = 16, nt = 12) => {
  const { along, len } = edgeDist(x, y, d),
    [[ax, ay], [bx, by]] = EDGE[d],
    at = (a) => lnoise(ax + ((bx - ax) * a) / len - 0.5, ay + ((by - ay) * a) / len - 0.5, ns, nt, seed),
    end = along < len / 2 ? 0 : len,
    w = smoothstep(Math.max(0, Math.min(1, (Math.min(along, len - along) - 1) / 2)));
  return at(end) + (at(Math.max(0, Math.min(len, along))) - at(end)) * w;
};
// Where a terrain's ground is drawn: the hex, less a ragged fringe along every edge whose neighbour is not the same
//  terrain, where the land base shows through. The fringe (soft band included) is at most 8px deep, with broad,
//  rounded bites as well as small ragged ones, and where two unjoined edges meet, the terrain's corner is rounded off.
const ROUND = 4;
const coverage = (mask, seed) => {
  const c = new Array(W * H).fill(0);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      let v = 1;
      const past = {};
      for (const d of DIRS) {
        if (mask.includes(d)) continue;
        const { dist } = edgeDist(x, y, d),
          depth = 1.5 + edgeNoise(x, y, d, seed) * 2 + edgeNoise(x, y, d, seed + 9, 4, 3) * 3;
        past[d] = dist - depth;
        if (dist < depth) v = 0;
        else if (dist < depth + 1.5 && v) v = 2;
      }
      for (const [i, a] of DIRS.entries()) {
        const b = DIRS[(i + 1) % 6];
        if (
          v &&
          past[a] !== undefined &&
          past[b] !== undefined &&
          past[a] < ROUND &&
          past[b] < ROUND &&
          Math.hypot(ROUND - past[a], ROUND - past[b]) > ROUND
        )
          v = 0;
      }
      c[y * W + x] = v === 2 ? (lhash(x, y, seed + 3) < 0.5 ? 0 : 2) : v;
    }
  return c;
};

// ---------- overlay ----------
// A terrain sprite for `mask`: its ground where the coverage is, and its features. Every tile places its features in
//  the same places, so a feature that reaches into a neighbour is drawn by both, each its own part: it is kept only
//  when it reaches that one neighbour alone and the neighbour is joined. One wholly inside the hex is left out of some
//  join variants, for variety.
const overlay = (name) => {
  const seed = SEEDS[name],
    ground = GROUND[name],
    features = FEATURES[name] ?? [],
    // A canvas three tiles across and down, this tile's box in the middle.
    BX = W,
    BY = H,
    layers = [];
  for (const [id, f] of features.entries())
    for (const from of ['', ...DIRS]) {
      const [ox, oy] = from ? OFFSET[from] : [0, 0],
        l = new Spr(W * 3, H * 3);
      f.draw(l, f.x + ox + BX, f.y + oy + BY);
      l.outline(OUTLINES[name]);
      const touched = new Set();
      let far = false;
      l.p.forEach((c, i) => {
        if (!c) return;
        const t = whose((i % l.w) - BX, Math.floor(i / l.w) - BY);
        if (t === null) far = true;
        else touched.add(t);
      });
      if (far || !touched.has('') || touched.size > 2) continue;
      layers.push({ l, id, ay: f.y + oy, ax: f.x + ox, p: f.p, into: [...touched].find((t) => t !== '') ?? null });
    }
  layers.sort((a, b) => a.ay - b.ay || a.ax - b.ax);

  return (mask) => {
    const cov = coverage(mask, seed),
      out = new Spr(W, H),
      mi = DIRS.reduce((m, d, i) => (mask.includes(d) ? m | (1 << i) : m), 0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cov[y * W + x]) out.set(x, y, ground(x, y) ?? null);
    const big = new Spr(W * 3, H * 3);
    for (const { l, id, p, into } of layers) {
      if (into === null ? hash(mi, id, seed + 1) >= p : !mask.includes(into)) continue;
      big.over(l);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (owns(x, y)) out.set(x, y, big.get(x + BX, y + BY));
    return out;
  };
};

const sprites = {};
for (const name of Object.keys(GROUND)) {
  const draw = overlay(name);
  for (const m of MASKS) sprites[m.length ? `terrain/${name}_${named(m)}` : `terrain/${name}`] = draw(m);
}

// ---------- bases ----------
const base = (fn) => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (owns(x, y)) t.set(x, y, fn(x, y));
  return t;
};
const OCEAN = ['#22408c', '#28489a', '#2e50a6', '#3458b0'];
// Short wave crests, each in its own 8 × 9 cell of the lattice's fundamental tile.
const ocean = (x, y) => {
  const [xr, yr] = canon(x, y),
    cx = Math.floor(xr / 8),
    cy = Math.floor(yr / 9);
  if (hash(cx, cy, 40) > 0.4) {
    const len = 3 + Math.floor(hash(cx, cy, 43) * 3),
      lx = xr - cx * 8 - Math.floor(hash(cx, cy, 41) * 3),
      ly = yr - cy * 9 - 2 - Math.floor(hash(cx, cy, 42) * 4);
    if (ly === -1 && lx === Math.floor(len / 2)) return '#c8dcf8';
    if (ly === 0 && lx >= 0 && lx < len) return lx === 0 || lx === len - 1 ? '#6a90d8' : '#a8c4f0';
    if (ly === 1 && lx >= 1 && lx < len + 1) return '#1c3478';
  }
  return pick(lfbm(x, y, 3), OCEAN);
};
sprites['terrain/land'] = base(land);
sprites['terrain/ocean'] = base(ocean);

// ---------- rivers ----------
// A channel from the middle to the middle of each joined edge, where the neighbour's channel carries on.
const WATER = ['#3c6cc4', '#4a7ad0', '#5888da'],
  BANK = '#8c7a48';
const river = (mask) => {
  const water = new Spr(W, H);
  const brush = (x, y, r) => water.ellipse(x, y, r, r, '#000001');
  brush(CENTRE[0], CENTRE[1], mask.length ? 3.6 : 4.6);
  for (const d of mask) {
    const [ex, ey] = MID[d],
      // Past the edge, so the channel is full width where it crosses.
      fx = ex + (ex - CENTRE[0]) * 0.15,
      fy = ey + (ey - CENTRE[1]) * 0.15,
      nx = -(fy - CENTRE[1]),
      ny = fx - CENTRE[0],
      nl = Math.hypot(nx, ny);
    for (let i = 0; i <= 40; i++) {
      const t = i / 40,
        // Bends one way and back, and is straight at both ends, so it meets the neighbour's square on.
        wob = Math.sin(t * Math.PI) * 2.2 * (DIRS.indexOf(d) % 2 ? 1 : -1) * (1 - t);
      brush(
        CENTRE[0] + (fx - CENTRE[0]) * t + (nx / nl) * wob,
        CENTRE[1] + (fy - CENTRE[1]) * t + (ny / nl) * wob,
        2.8
      );
    }
  }
  const out = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      if (water.get(x, y)) {
        const edge = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => water.in(x + dx, y + dy) && !water.get(x + dx, y + dy));
        out.set(x, y, edge ? '#2c54a4' : glint(x, y, 201) ? '#a8c8f4' : pick(lnoise(x, y, 8, 6, 200), WATER));
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
        out.set(x, y, lhash(x, y, 202) > 0.5 ? BANK : '#6e6a34');
    }
  return out;
};
for (const m of MASKS) sprites[m.length ? `terrain/river_${named(m)}` : 'terrain/river'] = river(m);

// ---------- coast ----------
// The coast in six wedges, one at each edge, from the middle of the hex out to that edge. Each is picked by the three
//  neighbours whose shore can reach it: the one beyond its edge and the two either side, `1` for land, in clockwise
//  order. The wedge draws sand, wet sand, a foam line and a band of shallow water inside every edge with land beyond,
//  on its own part of the hex alone, so the six put together make one shore.
const wedge = (x, y) => {
  let best = null,
    min = Infinity;
  for (const d of DIRS) {
    const { dist } = edgeDist(x, y, d);
    if (dist < min) {
      min = dist;
      best = d;
    }
  }
  return best;
};
const around = (d) => {
  const i = DIRS.indexOf(d);
  return [DIRS[(i + 5) % 6], d, DIRS[(i + 1) % 6]];
};
const coastWedge = (d, bits) => {
  const t = new Spr(W, H),
    land = around(d).filter((_, i) => bits[i] === '1');
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y) || wedge(x, y) !== d) continue;
      // A smooth minimum, so where two shores meet in a bay the beach curves round; and a broad swell as well as a fine
      //  one, so the beach widens and narrows along the shore.
      const dist = land.length
          ? -2 * Math.log(land.reduce((s, e) => s + Math.exp(-edgeDist(x, y, e).dist / 2), 0))
          : 99,
        n = lnoise(x, y, 8, 6, 60) * 1 + lnoise(x, y, 2, 2, 64) * 2.4 - 0.6;
      if (dist < 1.2 + n) t.set(x, y, lhash(x, y, 61) > 0.85 ? '#c8b06a' : '#e4d090');
      else if (dist < 2.2 + n) t.set(x, y, '#b8a46a');
      else if (dist < 3.2 + n) t.set(x, y, lhash(x, y, 62) > 0.45 ? '#e8f0fc' : '#7ea4e0');
      else if (dist < 6.5 + n * 1.5)
        t.set(x, y, dither(x, y) >= 0.5 && dist > 5 + n ? null : lhash(x, y, 63) > 0.92 ? '#8cb0e8' : '#3e74c4');
    }
  return t;
};
for (const d of DIRS)
  for (let b = 0; b < 8; b++) {
    const bits = [0, 1, 2].map((i) => ((b >> i) & 1 ? '1' : '0')).join('');
    sprites[`terrain/coast_${d}_${bits}`] = coastWedge(d, bits);
  }

// The river's own channel carrying on from an edge into the sea: in its colours and at its width where it crosses the
//  edge, widening as it goes, then fading into the sea's water through the dither, with a little wet sand at the shore.
const riverMouth = (d) => {
  const t = new Spr(W, H),
    [mx, my] = MID[d],
    ax = CENTRE[0] - mx,
    ay = CENTRE[1] - my,
    al = Math.hypot(ax, ay);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const px = x + 0.5 - mx,
        py = y + 0.5 - my,
        along = (px * ax + py * ay) / al,
        across = Math.abs(px * ay - py * ax) / al,
        w =
          2.8 +
          Math.max(0, along - 2) * 0.35 +
          (lnoise(x, y, 8, 6, 70) - 0.5) * 1.4 * Math.min(1, Math.max(0, along) / 3),
        fade = (along - 4) / 8;
      if (along < -1 || across > w + 1.5) continue;
      if (across > w) {
        if (along < 3) t.set(x, y, lhash(x, y, 72) > 0.5 ? '#b8a46a' : BANK);
        continue;
      }
      if (fade > 0 && dither(x, y) < fade) continue;
      t.set(
        x,
        y,
        across > w - 1 && along < 4
          ? '#2c54a4'
          : glint(x, y, 71)
          ? '#a8c8f4'
          : fade > 0.4
          ? '#3e74c4'
          : pick(lnoise(x, y, 8, 6, 200), WATER)
      );
    }
  return t;
};
for (const d of DIRS) sprites[`terrain/river_mouth_${d}`] = riverMouth(d);

module.exports = {
  W,
  H,
  ROW,
  DIRS,
  MASKS,
  OFFSET,
  MID,
  CENTRE,
  named,
  owns,
  whose,
  edgeDist,
  edgeNoise,
  around,
  lnoise,
  lhash,
  lfbm,
  canon,
  dither,
  glint,
  pick,
  sprites,
};

// The isometric pack's tile-shaped terrain: diamonds 64 × 32, in rows 16px apart with every odd row shifted 32px
//  across, as civ.one's staggered isometric grid (`staggered-iso`) draws them. See SPEC-ISO.md. It follows `hex.js`:
//  only the geometry and the lattice's periods differ.
//
// Every sprite owns exactly the pixels `IsoProjection.pixelToTile` gives its tile (`owns`), and textures repeat on the
//  grid's lattice (every 64px across, every 16px down with a 32px shift), so tiles meet with no seam on any edge.
const { OUTLINE, Spr, hash } = require('./lib');
const { defs, keepInside, variantsOf } = require('./terrain');

const W = 64,
  H = 32,
  ROW = 16;

// ---------- geometry ----------
// `IsoProjection.pixelToTile`, for tiles W × H with tile (0, 0)'s box at the origin.
const tileOf = (px, py) => {
  const across = (2 * px + 1) * H,
    down = (2 * py + 1) * W,
    area = W * H,
    unit = 2 * area,
    a = Math.floor((across + down - area) / unit),
    b = Math.floor((down - across + area) / unit);
  return [Math.floor((a - b) / 2), a + b];
};
const owns = (x, y) => {
  const [c, r] = tileOf(x, y);
  return c === 0 && r === 0;
};

// The four neighbours sharing an edge, in the engine's order (`StaggeredIsoTopology.edgeDirections`), and where each
//  one's box is from an even row's.
const DIRS = ['ne', 'se', 'sw', 'nw'];
const OFFSET = { ne: [32, -ROW], se: [32, ROW], sw: [-32, ROW], nw: [-32, -ROW] };
// Which tile, of this one (`''`) and its four edge neighbours, a pixel in this tile's coordinates is in; null for a
//  corner neighbour (n, e, s, w) or further.
const whose = (x, y) => {
  const [c, r] = tileOf(x, y);
  if (c === 0 && r === 0) return '';
  const bx = c * W + (r & 1) * (W / 2),
    by = r * ROW;
  return DIRS.find((d) => OFFSET[d][0] === bx && OFFSET[d][1] === by) ?? null;
};

const V = { n: [32, 0], e: [64, 16], s: [32, 32], w: [0, 16] };
const EDGE = { ne: [V.n, V.e], se: [V.e, V.s], sw: [V.s, V.w], nw: [V.w, V.n] };
const edgeDist = (x, y, d) => {
  const [[ax, ay], [bx, by]] = EDGE[d],
    len = Math.hypot(bx - ax, by - ay),
    ux = (bx - ax) / len,
    uy = (by - ay) / len,
    px = x + 0.5 - ax,
    py = y + 0.5 - ay;
  return { dist: -px * uy + py * ux, along: px * ux + py * uy, len };
};

const MASKS = [...Array(16).keys()].map((m) => DIRS.filter((d, i) => m & (1 << i)));
const named = (mask) => mask.join('-');

// ---------- lattice-periodic noise ----------
// (s, t) step by whole numbers between neighbours: se is (0, 1), ne (1, -1).
const lattice = (x, y) => [x / W - y / (2 * ROW), y / ROW];
const smoothstep = (t) => t * t * (3 - 2 * t);
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
// A pixel's place in the lattice's fundamental tile: 64 across, 16 down.
const canon = (x, y) => {
  const k = Math.floor(y / ROW),
    yr = y - ROW * k,
    xr = (((x - 32 * k) % W) + W) % W;
  return [xr, yr];
};
const lhash = (x, y, seed) => {
  const [a, b] = canon(x, y);
  return hash(a, b, seed);
};
// Every period here is a power of two, so a 4 × 4 Bayer table (and even a 1px checker) fits the lattice.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y) => {
  const [xr, yr] = canon(x, y);
  return BAYER[(yr % 4) * 4 + (xr % 4)] / 16;
};
const glint = (x, y, seed) => {
  const [xr, yr] = canon(x, y),
    cx = Math.floor(xr / 4),
    cy = Math.floor(yr / 4);
  if (hash(cx, cy, seed) <= 0.65 || yr - cy * 4 !== Math.floor(hash(cx, cy, seed + 1) * 4)) return false;
  const lx = xr - cx * 4 - Math.floor(hash(cx, cy, seed + 2) * 3);
  return lx === 0 || lx === 1;
};
// Noise cells about 8px across, then 4px, and a speckle.
const lfbm = (x, y, seed) =>
  lnoise(x, y, 8, 2, seed) * 0.55 + lnoise(x, y, 16, 4, seed + 7) * 0.3 + lhash(x, y, seed + 13) * 0.15;
const pick = (n, cs) => cs[Math.max(0, Math.min(cs.length - 1, Math.floor(n * cs.length)))];

// ---------- grounds (the square pack's colours) ----------
const landColours = ['#4c8a2c', '#539230', '#5a9c33', '#62a437'];
const land = (x, y) =>
  lhash(x, y, 5) > 0.94 && lhash(x, y + 1, 5) < 0.7 ? '#3e7a24' : pick(lfbm(x, y, 1), landColours);
const strokes = (x, y, cw, ch, seed) => {
  const [xr, yr] = canon(x, y),
    cx = Math.floor(xr / cw),
    cy = Math.floor(yr / ch);
  return { on: hash(cx, cy, seed) > 0.4, lx: xr - cx * cw, ly: yr - cy * ch };
};
const GROUND = {
  grassland: (x, y) => {
    if (lhash(x, y, 102) > 0.988) return pick(lhash(x, y, 103), ['#f4e468', '#ffffff', '#ec7a96']);
    if (lnoise(x, y, 8, 2, 101) > 0.58)
      return lhash(x, y, 104) > 0.9 ? '#447e26' : pick(lnoise(x, y, 16, 4, 105), ['#6cb23c', '#74ba40', '#7cc246']);
    return null;
  },
  plains: (x, y) => {
    const { on, lx, ly } = strokes(x, y, 4, 4, 111);
    if (on && ly === 1 && lx < 3) return '#b0922c';
    if (on && ly === 0 && lx === 1) return '#eed678';
    return pick(lfbm(x, y, 112), ['#b0a43e', '#b8ac46', '#c2b44e', '#ccbc56']);
  },
  // Dune ripples 8px apart, so a row (16px) is two of them.
  desert: (x, y) => {
    const [s] = lattice(x + 0.5, y + 0.5),
      v = y + 2 * Math.sin(2 * Math.PI * s) + 1 * Math.sin(4 * Math.PI * s + 1),
      band = ((Math.floor(v) % 8) + 8) % 8;
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
    if (Math.abs(lnoise(x, y, 16, 4, 141) - 0.5) < 0.03) return '#a4bcdc';
    return pick(lfbm(x, y, 142), ['#c4d6ec', '#d4e2f2', '#e2ecf8', '#f2f6fc']);
  },
  swamp: (x, y) => {
    const w = lnoise(x, y, 8, 2, 151);
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

// The square pack's feature drawings, placed on the diamond. (x, base): a feature's foot. One at an edge's middle runs on
//  into that neighbour when it's joined. The diamond is 64 wide but only 32 tall, so a tile holds more, lower features.
const sq = (name) => defs[name].features;
const Fx = (from, x, y, p) => ({ ...from, x, y, p: p ?? from.p });
const FEATURES = {
  grassland: [Fx(sq('grassland')[0], 20, 14), Fx(sq('grassland')[1], 44, 22)],
  plains: [Fx(sq('plains')[0], 40, 12)],
  desert: (([cactus, rock2, rock15]) => [Fx(cactus, 40, 14), Fx(rock2, 22, 22), Fx(rock15, 30, 9)])(sq('desert')),
  tundra: (([a, b, c]) => [Fx(a, 20, 14), Fx(b, 42, 20), Fx(c, 30, 26)])(sq('tundra')),
  arctic: (([a, b]) => [Fx(a, 24, 14), Fx(b, 40, 24)])(sq('arctic')),
  swamp: (([a, b, c]) => [Fx(a, 18, 16), Fx(b, 42, 14), Fx(c, 32, 26)])(sq('swamp')),
  forest: (([c11, b45, b5, c10, b4, c9, b4b, c10b]) => [
    Fx(c11, 22, 16),
    Fx(b45, 40, 13),
    Fx(b5, 32, 26),
    Fx(c10, 48, 22),
    Fx(b4, 16, 22),
    Fx(c9, 47, 9),
    Fx(b4b, 17, 9),
    Fx(c10b, 32, 10),
  ])(sq('forest')),
  jungle: (([p10, f45, f5, p9, f35, f4, p9b]) => [
    Fx(p10, 22, 16),
    Fx(f45, 40, 13),
    Fx(f5, 32, 26),
    Fx(p9, 48, 23),
    Fx(f35, 16, 23),
    Fx(f4, 47, 9),
    Fx(p9b, 34, 12),
  ])(sq('jungle')),
  hills: (([big, left, top, s1, s2]) => [
    Fx(big, 32, 24),
    Fx(left, 16, 22),
    Fx(top, 48, 10),
    Fx(s1, 18, 11),
    Fx(s2, 47, 22),
  ])(sq('hills')),
  mountains: (([big, left, top, s1, s2]) => [
    Fx(big, 32, 24),
    Fx(left, 15, 23),
    Fx(top, 48, 10),
    Fx(s1, 18, 11, 1),
    Fx(s2, 49, 23),
  ])(sq('mountains')),
};
const OUTLINES = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.outline ?? OUTLINE]));
const SEEDS = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.seed]));

// ---------- edges ----------
// Noise along the edge `d`, sampled at the point of the edge a pixel is beside, so the tiles either side read the same
//  value there, and held at the corner's own near each end. (ns, nt) are the noise's cells per lattice step: the
//  default's are about 2px along an edge, (8, 2)'s about 8px, for broader swells.
const edgeNoise = (x, y, d, seed, ns = 32, nt = 8) => {
  const { along, len } = edgeDist(x, y, d),
    [[ax, ay], [bx, by]] = EDGE[d],
    at = (a) => lnoise(ax + ((bx - ax) * a) / len - 0.5, ay + ((by - ay) * a) / len - 0.5, ns, nt, seed),
    end = along < len / 2 ? 0 : len,
    w = smoothstep(Math.max(0, Math.min(1, (Math.min(along, len - along) - 1) / 2)));
  return at(end) + (at(Math.max(0, Math.min(len, along))) - at(end)) * w;
};
// The diamond less a ragged fringe along every unjoined edge. Its edges slope 1 in 2, so a fringe `dist` deep is about
//  twice that across: depths are kept shallower than the hex pack's. The fringe has broad, rounded bites as well as
//  small ragged ones, and where two unjoined edges meet, the terrain's corner is rounded off.
const ROUND = 3.5;
const CORNER_EDGES = [
  ['nw', 'ne'],
  ['ne', 'se'],
  ['se', 'sw'],
  ['sw', 'nw'],
];
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
          depth = 1 + edgeNoise(x, y, d, seed) * 1.6 + edgeNoise(x, y, d, seed + 9, 8, 2) * 3.2;
        past[d] = dist - depth;
        if (dist < depth) v = 0;
        else if (dist < depth + 1.2 && v) v = 2;
      }
      for (const [a, b] of CORNER_EDGES)
        if (
          v &&
          past[a] !== undefined &&
          past[b] !== undefined &&
          past[a] < ROUND &&
          past[b] < ROUND &&
          Math.hypot(ROUND - past[a], ROUND - past[b]) > ROUND
        )
          v = 0;
      c[y * W + x] = v === 2 ? (lhash(x, y, seed + 3) < 0.5 ? 0 : 2) : v;
    }
  return c;
};

// ---------- overlay ----------
const overlay = (name) => {
  const seed = SEEDS[name],
    ground = GROUND[name],
    features = FEATURES[name] ?? [],
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
  return (mask, variant = 0) => {
    const cov = coverage(mask, seed),
      out = new Spr(W, H),
      mi = DIRS.reduce((m, d, i) => (mask.includes(d) ? m | (1 << i) : m), 0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cov[y * W + x]) out.set(x, y, ground(x, y) ?? null);
    const big = new Spr(W * 3, H * 3);
    for (const { l, id, p, into } of layers) {
      if (into === null ? !keepInside(variant, mi, id, seed, p) : !mask.includes(into)) continue;
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
  variantsOf(draw, MASKS[MASKS.length - 1]).forEach((v, i) => (sprites[`terrain/${name}_v${i + 1}`] = v));
}

// ---------- bases ----------
const base = (fn) => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (owns(x, y)) t.set(x, y, fn(x, y));
  return t;
};
const OCEAN = ['#22408c', '#28489a', '#2e50a6', '#3458b0'];
// Short wave crests, each in its own 8 × 8 cell of the lattice's fundamental tile.
const ocean = (x, y) => {
  const [xr, yr] = canon(x, y),
    cx = Math.floor(xr / 8),
    cy = Math.floor(yr / 8);
  if (hash(cx, cy, 40) > 0.4) {
    const len = 3 + Math.floor(hash(cx, cy, 43) * 3),
      lx = xr - cx * 8 - Math.floor(hash(cx, cy, 41) * 3),
      ly = yr - cy * 8 - 2 - Math.floor(hash(cx, cy, 42) * 4);
    if (ly === -1 && lx === Math.floor(len / 2)) return '#c8dcf8';
    if (ly === 0 && lx >= 0 && lx < len) return lx === 0 || lx === len - 1 ? '#6a90d8' : '#a8c4f0';
    if (ly === 1 && lx >= 1 && lx < len + 1) return '#1c3478';
  }
  return pick(lfbm(x, y, 3), OCEAN);
};
sprites['terrain/land'] = base(land);
sprites['terrain/ocean'] = base(ocean);

// The middle of the diamond, of each edge (where a road or a river crosses into that neighbour) and its corners (where
//  a road crosses into a corner neighbour).
const CENTRE = [32, 16];
const MID = Object.fromEntries(DIRS.map((d) => [d, EDGE[d][0].map((v, i) => (v + EDGE[d][1][i]) / 2)]));
const ALL = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const TOWARDS = { ...MID, ...V };

// ---------- rivers ----------
// A channel from the middle to the middle of each joined edge, where the neighbour's carries on.
const WATER = ['#3c6cc4', '#4a7ad0', '#5888da'],
  BANK = '#8c7a48',
  NEXT = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  AROUND = [...NEXT, [1, 1], [-1, -1], [1, -1], [-1, 1]];
const river = (mask) => {
  const water = new Spr(W, H);
  const brush = (x, y, r) => water.ellipse(x, y, r, r * 0.75, '#000001');
  brush(CENTRE[0], CENTRE[1], mask.length ? 3.8 : 5);
  for (const d of mask) {
    const [ex, ey] = MID[d],
      // Past the edge, so the channel is full width where it crosses.
      fx = ex + (ex - CENTRE[0]) * 0.15,
      fy = ey + (ey - CENTRE[1]) * 0.15,
      nx = -(fy - CENTRE[1]),
      ny = fx - CENTRE[0],
      nl = Math.hypot(nx, ny);
    for (let i = 0; i <= 48; i++) {
      const t = i / 48,
        // Bends one way and back, and is straight at both ends, so it meets the neighbour's square on.
        wob = Math.sin(t * Math.PI) * 2.4 * (DIRS.indexOf(d) % 2 ? 1 : -1) * (1 - t);
      brush(CENTRE[0] + (fx - CENTRE[0]) * t + (nx / nl) * wob, CENTRE[1] + (fy - CENTRE[1]) * t + (ny / nl) * wob, 3);
    }
  }
  const out = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      if (water.get(x, y)) {
        const edge = NEXT.some(([dx, dy]) => water.in(x + dx, y + dy) && !water.get(x + dx, y + dy));
        out.set(x, y, edge ? '#2c54a4' : glint(x, y, 201) ? '#a8c8f4' : pick(lnoise(x, y, 16, 4, 200), WATER));
      } else if (AROUND.some(([dx, dy]) => water.get(x + dx, y + dy)))
        out.set(x, y, lhash(x, y, 202) > 0.5 ? BANK : '#6e6a34');
    }
  return out;
};
for (const m of MASKS) sprites[m.length ? `terrain/river_${named(m)}` : 'terrain/river'] = river(m);

// ---------- coast ----------
// The coast in four quarters, each a half-size diamond at one of the diamond's corners, which put together are the
//  whole diamond. Each is picked by the three neighbours that touch its corner: the two across the edges either side and
//  the one beyond the corner itself, `1` for land, in the order `CORNERS` gives. A quarter draws sand, wet sand, a
//  foam line and a band of shallow water in from every edge (or corner) with land beyond, on its own pixels alone.
const QUARTER = { n: [32, 8], e: [48, 16], s: [32, 24], w: [16, 16] };
const CORNERS = { n: ['nw', 'n', 'ne'], e: ['ne', 'e', 'se'], s: ['se', 's', 'sw'], w: ['sw', 'w', 'nw'] };
const quarterOf = (x, y) => {
  let best = null,
    min = Infinity;
  for (const [q, [cx, cy]] of Object.entries(QUARTER)) {
    const d = Math.abs(x + 0.5 - cx) / 16 + Math.abs(y + 0.5 - cy) / 8;
    if (d < min) {
      min = d;
      best = q;
    }
  }
  return best;
};
// How far a pixel is in from the neighbour `d`: from its edge for an edge neighbour, and for a corner neighbour from
//  its corner, measured as an edge's distance is, so a corner's shore is a small diamond cap.
const shoreDist = (x, y, d) => {
  if (DIRS.includes(d)) return edgeDist(x, y, d).dist;
  const [vx, vy] = V[d];
  return (Math.abs(x + 0.5 - vx) / 2 + Math.abs(y + 0.5 - vy)) / Math.sqrt(1.25);
};
const coastQuarter = (q, bits) => {
  const t = new Spr(W, H),
    land = CORNERS[q].filter((_, i) => bits[i] === '1');
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y) || quarterOf(x, y) !== q) continue;
      // A smooth minimum of the edges' shores, so where two meet in a bay the beach curves round rather than meeting in
      //  a point; a corner's own shore by the plain minimum, so a straight shore doesn't thicken at every corner. And a
      //  broad swell as well as a fine one, so the beach widens and narrows along the shore.
      const edges = land.filter((e) => DIRS.includes(e)),
        dist = Math.min(
          edges.length ? -2 * Math.log(edges.reduce((s, e) => s + Math.exp(-shoreDist(x, y, e) / 2), 0)) : 99,
          ...land.filter((e) => !DIRS.includes(e)).map((e) => shoreDist(x, y, e))
        ),
        n = lnoise(x, y, 16, 4, 60) * 0.9 + lnoise(x, y, 4, 1, 64) * 2.2 - 0.6;
      if (dist < 1 + n) t.set(x, y, lhash(x, y, 61) > 0.85 ? '#c8b06a' : '#e4d090');
      else if (dist < 1.8 + n) t.set(x, y, '#b8a46a');
      else if (dist < 2.6 + n) t.set(x, y, lhash(x, y, 62) > 0.45 ? '#e8f0fc' : '#7ea4e0');
      else if (dist < 5 + n * 1.3)
        t.set(x, y, dither(x, y) >= 0.5 && dist > 4 + n ? null : lhash(x, y, 63) > 0.92 ? '#8cb0e8' : '#3e74c4');
    }
  return t;
};
for (const q of Object.keys(QUARTER))
  for (let b = 0; b < 8; b++) {
    const bits = [0, 1, 2].map((i) => ((b >> i) & 1 ? '1' : '0')).join('');
    sprites[`terrain/coast_${q}_${bits}`] = coastQuarter(q, bits);
  }

// The river's own channel carrying on from an edge into the sea: in its colours and at its width where it crosses the
//  edge, widening as it goes, then fading into the sea's water through the dither, with a little wet sand at the shore.
const riverMouth = (d) => {
  const t = new Spr(W, H),
    [mx, my] = MID[d],
    // Measured with heights stretched by 4/3, as the river's brush is 3/4 as tall as it is wide, axis and pixel alike.
    ax = CENTRE[0] - mx,
    ay = (CENTRE[1] - my) * (4 / 3),
    al = Math.hypot(ax, ay);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const px = x + 0.5 - mx,
        py = (y + 0.5 - my) * (4 / 3),
        along = (px * ax + py * ay) / al,
        across = Math.abs(px * ay - py * ax) / al,
        w =
          3 +
          Math.max(0, along - 2) * 0.35 +
          (lnoise(x, y, 16, 4, 70) - 0.5) * 1.6 * Math.min(1, Math.max(0, along) / 3),
        fade = (along - 5) / 9;
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
          : pick(lnoise(x, y, 16, 4, 200), WATER)
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
  ALL,
  MASKS,
  OFFSET,
  MID,
  V,
  TOWARDS,
  CENTRE,
  CORNERS,
  named,
  owns,
  whose,
  edgeDist,
  edgeNoise,
  lnoise,
  lhash,
  lfbm,
  canon,
  dither,
  glint,
  pick,
  sprites,
};

// The isometric pack's other sprites: improvements, roads, fog, specials, the hut and fort, the walls, the city, units
//  standing on a badge in the player's colour, and the interface, which is the square pack's own. See SPEC-ISO.md.
//
// Sprites on the map's tiles are the tile's size, 64 × 32, and keep to the diamond's pixels. Units, the city and the
//  walls are 64 × 48: the tile's diamond is their bottom 32 rows, and they reach 16px above it (`TALL`), as the
//  descriptor's anchors and overhang say.
const { KEY_L, KEY_B, R, Spr } = require('./lib');
const { specials, imp } = require('./terrain');
const misc = require('./misc');
const { flavours } = require('./flavour');
const units = require('./units');
const combat = require('./combat');
const {
  W,
  H,
  DIRS,
  ALL,
  TOWARDS,
  CENTRE,
  owns,
  edgeDist,
  edgeNoise,
  lhash,
  lnoise,
  dither,
  sprites: terrain,
} = require('./iso');

const TALL = 16,
  TH = H + TALL;

// A square-pack sprite moved by (dx, dy) onto a tile-sized canvas, keeping only the pixels the diamond owns.
const onIso = (s, dx = 0, dy = 0) => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (owns(x, y)) t.set(x, y, s.get(x - dx, y - dy));
  return t;
};
// How far a pixel's centre is inside the diamond: the nearest edge's distance.
const inside = (x, y) => Math.min(...DIRS.map((d) => edgeDist(x, y, d).dist));
// The same in a tall sprite's coordinates, where the diamond is the bottom 32 rows; -1 outside it.
const insideTall = (x, y) => (y >= TALL && owns(x, y - TALL) ? inside(x, y - TALL) : -1);

const out = { ...terrain };

// ---------- specials ----------
// The square pack's, moved from its lower right to the diamond's middle, a little right of centre.
for (const [k, s] of Object.entries(specials)) out[`terrain/${k}`] = k === 'shield' ? s : onIso(s, 16, -5);
// Flavour, left of the diamond's middle, clear of the special on its right.
for (const [k, s] of Object.entries(flavours)) out[`terrain/${k}`] = onIso(s, 10, 0);

// ---------- improvements ----------
// Irrigation: water channels between earth ridges running down to the right, inside an earth border 3px in.
out['improvements/irrigation'] = (() => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y),
        k = (((x - 2 * y) % 10) + 10) % 10;
      if (d >= 3 && d < 4) t.set(x, y, '#6a5a2a');
      else if (d >= 4) {
        if (k === 0 || k === 1) t.set(x, y, k === 0 && (x + y) % 4 === 0 ? '#5a90e0' : '#3a6ec0');
        else if (k === 2) t.set(x, y, '#6a5a2a');
      }
    }
  return t;
})();
out['improvements/mine'] = onIso(imp.mine, 16, -6);
out['improvements/pollution'] = onIso(imp.pollution, 16, -1);

const BEND = {
  n: [0.1, 0.06],
  ne: [0.22, -0.05],
  e: [-0.08, 0.05],
  se: [-0.06, 0.07],
  s: [0.14, -0.06],
  sw: [-0.24, 0.04],
  w: [0.12, -0.05],
  nw: [0.18, 0.06],
};
// Roads and railroads: from the middle of the diamond to the middle of each edge, or to each corner, where the
//  neighbour's carries on. A railroad's sleepers are every 4px counted back from the far end, so both tiles' line up.
//  Toward the e and w corners the diamond pinches to a point (no tile owns its very tip), so the rails close in with
//  it, staying a pixel inside, and meet the neighbour's at the corner.
for (const d of ALL) {
  const [mx, my] = TOWARDS[d],
    [cx, cy] = CENTRE,
    len = Math.hypot(mx - cx, my - cy),
    ux = (mx - cx) / len,
    uy = (my - cy) / len,
    road = new Spr(W, H),
    rail = new Spr(W, H),
    steps = Math.ceil(len) + 2;
  // The track's width and edges wander by noise on the lattice, read where each step of it is, so a neighbour's road
  //  meets it at the same width; darker ruts run either side of the middle, with the odd stone.
  // The lane bends to one side and back as it goes, coming in square on at the edge, where the neighbour's carries on.
  //  Each direction bends its own way and by its own amount, with a smaller wiggle on top (`BEND`), so a run
  //  through a tile is a gentle S, a C or nearly straight, and a long road wanders like a lane.
  const lane = (s) => {
      const t = Math.min(1, s / len),
        [big, small] = BEND[d],
        o = len * (big * Math.sin(Math.PI * t) + small * Math.sin(2 * Math.PI * t)) * (1 - t);
      return [cx + ux * s - uy * o, cy + uy * s + ux * o];
    },
    wide = (x, y) => 0.6 + lnoise(x, y, 8, 2, 95) * 0.6 + lnoise(x, y, 32, 8, 97) * 0.3;
  for (let i = 0; i <= steps * 2; i++) {
    const [x, y] = lane(i / 2),
      k = wide(x, y);
    road.ellipse(x, y, 2.6 * k, 1.8 * k, '#8a6a3c');
  }
  for (let i = 0; i <= steps * 2; i++) {
    const [x, y] = lane(i / 2),
      k = wide(x, y);
    road.ellipse(x, y, 1.6 * k, 1 * k, '#b89460');
  }
  for (let i = 0; i <= steps * 2; i++) {
    // Either side of the lane as it bends, not of the straight line.
    const [x, y] = lane(i / 2),
      [ax, ay] = lane(i / 2 + 0.5),
      [bx, by] = lane(i / 2 - 0.5),
      tl = Math.hypot(ax - bx, ay - by) || 1,
      [tx, ty] = [(ax - bx) / tl, (ay - by) / tl];
    for (const side of [-1, 1]) {
      const rx = x - ty * side * 1.2,
        ry = y + tx * side * 0.7;
      if (lhash(Math.floor(rx), Math.floor(ry), 91) > 0.4) road.set(rx, ry, '#8e6e42');
    }
    if (lhash(Math.floor(x), Math.floor(y), 90) > 0.93) road.set(x, y, '#d8c49a');
  }
  for (let i = 0; i <= steps * 2; i++) {
    const back = len - i / 2;
    if (Math.round(back) % 4 === 2 && Math.abs(back - Math.round(back)) < 0.26)
      for (let k = -3; k <= 3; k++) rail.set(cx + ux * (i / 2) - uy * k, cy + uy * (i / 2) + ux * k, R.wood.m);
  }
  for (let i = 0; i <= steps * 2; i++) {
    const x = cx + (ux * i) / 2,
      y = cy + (uy * i) / 2,
      gauge = Math.max(0, Math.min(2, inside(x - 0.5, y - 0.5) - 1));
    for (const k of [-gauge, gauge]) rail.set(x - uy * k, y + ux * k, '#c4ccd4');
  }
  out[`improvements/road_${d}`] = onIso(road);
  out[`improvements/railroad_${d}`] = onIso(rail);
}

// ---------- fog ----------
// A black ordered-dither fade in from each edge, about 5–9px deep.
for (const d of DIRS) {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const { dist } = edgeDist(x, y, d),
        depth = 5 + edgeNoise(x, y, d, 80) * 4;
      if (dither(x, y) < 1 - dist / depth) t.set(x, y, '#000000');
    }
  out[`map/fog_${d}`] = t;
}

// ---------- hut, fort ----------
out['map/hut'] = onIso(misc['map/hut'](), 16, -3);
// Fort: an earth bank with a stake palisade just inside the diamond's edge, a gate at the front corner; open inside.
out['map/fort'] = (() => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y),
        gate = y > 24 && Math.abs(x + 0.5 - 32) < 4.5;
      if (gate) {
        if (d < 3.5 && (x === 28 || x === 35)) t.set(x, y, R.wood.d);
        continue;
      }
      if (d < 1.5) t.set(x, y, lhash(x, y, 300) > 0.5 ? '#8a6a3c' : '#7a5a30');
      else if (d < 3) t.set(x, y, (x + y) % 2 ? R.wood.m : R.wood.l);
      else if (d < 4) t.set(x, y, R.wood.d);
    }
  return t;
})();
// The fortified wall, over a fortified unit: a crenellated stone wall about 4px thick inside the diamond's two front
//  edges, on a unit's tall canvas. It is drawn over the unit, so it runs in front of the figure alone, and stops 3px
//  short of the back edges, so a stack's copy, drawn 2px up and left, stays inside the diamond.
const frontWall = (x, y, from = 0.5) => {
  const ty = y - TALL,
    d = Math.min(edgeDist(x, ty, 'se').dist, edgeDist(x, ty, 'sw').dist),
    back = Math.min(edgeDist(x, ty, 'ne').dist, edgeDist(x, ty, 'nw').dist);
  return y >= TALL && owns(x, ty) && back >= 3 && d >= from && d < from + 4 ? d - from + 0.5 : -1;
};
out['map/fortify'] = (() => {
  const t = new Spr(W, TH);
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < W; x++) {
      const d = frontWall(x, y);
      if (d < 0) continue;
      // Merlons on the outer half, every few pixels round.
      if (d < 1.8 && Math.floor(Math.atan2((y - TALL + 0.5 - 16) * 2, x + 0.5 - 32) * 10) % 2 === 0) continue;
      t.set(x, y, d < 1.8 ? R.stone.l : d > 3.6 ? R.stone.d : R.stone.m);
    }
  return t;
})();

// ---------- city ----------
// In the square pack's style and with its buildings, on a tall canvas: a temple at the back with a keep and houses
//  round it, and the middle and front left open for the size number. It has no walls of its own, so a walled city
//  (`map/walls`) looks it. The owner's rim (`map/city_rim`) runs round the diamond's edge and behind the buildings that
//  rise over it.
out['map/city'] = (() => {
  const s = new Spr(W, TH),
    Y = TALL;
  const house = (x, y, w, wallH, roof, lit = R.plaster) => {
    const rh = Math.ceil(w / 2) - 1,
      b = new Spr(W, TH);
    b.rect(x, y + rh, w, wallH, lit.m).bevel(lit);
    b.poly(
      [
        [x - 1, y + rh + 0.5],
        [x + w / 2, y - 0.5],
        [x + w + 1, y + rh + 0.5],
      ],
      roof.m
    );
    for (let j = y; j <= y + rh; j++)
      for (let i = x - 1; i <= x + w; i++) if (b.get(i, j) === roof.m && i < x + w / 2 - 0.5) b.set(i, j, roof.l);
    b.rect(x - 1, y + rh, w + 2, 1, roof.d);
    b.rect(x + 1, y + rh + wallH - 2, 1, 2, R.wood.d);
    if (w >= 6) b.rect(x + w - 3, y + rh + 1, 2, 1, R.dark.m);
    b.outline();
    s.over(b);
  };
  const tower = (x, y, w, h) => {
    const t = new Spr(W, TH);
    t.rect(x, y + 1, w, h - 1, R.stone.m).bevel(R.stone);
    for (let i = x; i < x + w; i += 2) t.set(i, y, R.stone.l);
    t.set(x + Math.floor(w / 2), y + 3, R.dark.d).set(x + Math.floor(w / 2), y + 4, R.dark.d);
    t.outline();
    s.over(t);
  };
  // Houses at the back, either side of the temple.
  house(17, Y - 1, 7, 4, R.roof2);
  house(41, Y - 2, 6, 4, R.roof);
  // The temple, at the back corner.
  const t = new Spr(W, TH);
  t.poly(
    [
      [25, Y - 4.5],
      [32, Y - 10.5],
      [39, Y - 4.5],
    ],
    R.stone.l
  );
  t.rect(25, Y - 5, 14, 1, R.stone.d);
  t.rect(26, Y - 4, 12, 7, R.stone.m);
  for (let x = 26; x <= 37; x += 3) t.rect(x, Y - 4, 1, 7, R.white.h);
  t.rect(25, Y + 3, 14, 2, R.stone.d).rect(25, Y + 3, 14, 1, R.stone.l);
  t.set(32, Y - 8, R.stone.h);
  t.outline();
  s.over(t);
  // A keep behind the right-hand houses, and houses down either side.
  tower(48, Y + 1, 5, 9);
  house(9, Y + 7, 6, 4, R.roof);
  house(49, Y + 9, 6, 4, R.roof2);
  // Shadows cast down and right onto open ground.
  const sh = new Spr(W, TH);
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < W; x++)
      if (!s.get(x, y) && s.get(x - 1, y - 1) && insideTall(x, y) >= 2.5) sh.set(x, y, '#2a2620');
  s.over(sh);
  return s;
})();
// The rim, in the player's key colours, round the diamond's edge: left out where a building stands over it.
out['map/city_rim'] = (() => {
  const t = new Spr(W, TH),
    city = out['map/city'];
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < W; x++) {
      const d = insideTall(x, y);
      if (d < 0 || city.get(x, y)) continue;
      if (d < 1) t.set(x, y, KEY_B);
      else if (d < 2.5) t.set(x, y, KEY_L);
    }
  return t;
})();

// A walled city's walls: tile-sized (the game draws them in the tile, over the city and under its rim), a crenellated
//  stone wall all round just inside the rim, with a gatehouse at the front corner, and left out wherever a building
//  stands over it, so it runs behind the buildings as the rim does.
out['map/walls'] = (() => {
  const t = new Spr(W, H),
    city = out['map/city'];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y) || city.get(x, y + TALL)) continue;
      const d = inside(x, y) - 2.5;
      if (d < 0 || d >= 3.5) continue;
      if (d < 1.2 && Math.floor(Math.atan2((y + 0.5 - 16) * 2, x + 0.5 - 32) * 10) % 2 === 0) continue;
      t.set(x, y, d < 1.2 ? R.stone.l : d > 2.6 ? R.stone.d : R.stone.m);
    }
  // The gatehouse, at the front corner.
  const g = new Spr(W, H);
  g.rect(29, 23, 6, 5, R.stone.m).bevel(R.stone);
  for (let i = 29; i < 35; i += 2) g.set(i, 22, R.stone.l);
  g.rect(31, 25, 2, 3, R.wood.m).set(31, 25, R.wood.l).set(32, 26, R.wood.d);
  g.outline();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (g.get(x, y) && inside(x, y) >= 2.5) t.set(x, y, g.get(x, y));
  return t;
})();

// ---------- units ----------
// A diamond badge in the player's colour on the ground under the figure, half the tile's size, and the square pack's
//  figure standing on it, reaching up out of the tile.
const BADGE = { x: 32, y: TALL + 16, rx: 20, ry: 10 };
const badge = () => {
  const b = new Spr(W, TH);
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < W; x++) {
      const k = Math.abs(x + 0.5 - BADGE.x) / BADGE.rx + Math.abs(y + 0.5 - BADGE.y) / BADGE.ry;
      if (k <= 1) b.set(x, y, k > 0.84 ? KEY_B : KEY_L);
    }
  return b;
};
const FIGURE = { x: 16, y: TALL - 12 };
for (const [k, draw] of Object.entries(units)) {
  const f = new Spr(W, TH),
    fig = new Spr();
  draw(fig);
  fig.outline();
  f.over(fig, FIGURE.x, FIGURE.y);
  const b = badge();
  // The figure's shadow falls on the badge alone.
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < W; x++) if (b.get(x, y) && !f.get(x, y) && f.get(x - 1, y - 1)) b.set(x, y, KEY_B);
  out[`units/${k}`] = b.over(f);
}
for (const [k, f] of Object.entries(combat)) out[`units/${k}`] = new Spr(W, TH).over(f(), FIGURE.x, FIGURE.y);

// ---------- interface ----------
// The square pack's own: they aren't drawn on the map's tiles.
for (const [k, f] of Object.entries(misc)) if (!k.startsWith('map/')) out[k] = f();

module.exports = out;

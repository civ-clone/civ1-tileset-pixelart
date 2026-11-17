// The hexagonal pack's other sprites: improvements, fog, specials, the hut, fort and fortified wall, the city, units
//  on a hexagonal badge, and the interface, which is the square pack's own. See SPEC-HEX.md.
const { OUTLINE, KEY_L, KEY_B, R, Spr } = require('./lib');
const { specials, imp } = require('./terrain');
const misc = require('./misc');
const units = require('./units');
const combat = require('./combat');
const { W, H, DIRS, MID, CENTRE, owns, edgeDist, lhash, lnoise, sprites: terrain } = require('./hex');

// A square-pack sprite moved by (dx, dy) onto a hex-sized canvas, keeping only the pixels the hex owns.
const onHex = (s, dx = 0, dy = 0) => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (owns(x, y)) t.set(x, y, s.get(x - dx, y - dy));
  return t;
};
// How far a pixel's centre is inside the hex: the nearest edge's distance.
const inside = (x, y) => Math.min(...DIRS.map((d) => edgeDist(x, y, d).dist));

const out = { ...terrain };

// ---------- specials ----------
// Lower right on the square tile, moved in and down a little to sit inside the hex.
for (const [k, s] of Object.entries(specials)) out[`terrain/${k}`] = k === 'shield' ? s : onHex(s, -2, 1);

// ---------- improvements ----------
// Irrigation: diagonal water channels between earth ridges, inside an earth border 4px in from the hex's edge.
out['improvements/irrigation'] = (() => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y);
      if (d >= 4 && d < 5) t.set(x, y, '#6a5a2a');
      else if (d >= 5) {
        if ((x + y) % 6 === 0) t.set(x, y, (x + y) % 12 === 0 ? '#5a90e0' : '#3a6ec0');
        else if ((x + y) % 6 === 1) t.set(x, y, '#6a5a2a');
      }
    }
  return t;
})();
out['improvements/mine'] = onHex(imp.mine, 0, 2);
out['improvements/pollution'] = onHex(imp.pollution, 0, 2);

// Roads and railroads: from the middle of the hex to the middle of each of its six edges, where the neighbour's carries
//  on. A railroad's sleepers are every 4px counted from the edge, so both tiles' sleepers line up.
for (const d of DIRS) {
  const [mx, my] = MID[d],
    [cx, cy] = CENTRE,
    len = Math.hypot(mx - cx, my - cy),
    ux = (mx - cx) / len,
    uy = (my - cy) / len,
    road = new Spr(W, H),
    rail = new Spr(W, H),
    steps = Math.ceil(len) + 2;
  for (let i = 0; i <= steps; i++) road.ellipse(cx + ux * i, cy + uy * i, 2.3, 2.3, '#8a6a3c');
  for (let i = 0; i <= steps; i++) {
    const x = cx + ux * i,
      y = cy + uy * i;
    road.ellipse(x, y, 1.4, 1.4, '#b89460');
    if (lhash(Math.floor(x), Math.floor(y), 90) > 0.7) road.set(x, y, '#a07e4a');
  }
  for (let i = 0; i <= steps * 2; i++) {
    const back = len - i / 2;
    if (Math.round(back) % 4 === 2 && Math.abs(back - Math.round(back)) < 0.26)
      for (let k = -3; k <= 3; k++) rail.set(cx + ux * (i / 2) - uy * k, cy + uy * (i / 2) + ux * k, R.wood.m);
  }
  for (let i = 0; i <= steps * 2; i++)
    for (const k of [-2, 2]) rail.set(cx + (ux * i) / 2 - uy * k, cy + (uy * i) / 2 + ux * k, '#c4ccd4');
  out[`improvements/road_${d}`] = onHex(road);
  out[`improvements/railroad_${d}`] = onHex(rail);
}

// ---------- fog ----------
// A black ordered-dither fade in from each edge, about 7–12px deep.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
for (const d of DIRS) {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const { dist, along } = edgeDist(x, y, d),
        depth = 7 + lnoise(along * 2, DIRS.indexOf(d) * 9, 8, 3, 80) * 5;
      if (BAYER[(y % 4) * 4 + (x % 4)] / 16 < 1 - dist / depth) t.set(x, y, '#000000');
    }
  out[`map/fog_${d}`] = t;
}

// ---------- hut, fort, fortified wall ----------
out['map/hut'] = onHex(misc['map/hut'](), 0, 2);
// Fort: an earth bank with a stake palisade just inside the hex's edge, a gate at the bottom; open in the middle.
out['map/fort'] = (() => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y),
        gate = y > 26 && Math.abs(x + 0.5 - 16) < 3.5;
      if (gate) {
        if (d < 4 && (x === 13 || x === 18)) t.set(x, y, R.wood.d);
        continue;
      }
      if (d < 2) t.set(x, y, lhash(x, y, 300) > 0.5 ? '#8a6a3c' : '#7a5a30');
      else if (d < 4) t.set(x, y, (x + y) % 2 ? R.wood.m : R.wood.l);
      else if (d < 5) t.set(x, y, R.wood.d);
    }
  return t;
})();
// Fortified: a crenellated stone wall about 4px thick round the inside of the unit's hexagonal badge.
out['map/fortify'] = (() => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y);
      if (d < 1 || d >= 5) continue;
      // Merlons on the outer half every 4px round.
      if (d < 2.2 && Math.floor(Math.atan2(y + 0.5 - 18, x + 0.5 - 16) * 8) % 2 === 0) continue;
      t.set(x, y, d < 2.2 ? R.stone.l : d > 4 ? R.stone.d : R.stone.m);
    }
  return t;
})();

// ---------- city ----------
// The square pack's city, its wall in stone rather than the owner's second colour, on the middle of the hex; the
//  owner's colours go round it as a rim (`map/city_rim`, its keys swapped for the player's).
out['map/city'] = (() => {
  const c = misc['map/city'](),
    t = new Spr(W, H);
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const p = c.get(x, y);
      if (p) t.set(x + 1, y + 3, p === '#000000' ? R.stone.m : p);
    }
  return onHex(t);
})();
out['map/city_rim'] = (() => {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y);
      if (d < 1) t.set(x, y, KEY_B);
      else if (d < 2.5) t.set(x, y, KEY_L);
    }
  return t;
})();

// ---------- units ----------
// A hexagonal badge in the player's colour, 1px in from the hex's edge, the square pack's figure on it 2px down.
const badge = () => {
  const b = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const d = inside(x, y);
      if (d >= 1) b.set(x, y, d < 2 ? KEY_B : KEY_L);
    }
  return b;
};
for (const [k, draw] of Object.entries(units)) {
  const f = new Spr(W, H),
    fig = new Spr();
  draw(fig);
  fig.outline();
  f.over(fig, 0, 2);
  // Kept to the hex, as every sprite is, so a wide figure doesn't draw over its neighbours' corners.
  out[`units/${k}`] = onHex(badge().shadow(f, KEY_B, 1, 1).over(f));
}
for (const [k, f] of Object.entries(combat)) out[`units/${k}`] = onHex(new Spr(W, H).over(f(), 0, 2));

// ---------- interface ----------
// The square pack's own: they aren't drawn on the map's tiles.
for (const [k, f] of Object.entries(misc)) if (!k.startsWith('map/')) out[k] = f();

module.exports = out;

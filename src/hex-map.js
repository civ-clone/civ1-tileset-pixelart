// The hexagonal pack's other sprites: improvements, fog, specials, the hut, fort and fortified wall, the city, units
//  on a hexagonal badge, and the interface, which is the square pack's own. See SPEC-HEX.md.
const { OUTLINE, KEY_L, KEY_B, R, Spr } = require('./lib');
const { specials, imp } = require('./terrain');
const misc = require('./misc');
const units = require('./units');
const combat = require('./combat');
const {
  W,
  H,
  DIRS,
  MID,
  CENTRE,
  owns,
  edgeDist,
  edgeNoise,
  lhash,
  lnoise,
  dither,
  sprites: terrain,
} = require('./hex');

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
  // The track's width and edges wander by noise on the lattice, read where each step of it is, so a neighbour's road
  //  meets it at the same width; darker ruts run either side of the middle, with the odd stone.
  const wide = (x, y) => 0.6 + lnoise(x, y, 4, 3, 95) * 0.6 + lnoise(x, y, 16, 12, 97) * 0.3;
  for (let i = 0; i <= steps * 2; i++) {
    const x = cx + (ux * i) / 2,
      y = cy + (uy * i) / 2;
    const k = wide(x, y);
    road.ellipse(x, y, 2.3 * k, 2.3 * k, '#8a6a3c');
  }
  for (let i = 0; i <= steps * 2; i++) {
    const x = cx + (ux * i) / 2,
      y = cy + (uy * i) / 2;
    const k = wide(x, y);
    road.ellipse(x, y, 1.4 * k, 1.4 * k, '#b89460');
  }
  for (let i = 0; i <= steps * 2; i++) {
    const x = cx + (ux * i) / 2,
      y = cy + (uy * i) / 2;
    for (const side of [-1, 1]) {
      const rx = x - uy * side,
        ry = y + ux * side;
      if (lhash(Math.floor(rx), Math.floor(ry), 91) > 0.4) road.set(rx, ry, '#8e6e42');
    }
    if (lhash(Math.floor(x), Math.floor(y), 90) > 0.93) road.set(x, y, '#d8c49a');
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
for (const d of DIRS) {
  const t = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!owns(x, y)) continue;
      const { dist } = edgeDist(x, y, d),
        depth = 7 + edgeNoise(x, y, d, 80) * 5;
      if (dither(x, y) < 1 - dist / depth) t.set(x, y, '#000000');
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
// Drawn for the hexagon, in the square pack's style and with its buildings: a temple at the back with a keep and
//  houses either side, a stone wall along the two lower edges with a tower at each end and a gatehouse at the bottom
//  corner, and the middle left open for the size number. All of it is inside the owner's rim (`map/city_rim`, its keys
//  swapped for the player's), which goes round it.
out['map/city'] = (() => {
  const s = new Spr(W, H);
  const house = (x, y, w, wallH, roof, lit = R.plaster) => {
    const rh = Math.ceil(w / 2) - 1,
      b = new Spr(W, H);
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
    const t = new Spr(W, H);
    t.rect(x, y + 1, w, h - 1, R.stone.m).bevel(R.stone);
    for (let i = x; i < x + w; i += 2) t.set(i, y, R.stone.l);
    t.set(x + Math.floor(w / 2), y + 3, R.dark.d).set(x + Math.floor(w / 2), y + 4, R.dark.d);
    t.outline();
    s.over(t);
  };
  // A house at the back left.
  house(6, 9, 6, 4, R.roof2);
  // The temple, centre back.
  const t = new Spr(W, H);
  t.poly(
    [
      [10, 8.5],
      [16, 3.5],
      [22, 8.5],
    ],
    R.stone.l
  );
  t.rect(10, 8, 12, 1, R.stone.d);
  t.rect(11, 9, 10, 6, R.stone.m);
  for (let x = 11; x <= 20; x += 3) t.rect(x, 9, 1, 6, R.white.h);
  t.rect(10, 15, 12, 2, R.stone.d).rect(10, 15, 12, 1, R.stone.l);
  t.set(16, 5, R.stone.h);
  t.outline();
  s.over(t);
  // A keep at the back right.
  tower(22, 10, 4, 8);
  // Houses either side.
  house(4, 13, 6, 4, R.roof);
  house(22, 13, 6, 4, R.roof);
  // The wall, inside the rim along the two lower edges.
  const wall = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.min(edgeDist(x, y, 'se').dist, edgeDist(x, y, 'sw').dist);
      if (y < 21 || inside(x, y) < 3.5 || d >= 7.5) continue;
      const along = x < 16 ? x : 31 - x;
      wall.set(x, y, d < 4.5 ? R.stone.d : d < 6.5 ? R.stone.m : along % 3 ? R.stone.l : null);
    }
  wall.outline();
  s.over(wall);
  // A tower at each end of the wall, and a gatehouse at the bottom corner.
  tower(3, 19, 4, 6);
  tower(25, 19, 4, 6);
  const g = new Spr(W, H);
  g.rect(13, 24, 6, 6, R.stone.m).bevel(R.stone);
  for (let i = 13; i < 19; i += 2) g.set(i, 23, R.stone.l);
  g.rect(15, 26, 2, 4, R.wood.m).set(15, 26, R.wood.l).set(16, 27, R.wood.d).set(16, 28, R.wood.d);
  g.outline();
  s.over(g);
  // Shadows cast down and right onto open ground.
  const sh = new Spr(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (!s.get(x, y) && s.get(x - 1, y - 1) && inside(x, y) >= 2.5) sh.set(x, y, '#2a2620');
  s.over(sh);
  return s;
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

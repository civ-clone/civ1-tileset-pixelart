// UI icons, citizens, meters, cursors, textures and map overlays. Every sprite is drawn from primitives.
const { R, OUTLINE, ramp, Spr, hash } = require('./lib');

const O = OUTLINE;
const P = {
  purple: ramp('#3a1450', '#7030a0', '#a858d8', '#e0a8ff'),
  green: ramp('#1c4010', '#3c7a20', '#68a838', '#a0d860'),
  gold: ramp('#7a4a08', '#d09018', '#f8c830', '#fff4a0'),
  glass: ramp('#a88a30', '#f0d860', '#fff6b0', '#ffffff'),
  sky: ramp('#184a7a', '#2c80c0', '#58b0e8', '#b8e8ff'),
  grey: ramp('#2a2a30', '#4a4a54', '#6a6a74', '#8a8a94'),
  hair: ramp('#1e1008', '#3c2210', '#5e3a1c', '#7a5030'),
  blond: ramp('#7a5010', '#c08a20', '#e8b848', '#f8d880'),
  smog: ramp('#4a4038', '#7a6e60', '#a09484', '#c4baa8'),
  bread: ramp('#6a3410', '#b8661c', '#e09a3c', '#f8d088'),
  earth: ramp('#3c2814', '#6a4826', '#8e6a3c', '#ae8a58'),
};

// Paint a character map: each row is a string, '.' leaves the pixel alone.
const pix = (s, rows, pal, ox = 0, oy = 0) => {
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && s.set(ox + x, oy + y, pal[ch])));
  return s;
};

// Spr.set ignores empty colours, so rubbing pixels out needs its own helper.
const clear = (s, x, y, w = 1, h = 1) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (s.in(i, j)) s.p[j * s.w + i] = null;
};

// ---------- 14×14 city icons ----------
// Drawn at the size the renderer shows them (`ui.icon` in tileset.json), so they are not enlarged.
const icon = (rows, pal) => pix(new Spr(14, 14), rows, { o: O, ...pal });

// Paint the pixels of an n×n sprite along a diagonal: u runs down-right from the top-left corner, v across it
//  (positive towards the top right). fn(u, v) returns a colour or null.
const diagonal = (s, fn) => {
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      const px = x + 0.5,
        py = y + 0.5;
      s.set(x, y, fn((px + py) / Math.SQRT2, (px - py) / Math.SQRT2));
    }
  return s;
};

// a loaf of bread with scored crust
const food = () => {
  const s = new Spr(14, 14);
  s.ball(7, 7.6, 6.5, 4.9, P.bread);
  // flat underside
  s.rect(1, 11, 12, 1, P.bread.d);
  clear(s, 0, 12, 14, 1);
  // three diagonal scores, each with a lit lip above it
  for (const x of [3, 6, 9]) {
    s.line(x, 8, x + 2, 5, P.bread.d);
    s.set(x, 7, P.bread.h)
      .set(x + 1, 5, P.bread.h)
      .set(x + 2, 4, P.bread.h);
  }
  return s.outline();
};

// a hammer, head at the top left, handle running down-right
const production = () => {
  const s = new Spr(14, 14),
    M = R.metal,
    W = R.wood,
    u0 = 5.2 * Math.SQRT2;
  diagonal(s, (u, v) => {
    if (u > u0 && u < 17.4 && Math.abs(v) < 1.05) return v > 0.2 ? W.l : W.m;
    const du = u - u0;
    // the striking face (lower left) is broader than the tapered peen (upper right)
    const half = v < 0 ? 2 : 1.9 - Math.max(0, v - 2) * 0.35;
    if (Math.abs(du) <= half && v > -4.6 && v < 4.6) return du < -0.9 ? M.h : du < 0.2 ? M.l : du < 1.1 ? M.m : M.d;
    return null;
  });
  s.outline();
  return s;
};

// two arrows, one each way
const trade = () => {
  const arrow = (right, oy, r) => {
    const a = new Spr(14, 14);
    const tip = right ? 12.5 : 1.5,
      base = right ? 7.5 : 6.5;
    a.rect(right ? 1 : 7, oy + 1, 6, 3, r.m);
    a.poly(
      [
        [base, oy - 0.5],
        [tip, oy + 2.5],
        [base, oy + 5.5],
      ],
      r.m
    );
    a.bevel(r);
    a.outline();
    return a;
  };
  return new Spr(14, 14).over(arrow(true, 1, P.sky)).over(arrow(false, 8, R.red));
};

// a coin with a raised rim and a stamped mark
const gold = () => {
  const s = new Spr(14, 14),
    G = P.gold;
  s.ball(7, 7, 6, 6, G);
  // the rim: a groove inside the edge, shadowed on its top left, lit on its bottom right
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < 14; x++) {
      const dx = x + 0.5 - 7,
        dy = y + 0.5 - 7,
        d = Math.hypot(dx, dy);
      if (d > 3.6 && d <= 4.6) s.set(x, y, dx + dy < -1 ? G.d : dx + dy > 1 ? G.h : G.m);
    }
  // stamped bar
  s.rect(6, 5, 1, 4, G.d).rect(7, 5, 1, 4, G.h);
  return s.outline();
};

// a cut gem: crown facets above the girdle, pavilion facets running to the point
const luxury = () =>
  icon(
    [
      '..............',
      '..............',
      '...oooooooo...',
      '..ohhhllllmo..',
      '.ohhlhllllmdo.',
      'ohllhlllllmddo',
      'olmmmmmmmmmddo',
      '.ohllmlmmdmdo.',
      '..ohlmlmmddo..',
      '...ohlmmmdo...',
      '....olmmdo....',
      '.....omdo.....',
      '......oo......',
      '..............',
    ],
    { h: P.purple.h, l: P.purple.l, m: P.purple.m, d: P.purple.d }
  );

// a light bulb: glass globe, glowing filament, screw base
const bulb = () => {
  const s = new Spr(14, 14),
    M = R.metal;
  s.ball(7, 5.5, 5, 4.8, P.glass);
  s.rect(5, 9, 4, 1, P.glass.m).set(8, 9, P.glass.d);
  // filament on two posts
  s.rect(5, 6, 1, 4, M.m).rect(8, 6, 1, 4, M.m);
  s.set(5, 5, R.fire.m).set(6, 4, R.fire.m).set(7, 5, R.fire.m).set(8, 4, R.fire.m);
  // screw base with threads, and the contact
  s.rect(4, 10, 6, 1, M.l).rect(5, 11, 4, 1, M.m);
  s.set(9, 10, M.m).set(8, 11, M.d);
  s.rect(6, 12, 2, 1, R.dark.l);
  return s.outline();
};

// a frowning face
const sad = () => {
  const s = new Spr(14, 14);
  s.ball(7, 7, 6, 6, R.red).outline();
  // worried brows, eyes, and a downturned mouth
  s.set(3, 3, R.red.d).set(4, 4, R.red.d).set(10, 3, R.red.d).set(9, 4, R.red.d);
  s.rect(4, 5, 1, 2, O).rect(9, 5, 1, 2, O);
  s.rect(5, 9, 4, 1, O).set(4, 10, O).set(9, 10, O);
  return s;
};

// ---------- 16×32 citizens ----------
// Drawn at the size the renderer shows them (`ui.citizen` in tileset.json). They stand 12px apart, so the figure keeps
//  to the middle 12px and only props reach the edges.
// mood: 'happy' (arms up, smiling), 'content' (arms down), 'unhappy' (dark, head bowed, hands hanging).
// right: what the right arm does, 'up' or 'down' (defaults to the mood's); hold: optional (s, female) => void drawing
//  an item in the right hand.
const person = ({ mood = 'content', female = false, cloth, legs, hair, hold, right }) => {
  const s = new Spr(16, 32);
  const sad = mood === 'unhappy',
    up = mood === 'happy';
  right = right || (up ? 'up' : 'down');
  const dy = sad ? 2 : 0,
    hy = 2 + dy;
  const skin = R.skin;
  const lip = '#6a2c1c';
  // legs and shoes
  if (female) {
    s.rect(5, 26, 2, 2, skin.m).rect(9, 26, 2, 2, skin.d);
  } else {
    s.rect(5, 19, 3, 9, legs.m).rect(8, 19, 3, 9, legs.d);
    s.rect(5, 19, 1, 9, legs.l).rect(7, 22, 1, 6, legs.d);
  }
  s.rect(4, 28, 4, 2, R.dark.m).rect(8, 28, 4, 2, R.dark.d).rect(4, 28, 2, 1, R.dark.l).set(8, 28, R.dark.m);
  // body
  if (female) {
    s.poly(
      [
        [4, 10 + dy],
        [12, 10 + dy],
        [13.6, 27],
        [2.4, 27],
      ],
      cloth.m
    );
  } else {
    s.rect(4, 10 + dy, 8, 11 - dy, cloth.m);
  }
  clear(s, 4, 10 + dy);
  clear(s, 11, 10 + dy);
  s.bevel(cloth);
  if (female) {
    // a sash at the waist and a band at the hem
    s.rect(4, 17, 8, 1, cloth.d).rect(3, 24, 10, 1, cloth.l);
  } else {
    s.rect(4, 18, 8, 1, R.wood.d).set(7, 18, P.gold.l).set(8, 18, P.gold.d);
  }
  // a v-shaped collar
  s.set(7, 10 + dy, skin.d)
    .set(8, 10 + dy, skin.d)
    .set(7, 11 + dy, cloth.d);
  // arms: lit on the left, shaded on the right
  const arm = (x, lit, hand, how) => {
    if (how === 'up') {
      s.rect(x, 3, 2, 10, lit ? cloth.l : cloth.m).rect(x + (lit ? 1 : 0), 4, 1, 8, lit ? cloth.m : cloth.d);
      s.rect(x, 1, 2, 2, hand);
    } else if (sad) {
      s.rect(x, 11 + dy, 2, 8, cloth.d).rect(x, 19 + dy, 2, 2, skin.d);
    } else {
      s.rect(x, 11, 2, 8, lit ? cloth.l : cloth.d).rect(x + (lit ? 1 : 0), 12, 1, 6, cloth.m);
      s.rect(x, 19, 2, 2, hand);
    }
  };
  arm(2, true, skin.l, up ? 'up' : 'down');
  arm(12, false, skin.m, right);
  // head: lit left cheek, shaded right, rounded jaw
  s.rect(5, hy, 6, 8, skin.m)
    .rect(5, hy + 2, 1, 5, skin.l)
    .rect(10, hy + 2, 1, 5, skin.d);
  clear(s, 5, hy + 7);
  clear(s, 10, hy + 7);
  s.set(9, hy + 7, skin.d);
  // eyes, nose shadow, mouth
  const ey = hy + (sad ? 4 : 3);
  s.set(6, ey, O).set(9, ey, O);
  s.set(8, hy + 4 + (sad ? 1 : 0), skin.d);
  if (up)
    s.set(6, hy + 5, lip)
      .set(9, hy + 5, lip)
      .rect(7, hy + 6, 2, 1, lip);
  else if (sad)
    s.rect(7, hy + 6, 2, 1, lip)
      .set(6, hy + 7, lip)
      .set(9, hy + 7, lip);
  else s.rect(7, hy + 6, 2, 1, skin.d);
  // hair
  if (female) {
    // long hair falling past the shoulders, with a lit crown
    s.rect(5, hy - 1, 6, 3, hair.m)
      .rect(6, hy - 1, 3, 1, hair.l)
      .set(6, hy, hair.h);
    s.rect(4, hy, 1, 10, hair.m)
      .rect(11, hy, 1, 10, hair.d)
      .set(5, hy + 2, hair.m)
      .set(10, hy + 2, hair.d);
    s.set(4, hy + 1, hair.l)
      .set(4, hy + 3, hair.l)
      .set(11, hy + 9, hair.m);
  } else {
    s.rect(5, hy - 1, 6, 2, hair.m)
      .set(6, hy - 1, hair.l)
      .set(7, hy - 1, hair.l);
    s.set(5, hy + 1, hair.m)
      .set(5, hy + 2, hair.m)
      .set(10, hy + 1, hair.d)
      .set(9, hy, hair.d);
  }
  if (hold) hold(s, female);
  return s.outline();
};

// Props are drawn on their own and outlined, so they stand out against the clothes.
const prop = (s, draw) => {
  const p = new Spr(16, 32);
  draw(p);
  s.over(p.outline());
};
// a coin held up in the raised right hand
const coin = (s) =>
  prop(s, (p) => {
    p.rect(12, 6, 2, 2, R.skin.m).set(12, 6, R.skin.l);
    p.ball(13, 3.2, 2.4, 2.4, P.gold).rect(13, 2, 1, 3, P.gold.d).set(12, 2, P.gold.h);
  });
// a round-bottomed flask held in front, in the right hand
const flask = (s) =>
  prop(s, (p) => {
    const W = R.white;
    p.ball(10.5, 16, 2.6, 2.6, P.sky);
    p.rect(10, 11, 2, 3, W.l).rect(11, 11, 1, 3, W.m).rect(9, 11, 4, 1, W.m);
    p.set(9, 15, W.h).set(9, 16, P.sky.h);
    p.rect(12, 12, 2, 2, R.skin.m).set(12, 12, R.skin.l);
  });
// a lute strummed across the body: neck up to the top right, pegbox at the end
const lute = (s) =>
  prop(s, (p) => {
    const W = R.wood;
    p.line(11, 13, 14, 7, W.d).line(12, 13, 15, 7, W.l);
    p.rect(14, 5, 2, 2, W.d).set(14, 5, W.m);
    p.ball(10, 16.5, 3.4, 3, R.camel);
    p.rect(9, 16, 2, 2, R.dark.d).set(9, 16, R.dark.m);
    p.rect(11, 15, 2, 2, R.skin.m).set(11, 15, R.skin.l);
  });

const citizens = {};
const HAIR = { m: P.hair, f: P.blond };
const MOODS = {
  happy: { cloth: ramp('#1a5a20', '#38a040', '#70d060', '#a8f088'), legs: R.wood },
  content: { cloth: R.khaki, legs: R.wood },
  unhappy: { cloth: P.grey, legs: R.dark },
};
for (const mood of Object.keys(MOODS))
  for (const g of ['m', 'f'])
    citizens[`city/people_${mood}_${g}`] = () => person({ mood, female: g === 'f', hair: HAIR[g], ...MOODS[mood] });

const SPEC = {
  tax: { cloth: P.gold, legs: R.roof2, hold: coin, right: 'up' },
  science: { cloth: R.white, legs: R.blue, hold: flask },
  luxury: { cloth: P.purple, legs: R.red, hold: lute },
};
for (const [k, o] of Object.entries(SPEC)) {
  citizens[`city/people_${k}`] = () => person({ hair: P.hair, ...o });
  citizens[`city/people_${k}_f`] = () => person({ female: true, hair: P.blond, ...o });
}

// ---------- 14×14 pollution ----------
// Shown in the same column as the yield icons, so drawn at the same size.
const pollution = () => {
  const N = 14,
    s = new Spr(N, N);
  // a squat smokestack billowing puffs that grow as they drift up and right, drawn back to front so each one's lit
  //  top sits over the one behind
  const puffs = [
    [10.5, 4.5, 3.1],
    [6.6, 3.2, 2.2],
    [4, 4.9, 1.6],
  ];
  for (const [x, y, r] of puffs) {
    // soft cloud shading: no deep shadow inside a puff
    const b = new Spr(N, N);
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const dx = (i + 0.5 - x) / r,
          dy = (j + 0.5 - y) / r;
        if (dx * dx + dy * dy > 1) continue;
        const lit = -(dx * 0.6 + dy * 0.8);
        b.set(i, j, lit > 0.45 ? P.smog.h : lit > -0.25 ? P.smog.l : P.smog.m);
      }
    // a dark rim where a puff overlaps the ones behind it
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++)
        if (
          !b.get(i, j) &&
          s.get(i, j) &&
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dx, dy]) => b.get(i + dx, j + dy))
        )
          s.set(i, j, P.smog.d);
    s.over(b);
  }
  // the stack, with a band of brick courses and a dark lip
  const st = new Spr(N, N)
    .rect(2, 8, 4, 5, R.roof.m)
    .bevel(R.roof)
    .rect(3, 9, 2, 1, R.roof.d)
    .rect(3, 11, 2, 1, R.roof.d);
  st.rect(1, 7, 6, 1, R.dark.m).rect(1, 7, 2, 1, R.dark.l);
  for (let j = 7; j < N; j++)
    for (let i = 0; i < N; i++)
      if (!st.get(i, j) && s.get(i, j) && st.get(i - 1, j) | st.get(i + 1, j) | st.get(i, j - 1)) s.set(i, j, O);
  s.over(st);
  return s.outline();
};

// ---------- 8×8 meters ----------
const BULB = ['..ooo...', '.oaaao..', 'oaaaaao.', 'oaaaaao.', '.oaaao..', '..oso...', '..oso...', '...o....'];
const scienceMeter = (level) => () => {
  const s = new Spr(8, 8);
  const lit = [
    ramp('#2a2a34', '#3c3c48', '#50505c', '#606070'),
    ramp('#6a5a20', '#9a8430', '#c0a848', '#d8c070'),
    ramp('#a88a30', '#e0c040', '#f8e070', '#fff4c0'),
    P.glass,
  ][level];
  pix(s, BULB, { o: O, s: R.metal.l, a: lit.m });
  // fill level rises from the bottom of the glass: rows 1–4
  const top = [5, 4, 2, 1][level];
  for (let y = 1; y <= 4; y++)
    for (let x = 1; x <= 5; x++) if (s.get(x, y) === lit.m && y < top) s.set(x, y, '#3c3c48');
  s.set(2, 2, level ? lit.h : '#606070');
  if (level === 3) s.set(7, 0, P.glass.h).set(7, 3, P.glass.l).set(0, 0, P.glass.l);
  return s;
};

const pollutionMeter = (level) => () => {
  const s = new Spr(8, 8);
  const r = [
    ramp('#1c5a3a', '#2c8a5a', '#5ab884', '#a8e8c0'),
    ramp('#8a7010', '#d8b020', '#f8e050', '#fff8b0'),
    ramp('#8a3a08', '#e07018', '#f8a030', '#ffe080'),
    ramp('#5a0808', '#c01818', '#f04020', '#ffb060'),
  ][level];
  const rad = [2.2, 2.2, 2.2, 2.0][level];
  s.ball(4, 4, rad, rad, r);
  if (level === 0) s.set(3, 3, R.wood.l).set(4, 4, R.wood.l).set(3, 4, R.wood.m);
  s.outline();
  if (level > 0) {
    const rays =
      level === 1
        ? [
            [4, 0],
            [4, 7],
            [0, 4],
            [7, 4],
          ]
        : [
            [4, 0],
            [4, 7],
            [0, 4],
            [7, 4],
            [1, 1],
            [6, 1],
            [1, 6],
            [6, 6],
          ];
    rays.forEach(([x, y]) => s.set(x, y, level === 3 ? r.l : r.m));
    if (level === 3)
      [
        [3, 0],
        [5, 7],
        [0, 5],
        [7, 3],
      ].forEach(([x, y]) => s.set(x, y, r.m));
  }
  return s;
};

// ---------- cursors ----------
const cursorGo = () => {
  const s = new Spr(12, 12);
  // arrow pointing to the top-left corner
  s.poly(
    [
      [1, 1],
      [9, 1],
      [6.5, 3.5],
      [11, 8],
      [8, 11],
      [3.5, 6.5],
      [1, 9],
    ],
    P.green.m
  ).bevel(P.green);
  s.set(1, 1, P.green.h).set(2, 2, P.green.h);
  s.outline();
  s.set(0, 0, O);
  return s;
};

const cursorTorch = () => {
  // Drawn at the size the renderer shows it (`ui.cursor` in tileset.json). The hotspot is the top-left pixel, so the
  //  flame's tip sits there and the handle runs down-right.
  const s = new Spr(26, 26),
    W = R.wood,
    M = R.metal,
    F = R.fire;
  diagonal(s, (u, v) => {
    const a = Math.abs(v);
    // handle: lit on its upper side, with grain and a leather binding near the bottom
    if (u > 14 && u < 33.6 && a < 2) {
      if (u > 27 && u < 29.2) return v > 0.6 ? R.roof2.l : v > -0.6 ? R.roof2.m : R.roof2.d;
      const c = v > 0.7 ? W.l : v > -0.7 ? W.m : W.d;
      return c === W.m && hash(Math.round(u * 2), Math.round(v * 3), 4) < 0.25 ? W.d : c;
    }
    // metal cup holding the flame
    if (u > 11.6 && u <= 14.6 && a < 3.2 - (u - 11.6) * 0.3)
      return u < 12.4 ? M.h : v > 0.9 ? M.l : v > -0.9 ? M.m : M.d;
    return null;
  });
  // flame: a teardrop from the tip at the top left, widest just above the cup, with flickering tongues
  diagonal(s, (u, v) => {
    if (u > 12.6) return null;
    const w = 4.2 * Math.sin(Math.min(1, u / 9.5) * Math.PI * 0.5) ** 0.9 * (u > 10 ? 1 - (u - 10) * 0.08 : 1);
    const flick = 0.6 * Math.sin(u * 1.9 + (v > 0 ? 0 : 2));
    const a = Math.abs(v);
    if (a > w + flick * (u < 9 ? 1 : 0)) return null;
    // hotter towards the core, which sits low in the flame
    const r = Math.hypot((u - 9) / 6.5, v / 3.6);
    return r < 0.35 ? F.h : r < 0.7 ? F.l : r < 1 ? F.m : F.d;
  });
  s.outline();
  return s.set(0, 0, F.l).set(1, 1, F.l);
};

// ---------- tileable textures ----------
const periodic = (x, y, f, n, seed) => {
  // value noise on an n-cell lattice that wraps, so the 16px tile repeats seamlessly
  const xi = Math.floor(x / f),
    yi = Math.floor(y / f),
    tx = x / f - xi,
    ty = y / f - yi;
  const e = (t) => t * t * (3 - 2 * t),
    h = (i, j) => hash(((i % n) + n) % n, ((j % n) + n) % n, seed);
  const a = h(xi, yi),
    b = h(xi + 1, yi),
    c = h(xi, yi + 1),
    d = h(xi + 1, yi + 1);
  return a + (b - a) * e(tx) + (c - a) * e(ty) + (a - b - c + d) * e(tx) * e(ty);
};
const texture = (cols, seed, speck) => () => {
  const s = new Spr(16, 16);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const v = periodic(x, y, 8, 2, seed) * 0.55 + periodic(x, y, 4, 4, seed + 3) * 0.3 + hash(x, y, seed + 9) * 0.15;
      let i = v < 0.36 ? 0 : v < 0.52 ? 1 : v < 0.68 ? 2 : 3;
      if (hash(x, y, seed + 21) < speck) i = Math.max(0, i - 1);
      s.set(x, y, cols[i]);
    }
  return s;
};

// ---------- map sprites ----------
const thatch = ramp('#6a4a14', '#a87c2c', '#d0a44a', '#ecc870');

const hutAt = (s, cx, base, w, h) => {
  // mud walls
  const wall = R.camel;
  s.rect(cx - w / 2 + 1, base - Math.round(h * 0.45), w - 2, Math.round(h * 0.45), wall.m).bevel(wall);
  // conical thatch roof overhanging the walls
  const top = base - h,
    eave = base - Math.round(h * 0.4);
  s.poly(
    [
      [cx, top],
      [cx + w / 2 + 1, eave],
      [cx - w / 2 - 1, eave],
    ],
    thatch.m
  );
  // straw strokes, lit on the left
  for (let y = top + 2; y < eave; y += 2)
    for (let x = 0; x < 32; x++)
      if (s.get(x, y) === thatch.m && hash(x, y, 5) < 0.35) s.set(x, y, x < cx ? thatch.l : thatch.d);
  for (let y = top; y <= eave; y++) {
    const half = ((y - top) / (eave - top)) * (w / 2 + 1);
    s.set(Math.round(cx + half - 0.5), y, thatch.d);
    s.set(Math.round(cx - half), y, thatch.h);
  }
  s.rect(cx - w / 2 - 1, eave - 1, w + 2, 1, thatch.d);
  s.set(cx, top, thatch.h)
    .set(cx, top - 1, R.wood.d)
    .set(cx, top - 2, R.wood.d);
  // doorway
  const dh = Math.max(3, Math.round(h * 0.3));
  s.rect(cx - 1, base - dh, 3, dh, R.dark.d)
    .set(cx - 1, base - dh, wall.m)
    .set(cx + 1, base - dh, wall.m);
};

const hut = () => {
  const s = new Spr(32, 32);
  // small hut behind, to the left
  hutAt(s, 9, 24, 10, 12);
  // totem pole on the right
  s.rect(24, 12, 3, 15, R.wood.m).bevel(R.wood);
  s.rect(24, 13, 3, 1, R.red.l).rect(24, 17, 3, 1, P.sky.l).rect(24, 21, 3, 1, R.red.l);
  s.set(24, 15, O).set(26, 15, O).set(24, 19, O).set(26, 19, O);
  s.rect(22, 12, 2, 1, R.wood.l).rect(27, 12, 2, 1, R.wood.d);
  // main hut in front
  hutAt(s, 16, 28, 14, 17);
  s.outline();
  return s;
};

const fort = () => {
  const s = new Spr(32, 32);
  const E = P.earth,
    W = R.wood;
  // earth bank around the edge, lit on the top/left slopes
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const d = Math.min(x, y, 31 - x, 31 - y);
      if (d >= 3 && d <= 5) s.set(x, y, d === 5 ? (x + y < 32 ? E.d : E.l) : hash(x, y, 3) < 0.2 ? E.l : E.m);
    }
  // stakes: back and front walls show their sides with pointed tips, the side walls show their sawn tops
  const stake = (x, y0, h) => {
    s.set(x, y0, W.h).set(x + 1, y0, null);
    s.rect(x, y0 + 1, 1, h - 1, W.l).rect(x + 1, y0 + 1, 1, h - 1, W.d);
    s.set(x + 1, y0 + 1, W.m);
  };
  for (let x = 2; x <= 29; x += 3) stake(x, 0, 6);
  for (let x = 2; x <= 29; x += 3) if (x < 11 || x > 19) stake(x, 26, 6);
  for (let y = 6; y <= 24; y += 3) {
    s.rect(1, y, 2, 2, W.m)
      .set(1, y, W.h)
      .set(2, y + 1, W.d);
    s.rect(29, y, 2, 2, W.m)
      .set(29, y, W.h)
      .set(30, y + 1, W.d);
  }
  // gate posts either side of the opening in the front wall
  s.rect(12, 25, 2, 7, W.m).set(12, 25, W.h).rect(13, 26, 1, 6, W.d);
  s.rect(18, 25, 2, 7, W.m).set(18, 25, W.h).rect(19, 26, 1, 6, W.d);
  return s.outline();
};

const fortify = () => {
  const s = new Spr(32, 32);
  const St = R.stone;
  const T = 4;
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const d = Math.min(x, y, 31 - x, 31 - y);
      if (d >= 1 && d < 1 + T) s.set(x, y, St.m);
    }
  // crenels: notches cut into the outer edge
  for (let i = 4; i < 28; i += 4)
    for (let k = 0; k < 2; k++) {
      s.rect(i + k, 1, 1, 2, null);
      for (const [x, y] of [
        [i + k, 1],
        [i + k, 2],
        [i + k, 29],
        [i + k, 30],
        [1, i + k],
        [2, i + k],
        [29, i + k],
        [30, i + k],
      ])
        s.p[y * 32 + x] = null;
    }
  s.bevel(St);
  // mortar joints
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const c = s.get(x, y);
      if (c !== St.l && c !== St.m) continue;
      const d = Math.min(x, y, 31 - x, 31 - y);
      const along = d === y || d === 31 - y ? x : y;
      if (d === 3 && along % 3 === 0) s.set(x, y, St.d);
    }
  return s.outline();
};

// City: drawn over the owner's main colour; '#000000' becomes the owner's dark colour.
const K = '#000000';
const city = () => {
  const s = new Spr(30, 30);
  const sh = new Spr(30, 30);
  const house = (x, y, w, wallH, roof, lit = R.plaster) => {
    const rh = Math.ceil(w / 2) - 1;
    const b = new Spr(30, 30);
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
    // door and window
    b.rect(x + 1, y + rh + wallH - 2, 1, 2, R.wood.d);
    if (w >= 6) b.rect(x + w - 3, y + rh + 1, 2, 1, R.dark.m);
    b.outline();
    s.over(b);
  };
  // back row
  house(2, 4, 7, 5, R.roof);

  // temple with columns, centre-back
  const t = new Spr(30, 30);
  t.poly(
    [
      [9, 6.5],
      [15, 1.5],
      [21, 6.5],
    ],
    R.stone.l
  );
  t.rect(9, 6, 12, 1, R.stone.d);
  t.rect(10, 7, 10, 6, R.stone.m);
  for (let x = 10; x <= 19; x += 3) t.rect(x, 7, 1, 6, R.white.h);
  t.rect(9, 13, 12, 2, R.stone.d).rect(9, 13, 12, 1, R.stone.l);
  t.set(15, 3, R.stone.h);
  t.outline();
  s.over(t);
  // front houses at the sides leave the centre open for the size number
  house(1, 12, 6, 5, R.roof2);
  // tower at the back right
  const tw = new Spr(30, 30);
  tw.rect(23, 4, 4, 12, R.stone.m).bevel(R.stone);
  tw.rect(22, 2, 6, 2, R.stone.m).bevel(R.stone);
  tw.set(22, 1, R.stone.l).set(24, 1, R.stone.l).set(26, 1, R.stone.m);
  tw.set(25, 6, R.dark.d).set(25, 7, R.dark.d);
  tw.outline();
  s.over(tw);
  house(21, 13, 7, 5, R.roof);
  // city wall along the front, in the owner's dark colour
  const w = new Spr(30, 30);
  w.rect(0, 26, 30, 3, K);
  for (let x = 0; x < 30; x += 3) w.rect(x, 25, 2, 1, K);
  // gate
  w.rect(13, 25, 4, 4, R.wood.m).rect(14, 24, 2, 1, R.wood.m).rect(15, 25, 1, 4, R.wood.d).rect(13, 25, 1, 4, R.wood.l);
  w.outline();
  s.over(w);
  // cast shadows in the owner's dark colour onto open ground
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 30; x++) if (!s.get(x, y) && s.get(x - 1, y - 1) && s.get(x - 1, y - 1) !== K) sh.set(x, y, K);
  s.over(sh);
  return s;
};

const meters = {};
['0', '25', '50', '75'].forEach((n, i) => {
  meters[`status/science_${n}`] = scienceMeter(i);
  meters[`status/pollution_${n}`] = pollutionMeter(i);
});

module.exports = {
  'city/food': food,
  'city/production': production,
  'city/trade': trade,
  'city/gold': gold,
  'city/luxury': luxury,
  'city/bulb': bulb,
  'city/sad': sad,
  ...citizens,
  'city/pollution': pollution,
  ...meters,
  'cursor/go': cursorGo,
  'cursor/torch': cursorTorch,
  'general/texture_1': texture(['#b8a47c', '#c8b48a', '#d4c296', '#ddcca2'], 11, 0.06),
  'general/texture_2': texture(['#3e3226', '#463a2c', '#4e4132', '#564838'], 23, 0.06),
  'map/hut': hut,
  'map/fort': fort,
  'map/fortify': fortify,
  'map/city': city,
};

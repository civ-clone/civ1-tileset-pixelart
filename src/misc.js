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

// ---------- 7×7 city icons ----------
const icon = (rows, pal) => pix(new Spr(7, 7), rows, { o: O, ...pal });

// a loaf of bread with scored crust
const food = () => {
  const s = new Spr(7, 7);
  s.ball(3.5, 4, 3.5, 2.2, P.bread).outline();
  // diagonal scores across the crust
  return s
    .set(1, 3, P.bread.h)
    .set(2, 3, P.bread.d)
    .set(3, 2, P.bread.h)
    .set(4, 3, P.bread.d)
    .set(5, 3, P.bread.d)
    .set(3, 4, P.bread.d)
    .set(5, 4, P.bread.d);
};

const production = () =>
  icon(['.ooo...', 'ohllo..', 'olmmdo.', '.odmdwo', '..o.wwo', '....oww', '.....ow'], {
    h: R.metal.h,
    l: R.metal.l,
    m: R.metal.m,
    d: R.metal.d,
    w: R.wood.l,
  });

const trade = () =>
  icon(['....ll.', 'lllllll', '....ll.', '.......', '.rr....', 'rrrrrrr', '.rr....'], { l: P.sky.l, r: R.red.l });

const gold = () => {
  const s = new Spr(7, 7);
  s.ball(3.5, 3.5, 2.6, 2.6, P.gold).outline();
  return s.set(3, 2, P.gold.d).set(3, 3, P.gold.d).set(3, 4, P.gold.d).set(4, 2, P.gold.h);
};

const luxury = () =>
  icon(['.ooooo.', 'ohhlmdo', 'olllmdo', '.olmdo.', '..omo..', '...o...', '.......'], {
    h: P.purple.h,
    l: P.purple.l,
    m: P.purple.m,
    d: P.purple.d,
  });

const bulb = () =>
  icon(['..ooo..', '.ohhlo.', 'ohhllmo', 'olllmdo', '.olmdo.', '..oso..', '..ooo..'], {
    h: P.glass.h,
    l: P.glass.l,
    m: P.glass.m,
    d: P.glass.d,
    s: R.metal.l,
  });

const sad = () => {
  const s = new Spr(7, 7);
  s.ball(3.5, 3.5, 2.7, 2.7, R.red).outline();
  // eyes and a downturned mouth
  return s.set(2, 2, O).set(4, 2, O).set(3, 4, O).set(2, 5, O).set(4, 5, O).set(3, 5, R.red.m);
};

// ---------- 8×16 citizens ----------
// mood: 'happy' (arms up), 'content' (arms down), 'unhappy' (dark, head bowed, hands hanging).
// hold: optional (s, female) => void drawing an item in the right hand.
const person = ({ mood = 'content', female = false, cloth, legs, hair, hold, armsUp = mood === 'happy' }) => {
  const s = new Spr(8, 16);
  const dy = mood === 'unhappy' ? 1 : 0;
  const skin = R.skin;
  // legs and feet
  if (female) {
    s.rect(2, 13, 1, 1, skin.m).rect(5, 13, 1, 1, skin.m);
  } else {
    s.rect(2, 10, 2, 4, legs.m).rect(4, 10, 2, 4, legs.d);
  }
  s.rect(1, 14, 3, 1, R.dark.m).rect(4, 14, 3, 1, R.dark.m);
  // body
  if (female) {
    s.poly(
      [
        [2, 5 + dy],
        [6, 5 + dy],
        [7, 13],
        [1, 13],
      ],
      cloth.m
    );
  } else {
    s.rect(2, 5 + dy, 4, 6 - dy, cloth.m);
  }
  s.bevel(cloth);
  s.rect(2, 9, 4, 1, female ? cloth.d : R.wood.d);
  // arms
  if (armsUp) {
    s.rect(1, 0, 1, 6, cloth.l).rect(6, 0, 1, 6, cloth.d);
    s.rect(1, 0, 1, 2, skin.l).rect(6, 0, 1, 2, skin.m);
  } else if (mood === 'unhappy') {
    s.rect(1, 6 + dy, 1, 4, cloth.d).rect(6, 6 + dy, 1, 4, cloth.d);
    s.set(1, 10, skin.d).set(6, 10, skin.d);
  } else {
    s.rect(1, 5, 1, 4, cloth.l).rect(6, 5, 1, 4, cloth.d);
    s.set(1, 9, skin.l).set(6, 9, skin.m);
  }
  // head
  s.rect(2, 1 + dy, 4, 4, skin.m);
  s.set(2, 2 + dy, skin.l)
    .set(3, 2 + dy, skin.l)
    .set(5, 4 + dy, skin.d);
  // hair
  s.rect(2, 1 + dy, 4, 1, hair.m)
    .set(2, 2 + dy, hair.m)
    .set(5, 2 + dy, hair.d);
  if (female)
    s.rect(1, 2 + dy, 1, 4, hair.m)
      .rect(6, 2 + dy, 1, 4, hair.d)
      .rect(2, 0 + dy, 4, 1, hair.l);
  // face
  if (mood === 'unhappy') {
    s.set(3, 3 + dy, O).set(5, 3 + dy, O);
  } else {
    s.set(3, 3 + dy, O).set(5, 3 + dy, O);
  }
  if (hold) hold(s, female);
  return s.outline();
};

const coin = (s) => {
  s.set(6, 1, P.gold.h).set(7, 1, P.gold.m).set(6, 2, P.gold.m).set(7, 2, P.gold.d);
};
const flask = (s) => {
  s.set(7, 3, R.white.l).set(7, 4, R.white.l).set(6, 5, P.sky.l).set(7, 5, P.sky.m);
  s.set(6, 6, P.sky.m).set(7, 6, P.sky.d);
};
const lute = (s) => {
  s.line(6, 4, 7, 3, R.wood.d);
  s.rect(5, 6, 2, 3, R.wood.l).set(6, 8, R.wood.m).set(7, 7, R.wood.m).set(5, 7, R.wood.d);
};

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
  tax: { cloth: P.gold, legs: R.roof2, hold: coin, armsUp: false },
  science: { cloth: R.white, legs: R.blue, hold: flask },
  luxury: { cloth: P.purple, legs: R.red, hold: lute },
};
for (const [k, o] of Object.entries(SPEC)) {
  citizens[`city/people_${k}`] = () => person({ hair: P.hair, ...o });
  citizens[`city/people_${k}_f`] = () => person({ female: true, hair: P.blond, ...o });
}

// ---------- 16×16 pollution ----------
const pollution = () => {
  const s = new Spr(16, 16);
  // puffs drawn back to front so each one's lit top sits over the one behind
  // a squat smokestack billowing puffs that grow as they drift up and right
  const puffs = [
    [11.5, 5, 3.9],
    [6, 4, 2.9],
    [8.5, 8.5, 2.9],
    [4, 9, 2.2],
  ];
  for (const [x, y, r] of puffs) {
    // soft cloud shading: no deep shadow inside a puff
    const b = new Spr(16, 16);
    for (let j = 0; j < 16; j++)
      for (let i = 0; i < 16; i++) {
        const dx = (i + 0.5 - x) / r,
          dy = (j + 0.5 - y) / r;
        if (dx * dx + dy * dy > 1) continue;
        const lit = -(dx * 0.6 + dy * 0.8);
        b.set(i, j, lit > 0.45 ? P.smog.h : lit > -0.25 ? P.smog.l : P.smog.m);
      }
    // a dark rim where a puff overlaps the ones behind it
    for (let j = 0; j < 16; j++)
      for (let i = 0; i < 16; i++)
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
  const st = new Spr(16, 16)
    .rect(2, 12, 4, 4, R.roof.m)
    .bevel(R.roof)
    .rect(1, 11, 6, 1, R.dark.m)
    .rect(1, 11, 2, 1, R.dark.l);
  for (let j = 11; j < 16; j++)
    for (let i = 0; i < 16; i++)
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
  const s = new Spr(13, 13);
  // handle running down-right from the flame
  s.line(5, 5, 11, 11, R.wood.m, 2);
  s.line(6, 5, 11, 10, R.wood.l);
  s.line(4, 4, 6, 6, R.metal.m, 2).set(4, 4, R.metal.l);
  // flame pointing to the top-left
  s.poly(
    [
      [0.5, 0.5],
      [6, 2],
      [6.5, 4.5],
      [4.5, 6.5],
      [2, 6],
    ],
    R.fire.d
  );
  s.poly(
    [
      [1.5, 1.5],
      [5.5, 2.8],
      [5.6, 4.5],
      [4.5, 5.6],
      [2.8, 5.5],
    ],
    R.fire.m
  );
  s.poly(
    [
      [2, 2],
      [4.6, 3.2],
      [4.4, 4.4],
      [3.2, 4.6],
    ],
    R.fire.l
  );
  s.set(2, 2, R.fire.h).set(3, 3, R.fire.h);
  s.outline();
  return s.set(0, 0, R.fire.l);
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

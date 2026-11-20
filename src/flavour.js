// Flavour: small pictures drawn over a terrain where it is fully joined, on some squares of a larger stretch of it, as
//  SPEC.md describes; the game leaves it off a square with a special or a hut. Each is drawn on a 32px canvas, left
//  of the middle, and none is an animal or a crop, so none reads as a special. Each terrain's are in its own list,
//  `terrain/{terrain}_flavour_{n}` from 1.
const { ramp, R, Spr } = require('./lib');

const draw = (f) => {
  const s = new Spr();
  f(s);
  return s.outline();
};
const LEAF = ramp('#1a4a14', '#2e7a24', '#4ca036', '#78c850'),
  POOL = ramp('#1c3a78', '#2e5aa8', '#4a80d4', '#a8c8f4'),
  ICE = ramp('#7c94b8', '#a4bcdc', '#d4e2f2', '#ffffff'),
  BARK = ramp('#2c1c10', '#4a3420', '#6c4c30', '#8a6644');

const flavours = {
  grassland: [
    // a patch of wildflowers
    (s) => {
      for (const [x, y, c] of [
        [7, 14, '#f4e468'],
        [10, 12, '#ec7a96'],
        [12, 15, '#ffffff'],
        [8, 17, '#ec7a96'],
        [13, 18, '#f4e468'],
        [5, 16, '#ffffff'],
        [11, 19, '#ec7a96'],
      ]) {
        s.line(x, y + 1, x, y + 2, LEAF.d);
        s.set(x, y, c)
          .set(x + 1, y, c)
          .set(x, y - 1, c);
      }
    },
    // a small pond fringed with rushes
    (s) => {
      s.ellipse(10, 17, 6, 3, POOL.d).ellipse(10, 16.6, 5, 2.4, POOL.m);
      s.line(7, 16, 10, 16, POOL.l).set(12, 17, POOL.h);
      for (const x of [4, 5, 15]) s.line(x, 13, x, 17, LEAF.m);
      s.set(4, 12, BARK.m).set(15, 12, BARK.m);
    },
  ],
  plains: [
    // a lone tree
    (s) => {
      s.line(10, 14, 10, 19, BARK.m, 2);
      s.ball(10, 11, 5, 4, LEAF);
      s.ball(8, 10, 2, 1.6, LEAF);
    },
    // a stony outcrop in the grass
    (s) => {
      s.ball(9, 16, 4, 2.6, R.stone);
      s.ball(13, 17, 2.4, 1.8, R.stone);
      s.line(6, 18, 15, 18, '#8a7a3e');
    },
  ],
  desert: [
    // a tumbleweed
    (s) => {
      s.ellipse(10, 15, 4, 3.4, '#a88a4a');
      for (const [x0, y0, x1, y1] of [
        [7, 13, 13, 17],
        [7, 17, 13, 13],
        [10, 12, 10, 18],
      ])
        s.line(x0, y0, x1, y1, '#7a6030');
      s.ellipse(10, 15, 1.6, 1.4, '#c8a860');
    },
    // cracked, dry ground
    (s) => {
      s.ellipse(10, 16, 7, 3.6, '#c8a058');
      for (const [x0, y0, x1, y1] of [
        [4, 16, 9, 15],
        [9, 15, 12, 17],
        [12, 17, 16, 16],
        [9, 15, 10, 13],
        [12, 17, 11, 19],
      ])
        s.line(x0, y0, x1, y1, '#8a6a34');
    },
  ],
  tundra: [
    // a melt pond with an icy rim
    (s) => {
      s.ellipse(10, 16, 6, 3, ICE.l).ellipse(10, 16, 4.6, 2.2, POOL.m);
      s.line(8, 15, 11, 15, POOL.l);
    },
    // a lichen-covered boulder
    (s) => {
      s.ball(10, 15, 4.2, 3.4, R.stone);
      for (const [x, y] of [
        [8, 13],
        [11, 14],
        [9, 16],
        [12, 16],
      ])
        s.set(x, y, '#c8b84a');
    },
  ],
  arctic: [
    // a crevasse
    (s) => {
      s.poly(
        [
          [3, 16],
          [8, 14],
          [12, 15],
          [17, 13],
          [16, 15],
          [12, 17],
          [8, 16],
        ],
        '#3e5a8a'
      );
      s.line(5, 16, 15, 14, '#6a86b4');
    },
    // a snow drift
    (s) => {
      s.ball(10, 16, 6, 2.8, ICE);
      s.line(6, 15, 12, 14, ICE.h);
    },
  ],
  swamp: [
    // lily pads on still water
    (s) => {
      s.ellipse(10, 16, 6, 3, '#2e4c40');
      for (const [x, y] of [
        [7, 15],
        [11, 17],
        [13, 15],
      ])
        s.ellipse(x, y, 1.8, 1.2, LEAF.l).set(x, y, LEAF.d);
      s.set(11, 16, '#f0c0d8');
    },
    // a dead stump
    (s) => {
      s.rect(8, 12, 4, 7, BARK.m);
      s.rect(8, 12, 1, 7, BARK.l).rect(11, 12, 1, 7, BARK.d);
      s.ellipse(10, 12, 2, 0.8, BARK.h);
      s.line(12, 14, 15, 11, BARK.m);
      s.line(6, 19, 14, 19, BARK.d);
    },
  ],
  forest: [
    // a fallen log
    (s) => {
      s.line(4, 18, 15, 14, BARK.m, 3);
      s.line(4, 17, 15, 13, BARK.l);
      s.ellipse(15.5, 14, 1.4, 1.6, BARK.h).set(15, 14, BARK.d);
    },
    // a ring of toadstools
    (s) => {
      for (const [x, y] of [
        [6, 16],
        [9, 14],
        [13, 15],
        [12, 18],
        [8, 19],
      ]) {
        s.line(x, y, x, y + 1, '#e8e0d0');
        s.ellipse(x + 0.5, y, 1.6, 1, '#c0302a').set(x, y - 1, '#ffffff');
      }
    },
  ],
  jungle: [
    // a great purple flower, unlike the fruit special's red and orange
    (s) => {
      for (const [dx, dy] of [
        [-3, 0],
        [3, 0],
        [0, -2],
        [0, 2],
        [-2, -1.5],
        [2, 1.5],
      ])
        s.ellipse(10 + dx, 15 + dy, 2, 1.4, '#a040c0');
      s.ellipse(10, 15, 1.6, 1.2, '#f4e468');
    },
    // a vine-covered rock
    (s) => {
      s.ball(10, 15, 4.4, 3.4, R.stone);
      s.line(7, 12, 9, 18, LEAF.m).line(11, 12, 13, 17, LEAF.m);
      s.set(8, 14, LEAF.l).set(12, 15, LEAF.l);
    },
  ],
  hills: [
    // a rocky outcrop
    (s) => {
      s.poly(
        [
          [5, 18],
          [8, 12],
          [11, 13],
          [14, 11],
          [16, 18],
        ],
        R.stone.m
      ).bevel(R.stone);
      s.line(9, 14, 10, 17, R.stone.d);
    },
    // a cairn of stones
    (s) => {
      for (const [x, y, r] of [
        [10, 18, 3],
        [10, 15, 2.4],
        [10, 12.5, 1.8],
      ])
        s.ball(x, y, r, r * 0.6, R.stone);
    },
  ],
  mountains: [
    // a snowfield on the slope
    (s) => {
      s.poly(
        [
          [4, 16],
          [9, 13],
          [15, 14],
          [13, 17],
          [6, 18],
        ],
        ICE.l
      );
      s.line(6, 16, 12, 14, ICE.h);
    },
    // a scree slide
    (s) => {
      for (const [x, y] of [
        [6, 18],
        [9, 17],
        [12, 18],
        [8, 15],
        [11, 15],
        [10, 13],
        [14, 16],
      ])
        s.ball(x, y, 1.3, 1, R.stone);
    },
  ],
};

const sprites = {};
for (const [terrain, list] of Object.entries(flavours))
  list.forEach((f, i) => (sprites[`${terrain}_flavour_${i + 1}`] = draw(f)));

module.exports = { flavours: sprites };

// Units, each drawn on a 32px figure layer that `unit()` outlines and sets on the player's badge.
const { R, OUTLINE, ramp } = require('./lib');

module.exports = {
  settlers: (f) => {
    // bundle on the back
    f.ball(11, 14, 4, 5, R.canvas);
    f.line(9, 10, 13, 18, R.canvas.d);
    // legs and boots
    f.rect(14, 21, 2, 5, R.wood.d).rect(18, 21, 2, 5, R.wood.d);
    f.rect(13, 26, 3, 2, R.dark.m).rect(18, 26, 3, 2, R.dark.m);
    // smock
    f.poly(
      [
        [13, 12],
        [21, 12],
        [22, 22],
        [12, 22],
      ],
      R.blue.m
    ).bevel(R.blue);
    f.rect(13, 19, 9, 1, R.wood.d);
    // head
    f.ball(17, 9, 3, 3.2, R.skin);
    f.set(18, 9, OUTLINE);
    // hat brim and crown
    f.ellipse(17, 6.5, 6.5, 1.6, R.straw.m).ball(17, 5, 3, 2.2, R.straw).bevel(R.straw);
    // shovel over the right shoulder
    f.line(22, 22, 26, 4, R.wood.m, 1).line(23, 22, 27, 4, R.wood.d, 1);
    f.poly(
      [
        [23, 21],
        [27, 21],
        [26, 27],
        [24, 27],
      ],
      R.metal.m
    ).bevel(R.metal);
    f.ball(22, 14, 1.6, 1.6, R.skin);
  },
  warrior: (f) => {
    f.rect(13, 21, 2, 5, R.skin.m).rect(17, 21, 2, 5, R.skin.m).bevel(R.skin);
    f.rect(12, 26, 3, 2, R.fur.d).rect(17, 26, 3, 2, R.fur.d);
    f.poly(
      [
        [11, 12],
        [20, 12],
        [21, 23],
        [10, 23],
      ],
      R.fur.m
    ).bevel(R.fur);
    for (let x = 11; x <= 20; x += 2) f.set(x, 22, R.fur.d);
    f.line(11, 13, 9, 20, R.skin.m, 2);
    f.ball(15.5, 8, 3.2, 3.5, R.skin);
    f.rect(13, 4, 6, 2, R.fur.d).set(12, 6, R.fur.d).set(19, 6, R.fur.d);
    f.set(17, 8, OUTLINE);
    // raised club arm
    f.line(20, 13, 23, 9, R.skin.m, 2);
    f.line(22, 10, 25, 4, R.wood.m, 2);
    f.ball(25.5, 3.5, 2.6, 3, R.wood);
    f.set(24, 2, R.wood.d).set(27, 4, R.wood.d);
  },
  spearman: (f) => {
    f.line(23, 1, 23, 28, R.wood.m).line(24, 1, 24, 28, R.wood.d);
    f.poly(
      [
        [23.5, 0],
        [25.5, 4],
        [21.5, 4],
      ],
      R.metal.l
    );
    f.rect(15, 21, 2, 5, R.bronze.m).rect(19, 21, 2, 5, R.bronze.m).bevel(R.bronze);
    f.rect(14, 26, 3, 2, R.wood.d).rect(19, 26, 3, 2, R.wood.d);
    f.poly(
      [
        [14, 12],
        [22, 12],
        [22, 22],
        [14, 22],
      ],
      R.red.m
    ).bevel(R.red);
    f.ball(22, 15, 1.6, 1.6, R.skin);
    // helmet with crest
    f.ball(18, 8, 3.4, 3.6, R.bronze);
    f.rect(18, 8, 3, 3, R.skin.l).rect(18, 8, 3, 1, R.bronze.d).set(19, 9, OUTLINE);
    f.poly(
      [
        [14, 5],
        [17, 2],
        [21, 2],
        [22, 4],
        [18, 4],
      ],
      R.red.m
    ).bevel(R.red);
    // shield
    f.ball(13, 17, 7, 7.5, R.bronze);
    f.ellipse(13, 17, 4.5, 5, R.red.m).bevel(R.red);
    f.ball(13, 17, 1.8, 1.8, R.bronze);
  },
  horseman: (f) => {
    // tail
    f.line(6, 15, 4, 22, R.horse.d, 2);
    // legs
    for (const [x, d] of [
      [8, 0],
      [11, 1],
      [19, 0],
      [22, 1],
    ])
      f.line(x, 20, x - d, 27, d ? R.horse.d : R.horse.m, 2);
    // body, neck, head
    f.ball(14, 17, 8.5, 4.6, R.horse);
    f.poly(
      [
        [19, 17],
        [21, 10],
        [24, 8],
        [25, 12],
        [23, 18],
      ],
      R.horse.m
    ).bevel(R.horse);
    f.poly(
      [
        [23, 8],
        [28, 10],
        [28, 13],
        [25, 13],
      ],
      R.horse.m
    ).bevel(R.horse);
    f.set(24, 9, OUTLINE).set(22, 7, R.horse.d);
    f.line(20, 10, 23, 7, R.horse.d);
    // saddle cloth
    f.rect(11, 13, 7, 4, R.red.m).bevel(R.red);
    // rider
    f.poly(
      [
        [12, 6],
        [17, 6],
        [17, 14],
        [12, 14],
      ],
      R.blue.m
    ).bevel(R.blue);
    f.line(14, 14, 13, 19, R.wood.d, 2);
    f.ball(14.5, 3.5, 2.6, 2.8, R.skin);
    f.rect(12, 1, 5, 1, R.metal.m).set(16, 3, OUTLINE);
    // lance
    f.line(9, 12, 29, 4, R.wood.m);
    f.line(29, 4, 30, 3, R.metal.h);
    f.ball(17, 9, 1.4, 1.4, R.skin);
  },
  catapult: (f) => {
    // base frame
    f.rect(5, 19, 22, 3, R.wood.m).bevel(R.wood);
    f.line(8, 19, 14, 11, R.wood.m, 2).line(20, 19, 14, 11, R.wood.d, 2);
    // arm, cocked back
    f.line(14, 12, 25, 17, R.wood.l, 2);
    f.line(14, 12, 6, 6, R.wood.m, 2);
    f.ball(6, 5, 3, 2.4, R.wood);
    f.ball(6, 3.5, 2, 2, R.stone);
    // rope
    f.line(16, 14, 22, 19, R.straw.d);
    // wheels
    for (const cx of [9, 23]) {
      f.ellipse(cx, 24, 4.2, 4.2, R.wood.d).ellipse(cx, 24, 3, 3, R.wood.m);
      f.line(cx - 2, 24, cx + 2, 24, R.wood.d).line(cx, 22, cx, 26, R.wood.d);
      f.ball(cx, 24, 1.2, 1.2, R.metal);
    }
  },
  trireme: (f) => {
    // mast and sail
    f.line(16, 2, 16, 19, R.wood.d);
    f.poly(
      [
        [9, 4],
        [24, 4],
        [25, 10],
        [23, 15],
        [10, 15],
        [8, 10],
      ],
      R.canvas.m
    );
    for (let y = 6; y < 15; y += 4)
      for (let x = 0; x < 32; x++) if (f.get(x, y) === R.canvas.m) f.set(x, y, R.red.m).set(x, y + 1, R.red.m);
    f.bevel(R.canvas).bevel(R.red);
    f.line(8, 3, 25, 3, R.wood.m);
    // hull
    f.poly(
      [
        [2, 17],
        [26, 17],
        [30, 21],
        [26, 24],
        [6, 24],
        [3, 21],
      ],
      R.wood.m
    ).bevel(R.wood);
    f.line(4, 19, 27, 19, R.bronze.l);
    f.poly(
      [
        [26, 21],
        [31, 22],
        [26, 24],
      ],
      R.bronze.m
    );
    f.poly(
      [
        [2, 17],
        [1, 13],
        [4, 15],
        [5, 17],
      ],
      R.wood.l
    );
    // oars
    for (let x = 7; x <= 24; x += 3) f.line(x, 22, x - 2, 28, R.wood.l);
  },
  tank: (f) => {
    // gun
    f.line(17, 11, 30, 11, R.olive.d, 2);
    f.rect(29, 10, 2, 4, R.olive.d);
    // hull
    f.poly(
      [
        [3, 15],
        [27, 15],
        [29, 19],
        [2, 19],
      ],
      R.olive.m
    ).bevel(R.olive);
    // turret
    f.poly(
      [
        [9, 8],
        [19, 8],
        [21, 15],
        [7, 15],
      ],
      R.olive.m
    ).bevel(R.olive);
    f.rect(11, 6, 4, 2, R.olive.d);
    f.ellipse(12, 12, 1.5, 1.5, R.olive.h);
    // tracks
    f.poly(
      [
        [2, 19],
        [29, 19],
        [27, 26],
        [4, 26],
      ],
      R.dark.m
    ).bevel(R.dark);
    for (let x = 6; x <= 25; x += 4) f.ball(x, 22.5, 1.8, 1.8, R.metal);
    for (let x = 4; x <= 27; x += 2) f.set(x, 26, R.dark.l);
  },
  fighter: (f) => {
    // wings
    f.poly(
      [
        [3, 14],
        [29, 14],
        [29, 18],
        [3, 18],
      ],
      R.metal.m
    ).bevel(R.metal);
    f.rect(4, 14, 1, 4, R.red.m).rect(27, 14, 1, 4, R.red.m);
    // tailplane
    f.poly(
      [
        [10, 25],
        [22, 25],
        [22, 28],
        [10, 28],
      ],
      R.metal.m
    ).bevel(R.metal);
    // fuselage
    f.ball(16, 16, 3.4, 13, R.metal);
    // canopy
    f.ball(16, 12, 1.8, 2.6, R.blue);
    // roundels
    for (const cx of [8, 24]) f.ellipse(cx, 16, 2, 2, R.blue.m).ellipse(cx, 16, 1, 1, R.red.l);
    // propeller
    f.line(11, 2, 21, 2, R.dark.l);
    f.ball(16, 2.5, 1.4, 1.4, R.dark);
  },
};

// ---------- helpers for the later units ----------
// A short run of sea with foam crests under a hull.
const waves = (f, y, x0, x1) => {
  for (let x = x0; x <= x1; x++) {
    const k = (x - x0) % 6;
    if (k < 4) f.set(x, y + (k === 0 || k === 3 ? 1 : 0), R.sea.m);
    if (k === 1 || k === 2) f.set(x, y, R.sea.h);
  }
};
const wheel = (f, cx, cy, r, rim = R.wood, hub = R.metal) => {
  f.ellipse(cx, cy, r, r, rim.d).ellipse(cx, cy, r - 1.2, r - 1.2, rim.m);
  f.line(cx - r + 1, cy, cx + r - 1, cy, rim.d).line(cx, cy - r + 1, cx, cy + r - 1, rim.d);
  if (r > 4)
    f.line(cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2, rim.d).line(
      cx - r + 2,
      cy + r - 2,
      cx + r - 2,
      cy - r + 2,
      rim.d
    );
  f.ball(cx, cy, 1.3, 1.3, hub);
};
const tyre = (f, cx, cy, r) => {
  f.ellipse(cx, cy, r, r, R.dark.m).ellipse(cx, cy, r - 1.5, r - 1.5, R.steel.l);
  f.ball(cx, cy, 1, 1, R.steel);
  f.set(cx - r + 1, cy - 1, R.dark.l).set(cx - 1, cy - r + 1, R.dark.l);
};

Object.assign(module.exports, {
  swordman: (f) => {
    // legs
    f.rect(15, 21, 2, 5, R.skin.m).rect(19, 21, 2, 5, R.skin.m).bevel(R.skin);
    f.rect(14, 26, 3, 2, R.wood.d).rect(19, 26, 3, 2, R.wood.d);
    // tunic skirt and segmented armour
    f.poly(
      [
        [14, 18],
        [22, 18],
        [23, 22],
        [13, 22],
      ],
      R.red.m
    ).bevel(R.red);
    f.rect(14, 11, 8, 8, R.metal.m).bevel(R.metal);
    for (let y = 13; y < 19; y += 2) f.line(14, y, 21, y, R.metal.d);
    // sword arm raised
    f.line(21, 12, 24, 8, R.skin.m, 2);
    f.rect(23, 7, 3, 1, R.bronze.l);
    f.line(25, 6, 28, 1, R.metal.h, 1).line(26, 6, 29, 1, R.metal.l, 1);
    f.ball(24.5, 8, 1.4, 1.4, R.skin);
    // helmet with upright plume
    f.ball(18, 8, 3.4, 3.6, R.metal);
    f.rect(18, 8, 3, 3, R.skin.l).rect(18, 8, 3, 1, R.metal.d).set(19, 9, OUTLINE);
    f.rect(15, 9, 1, 3, R.metal.d);
    f.poly(
      [
        [15, 4],
        [16, 1],
        [20, 1],
        [21, 4],
      ],
      R.red.m
    ).bevel(R.red);
    // tall curved shield
    f.rect(6, 10, 9, 16, R.red.m).bevel(R.red);
    f.rect(6, 10, 9, 1, R.bronze.l).rect(6, 25, 9, 1, R.bronze.d);
    f.rect(6, 11, 1, 14, R.red.l).rect(14, 11, 1, 14, R.red.d);
    f.line(10, 12, 10, 23, R.bronze.m);
    f.line(7, 17, 13, 17, R.bronze.m);
    f.ball(10.5, 17.5, 2.2, 2.2, R.bronze);
  },
  chariot: (f) => {
    // horse
    f.line(15, 15, 13, 21, R.horse.d, 2);
    for (const [x, d] of [
      [17, 1],
      [20, 0],
      [24, 1],
      [27, 0],
    ])
      f.line(x, 18, x + (d ? -1 : 2), 26, d ? R.horse.d : R.horse.m, d ? 1 : 2);
    f.ball(22, 15.5, 6, 3.6, R.horse);
    f.poly(
      [
        [25, 15],
        [26, 8],
        [28, 6],
        [29, 10],
        [28, 16],
      ],
      R.horse.m
    ).bevel(R.horse);
    f.poly(
      [
        [27, 5],
        [31, 8],
        [30, 10],
        [28, 9],
      ],
      R.horse.m
    ).bevel(R.horse);
    f.set(28, 6, OUTLINE).line(25, 9, 27, 5, R.horse.d);
    f.set(26, 4, R.red.l).set(27, 3, R.red.m);
    // harness and pole
    f.line(9, 19, 22, 15, R.wood.d);
    f.line(13, 9, 27, 9, R.straw.d);
    // car
    f.poly(
      [
        [3, 12],
        [13, 13],
        [14, 20],
        [3, 20],
      ],
      R.bronze.m
    ).bevel(R.bronze);
    f.line(4, 15, 12, 15, R.red.m);
    f.line(4, 16, 12, 16, R.red.d);
    // driver
    f.poly(
      [
        [6, 7],
        [11, 7],
        [11, 12],
        [6, 12],
      ],
      R.canvas.m
    ).bevel(R.canvas);
    f.ball(8.5, 4.5, 2.4, 2.6, R.skin);
    f.ball(8.5, 2.6, 2.6, 1.6, R.bronze).set(10, 4, OUTLINE);
    f.line(11, 8, 13, 9, R.skin.m, 2);
    // spear held back over the shoulder
    f.line(3, 13, 14, 2, R.wood.m);
    f.poly(
      [
        [13, 3],
        [17, 0],
        [15, 4],
      ],
      R.metal.l
    );
    // wheel
    wheel(f, 8, 22, 6);
  },
  knight: (f) => {
    // armoured legs below the caparison
    for (const [x, d] of [
      [7, 0],
      [10, 1],
      [19, 0],
      [22, 1],
    ])
      f.line(x, 22, x - d, 27, d ? R.metal.d : R.metal.m, 2);
    // tail
    f.line(4, 15, 3, 21, R.horse.d, 2);
    // neck and chanfron
    f.poly(
      [
        [19, 16],
        [21, 9],
        [24, 7],
        [26, 11],
        [24, 17],
      ],
      R.blue.m
    ).bevel(R.blue);
    f.poly(
      [
        [23, 7],
        [29, 9],
        [29, 12],
        [25, 12],
      ],
      R.metal.m
    ).bevel(R.metal);
    f.set(25, 9, OUTLINE).set(23, 5, R.metal.l).set(23, 6, R.metal.m);
    // caparison, quartered blue and gold with a scalloped hem
    f.poly(
      [
        [4, 14],
        [22, 14],
        [24, 17],
        [23, 23],
        [5, 23],
      ],
      R.blue.m
    );
    f.poly(
      [
        [13, 14],
        [22, 14],
        [24, 17],
        [23, 18],
        [13, 18],
      ],
      R.straw.m
    );
    f.poly(
      [
        [4, 18],
        [13, 18],
        [13, 23],
        [5, 23],
      ],
      R.straw.m
    );
    f.bevel(R.blue).bevel(R.straw);
    for (let x = 5; x <= 22; x += 3) f.set(x, 23, null).set(x + 1, 23, null);
    // rider
    f.poly(
      [
        [11, 5],
        [16, 5],
        [16, 14],
        [11, 14],
      ],
      R.metal.m
    ).bevel(R.metal);
    f.line(13, 14, 12, 19, R.metal.d, 2);
    f.ball(13.5, 4, 2.6, 2.8, R.metal);
    f.rect(13, 4, 3, 1, OUTLINE);
    f.set(12, 1, R.red.l).set(11, 1, R.red.m);
    // shield
    f.poly(
      [
        [8, 7],
        [13, 7],
        [13, 11],
        [10.5, 14],
        [8, 11],
      ],
      R.red.m
    ).bevel(R.red);
    f.line(10, 8, 10, 12, R.straw.l).line(9, 9, 12, 9, R.straw.l);
    // lance
    f.line(10, 14, 31, 6, R.wood.l);
    f.line(14, 13, 18, 11, R.red.m);
    f.ball(17, 11, 1.3, 1.3, R.metal);
  },
  musketman: (f) => {
    // gaiters and shoes
    f.rect(14, 22, 2, 4, R.canvas.l).rect(18, 22, 2, 4, R.canvas.l);
    f.rect(13, 26, 3, 2, R.dark.m).rect(18, 26, 3, 2, R.dark.m);
    // long coat
    f.poly(
      [
        [12, 11],
        [21, 11],
        [23, 23],
        [10, 23],
      ],
      R.red.m
    ).bevel(R.red);
    f.line(16, 12, 16, 22, R.red.d);
    f.rect(10, 21, 2, 2, R.canvas.m).rect(22, 21, 1, 2, R.canvas.m);
    // crossbelts
    f.line(12, 11, 20, 19, R.white.l).line(21, 11, 13, 19, R.white.l);
    // head and tricorn
    f.ball(16.5, 8, 3, 3.2, R.skin);
    f.set(18, 8, OUTLINE);
    f.poly(
      [
        [11, 6],
        [16.5, 2],
        [22, 6],
        [16.5, 5],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.rect(13, 3, 7, 2, R.dark.l);
    f.line(11, 6, 22, 6, R.straw.l);
    // musket at port arms, across the body
    f.line(10, 23, 25, 3, R.wood.m, 2);
    f.line(19, 11, 25, 3, R.metal.l);
    f.line(25, 3, 26, 2, R.metal.h);
    f.ball(13, 18, 1.5, 1.5, R.skin).ball(20, 12, 1.5, 1.5, R.skin);
  },
  rifleman: (f) => {
    // puttees and boots
    f.rect(14, 21, 2, 5, R.khaki.d).rect(18, 21, 2, 5, R.khaki.d);
    f.rect(13, 26, 3, 2, R.wood.d).rect(18, 26, 3, 2, R.wood.d);
    // tunic
    f.poly(
      [
        [12, 11],
        [21, 11],
        [22, 22],
        [12, 22],
      ],
      R.khaki.m
    ).bevel(R.khaki);
    f.rect(12, 17, 10, 1, R.wood.d);
    f.rect(13, 13, 2, 2, R.khaki.l).rect(19, 13, 2, 2, R.khaki.d);
    // pack
    f.rect(9, 12, 3, 7, R.olive.m).bevel(R.olive);
    // head and brimmed helmet
    f.ball(16.5, 8, 3, 3.2, R.skin);
    f.set(18, 8, OUTLINE);
    f.ellipse(16.5, 6, 6, 1.4, R.olive.d);
    f.ball(16.5, 5, 3.4, 2.4, R.olive);
    // rifle, bayonet up and forward
    f.line(15, 25, 25, 4, R.wood.m, 2);
    f.line(21, 12, 24, 5, R.metal.m);
    f.line(25, 4, 27, 0, R.metal.h);
    f.ball(18, 18, 1.5, 1.5, R.skin).ball(22, 11, 1.5, 1.5, R.skin);
  },
  mechanizedinfantry: (f) => {
    // gun
    f.line(19, 9, 29, 9, R.dark.m, 1).set(29, 8, R.dark.m).set(29, 10, R.dark.m);
    // hull with sloped nose
    f.poly(
      [
        [3, 12],
        [22, 12],
        [29, 17],
        [29, 21],
        [2, 21],
        [2, 13],
      ],
      R.khaki.m
    ).bevel(R.khaki);
    f.line(22, 12, 29, 17, R.khaki.h);
    f.line(3, 17, 28, 17, R.khaki.d);
    // vision slits and hatch
    f.rect(6, 14, 3, 1, OUTLINE).rect(11, 14, 3, 1, OUTLINE).rect(23, 15, 2, 1, OUTLINE);
    // turret
    f.poly(
      [
        [13, 7],
        [20, 7],
        [21, 12],
        [12, 12],
      ],
      R.khaki.m
    ).bevel(R.khaki);
    f.rect(14, 5, 3, 2, R.khaki.d);
    // wheels
    for (const x of [7, 15, 23]) tyre(f, x, 23, 3.6);
  },
  cannon: (f) => {
    // far wheel
    wheel(f, 15, 20, 6, ramp('#2a180a', '#4a2c14', '#6a4422'));
    // trail down to the ground
    f.poly(
      [
        [2, 26],
        [4, 27],
        [17, 18],
        [15, 16],
      ],
      R.wood.m
    ).bevel(R.wood);
    // barrel
    f.poly(
      [
        [6, 15],
        [28, 9],
        [29, 12],
        [8, 19],
      ],
      R.bronze.m
    ).bevel(R.bronze);
    f.ball(6.5, 17, 2.5, 2.5, R.bronze);
    f.rect(27, 9, 2, 4, R.bronze.d);
    f.line(14, 13, 15, 16, R.bronze.d).line(21, 11, 22, 14, R.bronze.d);
    f.set(29, 10, OUTLINE).set(29, 11, OUTLINE);
    // near wheel
    wheel(f, 13, 22, 6.5);
  },
  artillery: (f) => {
    // split trail, two legs spread on the ground
    f.line(12, 21, 1, 26, R.olive.d, 2);
    f.line(12, 22, 5, 28, R.olive.m, 2);
    f.rect(1, 25, 2, 3, R.dark.m).rect(4, 27, 3, 2, R.dark.m);
    // cradle
    f.line(9, 18, 17, 12, R.olive.m, 3);
    // shield plate
    f.poly(
      [
        [15, 10],
        [20, 8],
        [20, 20],
        [15, 21],
      ],
      R.olive.m
    ).bevel(R.olive);
    // long barrel elevated right, muzzle brake
    f.line(13, 15, 28, 5, R.steel.m, 2);
    f.line(14, 13, 28, 4, R.steel.l);
    f.rect(27, 2, 4, 4, R.steel.d).rect(27, 3, 4, 1, R.steel.l);
    // wheel
    tyre(f, 15, 24, 4.5);
  },
  diplomat: (f) => {
    // trousers and shoes
    f.rect(14, 22, 2, 4, R.dark.l).rect(18, 22, 2, 4, R.dark.l);
    f.rect(13, 26, 3, 2, OUTLINE).rect(18, 26, 4, 2, R.dark.m);
    // long coat
    f.poly(
      [
        [12, 11],
        [21, 11],
        [23, 24],
        [11, 24],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.poly(
      [
        [15, 11],
        [18, 11],
        [16.5, 16],
      ],
      R.white.l
    );
    f.set(16, 12, R.red.m).set(17, 12, R.red.m).set(16, 13, R.red.d);
    f.line(16, 16, 16, 23, R.dark.d);
    f.set(17, 17, R.straw.l).set(17, 20, R.straw.l);
    // scroll in the raised left hand
    f.line(12, 12, 9, 16, R.dark.l, 2);
    f.rect(6, 12, 3, 7, R.canvas.l).rect(6, 12, 3, 1, R.canvas.m).rect(6, 18, 3, 1, R.canvas.m);
    f.set(7, 15, R.red.m);
    f.ball(9, 16, 1.4, 1.4, R.skin);
    // briefcase
    f.line(21, 12, 23, 18, R.dark.l, 2);
    f.rect(21, 20, 8, 6, R.wood.m).bevel(R.wood);
    f.rect(24, 18, 3, 1, R.wood.d).set(24, 19, R.wood.d).set(26, 19, R.wood.d);
    f.rect(24, 22, 2, 1, R.bronze.l);
    // head and top hat
    f.ball(16.5, 8, 3, 3.2, R.skin);
    f.set(18, 8, OUTLINE);
    f.rect(12, 5, 9, 1, R.dark.m);
    f.rect(14, 0, 6, 5, R.dark.m).bevel(R.dark);
    f.rect(14, 4, 6, 1, R.red.m);
    f.rect(12, 5, 9, 1, R.dark.l);
  },
  caravan: (f) => {
    // legs
    for (const [x, d] of [
      [7, 0],
      [10, 1],
      [19, 0],
      [22, 1],
    ])
      f.line(x, 18, x - d, 27, d ? R.camel.d : R.camel.m, 2);
    // tail
    f.line(4, 13, 3, 18, R.camel.d);
    // body, neck, head
    f.ball(14, 15, 10, 4.5, R.camel);
    f.poly(
      [
        [21, 14],
        [25, 6],
        [27, 5],
        [28, 8],
        [25, 16],
      ],
      R.camel.m
    ).bevel(R.camel);
    f.poly(
      [
        [25, 4],
        [30, 5],
        [30, 8],
        [27, 8],
      ],
      R.camel.m
    ).bevel(R.camel);
    f.set(26, 5, OUTLINE).set(25, 3, R.camel.d);
    // load: bundles and rolled carpets on the hump
    f.ball(9, 9, 3.4, 3.2, R.canvas);
    f.line(9, 6, 9, 12, R.canvas.d);
    f.ball(15, 7.5, 3.6, 3.6, R.straw);
    f.line(12, 7, 18, 8, R.wood.d);
    f.rect(5, 11, 16, 3, R.red.m).bevel(R.red);
    f.ellipse(5, 12.5, 1.5, 1.5, R.red.d).set(5, 12, R.straw.l);
    for (let x = 8; x < 20; x += 3) f.set(x, 12, R.straw.l);
    f.rect(11, 3, 9, 3, R.blue.m).bevel(R.blue);
    f.ellipse(20, 4.5, 1.4, 1.5, R.blue.d);
    // bridle
    f.line(26, 6, 23, 10, R.red.l);
  },
  sail: (f) => {
    // mast and yard
    f.line(15, 1, 15, 18, R.wood.d);
    f.line(6, 3, 24, 3, R.wood.m);
    // big bellied square sail with a cross
    f.poly(
      [
        [6, 4],
        [24, 4],
        [26, 10],
        [24, 16],
        [6, 16],
        [7, 10],
      ],
      R.canvas.m
    ).bevel(R.canvas);
    f.rect(14, 4, 3, 12, R.red.m).rect(6, 9, 19, 2, R.red.m).bevel(R.red);
    f.set(15, 0, R.red.l).set(16, 0, R.red.m).set(17, 1, R.red.m);
    // round hull with castles
    f.poly(
      [
        [3, 15],
        [28, 15],
        [26, 22],
        [22, 24],
        [8, 24],
        [5, 22],
      ],
      R.wood.m
    ).bevel(R.wood);
    f.rect(2, 13, 6, 3, R.wood.l).rect(24, 13, 5, 3, R.wood.l);
    f.line(4, 19, 27, 19, R.wood.d);
    for (let x = 3; x < 8; x += 2) f.set(x, 12, R.wood.m);
    for (let x = 25; x < 29; x += 2) f.set(x, 12, R.wood.m);
    waves(f, 25, 4, 28);
  },
  frigate: (f) => {
    // masts
    for (const x of [7, 15, 23]) f.line(x, x === 15 ? 0 : 2, x, 17, R.wood.d);
    f.line(23, 13, 30, 9, R.wood.d);
    // stacked square sails
    for (const [x, top, w] of [
      [7, 3, 3],
      [15, 1, 4],
      [23, 3, 3],
    ]) {
      f.poly(
        [
          [x - w, top],
          [x + w, top],
          [x + w + 1, top + 4],
          [x - w - 1, top + 4],
        ],
        R.canvas.m
      );
      f.poly(
        [
          [x - w - 1, top + 6],
          [x + w + 1, top + 6],
          [x + w + 2, top + 11],
          [x - w - 2, top + 11],
        ],
        R.canvas.m
      );
    }
    f.poly(
      [
        [24, 13],
        [30, 10],
        [29, 14],
      ],
      R.canvas.m
    );
    f.bevel(R.canvas);
    f.set(15, 0, R.red.m).set(16, 0, R.red.m);
    // hull with a gun deck stripe and ports
    f.poly(
      [
        [2, 16],
        [27, 16],
        [30, 13],
        [29, 18],
        [26, 23],
        [5, 23],
        [2, 19],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.rect(1, 14, 5, 3, R.wood.m).bevel(R.wood);
    f.line(3, 18, 28, 18, R.straw.m).line(3, 20, 27, 20, R.straw.m);
    for (let x = 5; x <= 25; x += 3) f.set(x, 19, OUTLINE);
    waves(f, 24, 3, 28);
  },
  ironclad: (f) => {
    // smoke
    f.ball(10, 5, 3.5, 3, R.smoke).ball(5, 3, 2.5, 2.2, R.smoke).ball(15, 7, 2.5, 2.5, R.smoke);
    // funnel
    f.rect(14, 8, 4, 8, R.dark.l).bevel(R.dark);
    f.rect(14, 8, 4, 1, R.dark.d);
    f.rect(14, 11, 4, 1, R.red.m);
    // casemate
    f.poly(
      [
        [9, 13],
        [23, 13],
        [26, 17],
        [6, 17],
      ],
      R.steel.m
    ).bevel(R.steel);
    for (const x of [10, 15, 20]) f.rect(x, 15, 2, 1, OUTLINE);
    f.line(21, 15, 26, 15, R.dark.m);
    // flagstaff
    f.line(4, 11, 4, 17, R.wood.d).rect(5, 11, 3, 2, R.red.m);
    // low iron hull with a ram bow
    f.poly(
      [
        [2, 17],
        [28, 17],
        [31, 21],
        [26, 22],
        [4, 22],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.line(3, 19, 28, 19, R.dark.l);
    waves(f, 23, 2, 29);
  },
  transport: (f) => {
    // derricks
    f.line(7, 4, 7, 14, R.wood.d).line(7, 4, 11, 12, R.wood.m);
    f.line(25, 4, 25, 14, R.wood.d).line(25, 4, 21, 12, R.wood.m);
    // superstructure
    f.rect(11, 9, 10, 6, R.white.m).bevel(R.white);
    for (let x = 12; x < 20; x += 2) f.set(x, 11, R.blue.d);
    // two funnels
    for (const x of [13, 17]) {
      f.rect(x, 3, 3, 6, R.red.m).bevel(R.red);
      f.rect(x, 3, 3, 2, R.dark.m);
    }
    // hatches and hull
    f.poly(
      [
        [2, 14],
        [29, 14],
        [31, 11],
        [30, 17],
        [27, 23],
        [5, 23],
        [2, 19],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.rect(4, 13, 6, 2, R.wood.m).rect(22, 13, 6, 2, R.wood.m);
    f.line(2, 15, 30, 15, R.white.l);
    f.poly(
      [
        [3, 20],
        [29, 20],
        [27, 23],
        [5, 23],
      ],
      R.red.m
    );
    f.line(4, 20, 29, 20, R.red.l);
    waves(f, 24, 3, 28);
  },
  cruiser: (f) => {
    // hull
    f.poly(
      [
        [3, 15],
        [29, 14],
        [27, 20],
        [5, 20],
        [3, 18],
      ],
      R.steel.m
    ).bevel(R.steel);
    f.line(4, 18, 27, 18, R.steel.d);
    // mast
    f.line(15, 1, 15, 12, R.dark.l).line(13, 4, 17, 4, R.dark.l);
    // superstructure and funnel
    f.rect(12, 9, 7, 6, R.steel.m).bevel(R.steel);
    f.rect(19, 6, 3, 9, R.steel.m).bevel(R.steel);
    f.rect(19, 6, 3, 1, R.dark.m);
    f.rect(13, 10, 5, 1, OUTLINE);
    // two turrets, guns outboard
    for (const [x, dir] of [
      [7, -1],
      [24, 1],
    ]) {
      f.line(x + dir * 2, 12, x + dir * 6, 11, R.dark.m);
      f.poly(
        [
          [x - 3, 15],
          [x - 2, 12],
          [x + 2, 12],
          [x + 3, 15],
        ],
        R.metal.m
      ).bevel(R.metal);
    }
    waves(f, 21, 4, 27);
  },
  battleship: (f) => {
    // long heavy hull
    f.poly(
      [
        [1, 15],
        [31, 13],
        [29, 22],
        [3, 22],
        [1, 18],
      ],
      R.steel.m
    ).bevel(R.steel);
    f.line(2, 18, 29, 18, R.steel.d);
    f.line(2, 20, 29, 20, R.steel.d);
    // pagoda mast
    f.rect(13, 1, 3, 3, R.steel.m).rect(12, 4, 5, 3, R.steel.m).rect(11, 7, 7, 5, R.steel.m).bevel(R.steel);
    f.rect(12, 2, 3, 1, OUTLINE).rect(12, 8, 5, 1, OUTLINE);
    f.line(14, 0, 14, 1, R.dark.l);
    // funnel and deckhouse
    f.rect(18, 6, 4, 7, R.steel.m).bevel(R.steel);
    f.rect(18, 6, 4, 1, R.dark.m);
    f.rect(10, 11, 13, 4, R.steel.m).bevel(R.steel);
    // three twin-gun turrets: two forward (one superfiring), one aft
    for (const [x, dir, y] of [
      [26, 1, 14],
      [6, -1, 15],
      [23, 1, 11],
    ]) {
      f.line(x + dir * 2, y - 3, x + dir * 7, y - 4, R.dark.m).line(x + dir * 2, y - 2, x + dir * 7, y - 3, R.dark.m);
      f.poly(
        [
          [x - 3, y],
          [x - 2, y - 3],
          [x + 2, y - 3],
          [x + 3, y],
        ],
        R.metal.m
      ).bevel(R.metal);
    }
    waves(f, 23, 2, 29);
  },
  carrier: (f) => {
    // hull side
    f.poly(
      [
        [1, 18],
        [27, 18],
        [31, 14],
        [30, 21],
        [26, 25],
        [4, 25],
        [1, 21],
      ],
      R.steel.m
    ).bevel(R.steel);
    // flight deck seen from above
    f.poly(
      [
        [1, 11],
        [25, 11],
        [31, 14],
        [27, 18],
        [1, 18],
      ],
      R.dark.l
    );
    f.line(1, 11, 25, 11, R.steel.h);
    for (let x = 3; x < 24; x += 4) f.line(x, 14, x + 1, 14, R.white.l);
    f.line(4, 17, 25, 12, R.straw.l);
    // island on the right
    f.rect(20, 4, 4, 9, R.steel.m).bevel(R.steel);
    f.rect(21, 6, 2, 1, OUTLINE);
    f.line(22, 1, 22, 4, R.dark.l).line(20, 2, 24, 2, R.dark.l);
    f.rect(19, 9, 6, 3, R.steel.m).bevel(R.steel);
    // a tiny plane on deck
    f.line(8, 12, 8, 16, R.white.h).line(6, 14, 10, 14, R.white.h).line(7, 16, 9, 16, R.white.h);
    f.set(12, 15, R.white.m).set(11, 15, R.white.m).set(12, 14, R.white.m).set(12, 16, R.white.m);
    waves(f, 26, 3, 28);
  },
  submarine: (f) => {
    // periscope and conning tower
    f.line(17, 3, 17, 10, R.dark.l).line(17, 3, 19, 3, R.dark.l);
    f.poly(
      [
        [12, 10],
        [19, 10],
        [21, 17],
        [11, 17],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.rect(13, 12, 5, 1, R.steel.m);
    // hull
    f.ball(16, 18.5, 14, 3.4, R.dark);
    f.line(4, 17, 28, 17, R.dark.l);
    f.rect(24, 16, 2, 1, R.steel.l);
    // sea washing over the lower hull
    for (let x = 1; x <= 30; x++) {
      if (!f.get(x, 19) && !f.get(x, 20)) continue;
      f.set(x, 20, R.sea.m).set(x, 21, R.sea.d);
      if (f.get(x, 22)) f.set(x, 22, R.sea.d);
    }
    for (let x = 2; x <= 30; x += 4) f.set(x, 19, R.sea.h).set(x + 1, 19, R.sea.h);
    waves(f, 23, 2, 29);
    f.set(3, 15, R.sea.h).set(29, 16, R.sea.h);
  },
  bomber: (f) => {
    // wings, wide and swept slightly
    f.poly(
      [
        [1, 13],
        [14, 10],
        [18, 10],
        [31, 13],
        [31, 16],
        [18, 15],
        [14, 15],
        [1, 16],
      ],
      R.metal.m
    ).bevel(R.metal);
    // four engines
    for (const x of [5, 10, 22, 27]) {
      f.ball(x + 0.5, 11, 1.6, 3, R.dark);
      f.line(x - 2, 8, x + 2, 8, R.steel.h);
    }
    // tailplane and twin fins
    f.poly(
      [
        [9, 26],
        [23, 26],
        [23, 29],
        [9, 29],
      ],
      R.metal.m
    ).bevel(R.metal);
    f.rect(9, 25, 2, 5, R.red.m).rect(21, 25, 2, 5, R.red.m);
    // fuselage
    f.ball(16, 15.5, 3, 14, R.metal);
    // glazed nose
    f.ball(16, 3.5, 2, 2.4, R.blue);
    f.set(15, 3, R.blue.h);
    // stars
    for (const cx of [8, 24]) f.ellipse(cx, 14, 1.6, 1.4, R.white.h).set(cx, 14, R.blue.m);
  },
  nuclear: (f) => {
    // exhaust flame
    f.poly(
      [
        [2, 30],
        [9, 18],
        [13, 22],
      ],
      R.fire.m
    );
    f.poly(
      [
        [5, 26],
        [10, 19],
        [12, 21],
      ],
      R.fire.l
    );
    f.line(9, 20, 10, 21, R.fire.h);
    f.set(1, 29, R.fire.d).set(3, 25, R.fire.d).set(6, 29, R.fire.d);
    // fins
    f.poly(
      [
        [6, 16],
        [12, 15],
        [11, 19],
      ],
      R.dark.m
    ).poly(
      [
        [13, 23],
        [16, 26],
        [11, 21],
      ],
      R.dark.m
    );
    f.poly(
      [
        [10, 15],
        [14, 12],
        [12, 17],
      ],
      R.red.m
    ).poly(
      [
        [16, 20],
        [19, 18],
        [15, 22],
      ],
      R.red.m
    );
    // white body on a launch angle
    f.line(11, 20, 25, 6, R.white.m, 4);
    f.line(10, 19, 24, 5, R.white.l, 1).line(12, 22, 26, 8, R.white.d, 1);
    f.line(15, 15, 17, 17, R.dark.m).line(19, 11, 21, 13, R.dark.m);
    // red nose cone
    f.poly(
      [
        [23, 4],
        [30, 1],
        [27, 8],
      ],
      R.red.m
    ).bevel(R.red);
  },
});

// The units Civilization II's rules have beyond Civilization's, drawn from SPEC.md as the others are: each on a 32px
//  figure layer that `unit()` outlines and sets on the player's badge.
const { R, OUTLINE, ramp } = require('./lib');

const ORANGE = ramp('#7a3008', '#c85a14', '#f08830', '#ffb868'),
  GREY = ramp('#4a4c54', '#8a8c94', '#b4b6bc', '#dcdee2'),
  JUNGLE = ramp('#1e2c14', '#34502a', '#4e7038', '#6c8c4c'),
  SAND = ramp('#5c4c28', '#9a8450', '#c4ae74', '#e0cc96'),
  STEALTH = ramp('#0c0c10', '#24262c', '#3a3c44', '#565862'),
  ELEPHANT = ramp('#3a3a40', '#6c6a70', '#94929a', '#b4b2ba');

// A short run of sea with foam crests under a hull, as the other ships have.
const waves = (f, y, x0, x1) => {
  for (let x = x0; x <= x1; x++) {
    const k = (x - x0) % 6;
    if (k < 4) f.set(x, y + (k === 0 || k === 3 ? 1 : 0), R.sea.m);
    if (k === 1 || k === 2) f.set(x, y, R.sea.h);
  }
};

// A horse facing right, as the horseman's, in `coat`; at the gallop its legs reach out front and back.
const horse = (f, coat = R.horse, gallop = false) => {
  f.line(6, 15, gallop ? 2 : 4, gallop ? 19 : 22, coat.d, 2);
  const legs = gallop
    ? [
        [8, 20, 3, 25, 1],
        [11, 20, 7, 26, 0],
        [19, 20, 25, 24, 1],
        [22, 19, 28, 22, 0],
      ]
    : [
        [8, 20, 8, 27, 0],
        [11, 20, 10, 27, 1],
        [19, 20, 19, 27, 0],
        [22, 20, 21, 27, 1],
      ];
  for (const [x0, y0, x1, y1, d] of legs) f.line(x0, y0, x1, y1, d ? coat.d : coat.m, 2);
  f.ball(14, 17, 8.5, 4.6, coat);
  f.poly(
    [
      [19, 17],
      [21, 10],
      [24, 8],
      [25, 12],
      [23, 18],
    ],
    coat.m
  ).bevel(coat);
  f.poly(
    [
      [23, 8],
      [28, 10],
      [28, 13],
      [25, 13],
    ],
    coat.m
  ).bevel(coat);
  f.set(24, 9, OUTLINE).set(22, 7, coat.d);
  f.line(20, 10, 23, 7, coat.d);
};

// A mounted rider's body and leg, in `coat`, head at the top; the hat or helmet is drawn over.
const rider = (f, coat) => {
  f.poly(
    [
      [12, 6],
      [17, 6],
      [17, 14],
      [12, 14],
    ],
    coat.m
  ).bevel(coat);
  f.line(14, 14, 13, 19, coat.d, 2);
  f.ball(14.5, 3.5, 2.6, 2.8, R.skin);
  f.set(16, 3, OUTLINE);
};

// A standing figure's legs, boots and body in `coat`, its head at (16.5, 8): the start of most foot soldiers.
const stand = (f, coat, legs = R.dark, boots = R.wood.d) => {
  f.rect(14, 21, 2, 5, legs.m).rect(18, 21, 2, 5, legs.d);
  f.rect(13, 26, 3, 2, boots).rect(18, 26, 3, 2, boots);
  f.poly(
    [
      [12, 11],
      [21, 11],
      [22, 22],
      [12, 22],
    ],
    coat.m
  ).bevel(coat);
  f.ball(16.5, 8, 3, 3.2, R.skin);
  f.set(18, 8, OUTLINE);
};

module.exports = {
  archer: (f) => {
    // quiver on the back
    f.rect(9, 9, 3, 9, R.wood.m).bevel(R.wood);
    f.set(9, 8, R.canvas.l).set(10, 7, R.red.l).set(11, 8, R.canvas.l);
    stand(f, ramp('#1a3a14', '#2e6024', '#4a8a36', '#6aaa50'), R.wood);
    f.rect(12, 18, 10, 1, R.wood.d);
    // hood
    f.poly(
      [
        [13, 8],
        [15, 4],
        [19, 4],
        [20, 7],
        [19, 6],
        [14, 6],
      ],
      ramp('#1a3a14', '#2e6024', '#4a8a36', '#6aaa50').m
    );
    f.set(14, 9, '#2e6024').set(13, 10, '#2e6024');
    // longbow drawn to the right, the arrow nocked
    for (let y = 2; y <= 24; y++) {
      const t = (y - 13) / 11;
      f.set(Math.round(26 - 4 * t * t), y, R.wood.m);
    }
    f.line(26, 2, 19, 13, R.white.m).line(19, 13, 26, 24, R.white.m);
    f.line(19, 13, 29, 13, R.wood.l);
    f.set(30, 13, R.metal.h).set(18, 12, R.red.l).set(18, 14, R.red.l);
    f.line(21, 12, 25, 13, R.skin.m, 2);
    f.ball(19, 13, 1.4, 1.4, R.skin);
  },
  pikeman: (f) => {
    // pike, upright and slanting forward
    f.line(12, 29, 25, 0, R.wood.m).line(13, 29, 26, 0, R.wood.d);
    f.line(25, 0, 26, 2, R.metal.h);
    stand(f, R.red, R.dark, R.wood.d);
    // breastplate
    f.poly(
      [
        [13, 11],
        [20, 11],
        [20, 18],
        [16.5, 20],
        [13, 18],
      ],
      R.metal.m
    ).bevel(R.metal);
    f.line(16, 12, 16, 18, R.metal.h);
    // morion: a high comb and an upturned brim
    f.ellipse(16.5, 5.6, 5.5, 1.3, R.metal.m);
    f.set(11, 4, R.metal.m).set(22, 4, R.metal.m);
    f.ball(16.5, 4, 2.8, 2.2, R.metal);
    f.rect(16, 0, 2, 3, R.metal.l);
    f.ball(20, 15, 1.5, 1.5, R.skin).ball(16, 20, 1.5, 1.5, R.skin);
  },
  crusader: (f) => {
    horse(f, GREY);
    f.rect(10, 13, 9, 4, R.white.m).bevel(R.white);
    f.line(14, 13, 14, 16, R.red.m).line(12, 14, 16, 14, R.red.m);
    rider(f, R.white);
    f.line(14, 7, 14, 13, R.red.m).line(12, 9, 16, 9, R.red.m);
    // great helm, flat topped, with an eye slit
    f.rect(12, 0, 6, 6, R.metal.m).bevel(R.metal);
    f.rect(14, 2, 4, 1, OUTLINE);
    // sword raised
    f.line(17, 8, 19, 6, R.skin.m, 2);
    f.rect(18, 5, 3, 1, R.bronze.l);
    f.line(20, 4, 24, 0, R.metal.h).line(21, 4, 25, 0, R.metal.l);
    f.ball(19, 6, 1.3, 1.3, R.skin);
  },
  elephant: (f) => {
    // legs, thick and wrinkled at the foot
    for (const [x, d] of [
      [6, 1],
      [10, 0],
      [17, 1],
      [21, 0],
    ])
      f.rect(x, 19, 3, 8, d ? ELEPHANT.d : ELEPHANT.m).rect(x, 26, 3, 1, ELEPHANT.l);
    // tail
    f.line(3, 13, 2, 19, ELEPHANT.d);
    // body and head
    f.ball(13, 15, 10.5, 6.5, ELEPHANT);
    f.ball(24, 12, 5, 5, ELEPHANT);
    // trunk curling down
    f.line(28, 13, 29, 20, ELEPHANT.m, 2).line(29, 20, 27, 24, ELEPHANT.m, 2);
    f.set(26, 24, ELEPHANT.d);
    // tusk
    f.line(25, 17, 29, 18, R.white.h).line(29, 18, 30, 16, R.white.h);
    // ear
    f.ellipse(21, 13, 2.6, 4, ELEPHANT.d).ellipse(21, 12.5, 1.6, 3, ELEPHANT.m);
    f.set(26, 10, OUTLINE);
    // red saddle cloth with a gold hem, and the rider
    f.poly(
      [
        [7, 9],
        [19, 9],
        [18, 17],
        [8, 17],
      ],
      R.red.m
    ).bevel(R.red);
    f.line(8, 16, 18, 16, R.straw.l);
    f.rect(11, 4, 6, 5, R.blue.m).bevel(R.blue);
    f.ball(14, 2.2, 2.2, 2.2, R.skin);
    f.rect(12, 0, 5, 1, R.white.h);
    f.set(15, 2, OUTLINE);
    f.line(9, 9, 22, 0, R.wood.m);
    f.set(22, 0, R.metal.h).set(23, 0, R.metal.h);
  },
  dragoon: (f) => {
    horse(f);
    f.rect(11, 13, 7, 4, R.red.m).bevel(R.red);
    rider(f, R.blue);
    f.line(12, 10, 17, 10, R.white.l);
    // carbine on the shoulder
    f.line(11, 13, 19, 3, R.wood.d, 1).line(16, 6, 19, 2, R.dark.l);
    // crested brass helmet with a black plume
    f.ball(14.5, 2, 3, 2.2, R.bronze);
    f.line(12, 0, 17, 0, R.dark.m).line(11, 1, 12, 4, R.dark.m);
    f.ball(16, 9, 1.3, 1.3, R.skin);
  },
  cavalry: (f) => {
    horse(f, R.horse, true);
    f.rect(11, 13, 7, 4, R.olive.m).bevel(R.olive);
    rider(f, R.khaki);
    // slouch hat, one side pinned up
    f.ellipse(14.5, 1.5, 4.5, 1.2, R.khaki.d).rect(13, 0, 4, 1, R.khaki.m);
    f.set(11, 0, R.khaki.d);
    // sabre pointed forward
    f.line(17, 8, 20, 8, R.khaki.m, 2);
    f.line(21, 8, 30, 4, R.metal.h).line(21, 9, 30, 5, R.metal.l);
    f.ball(20.5, 8, 1.3, 1.3, R.skin);
  },
  alpinetrooper: (f) => {
    // pack with a coil of rope
    f.rect(8, 11, 4, 9, R.olive.m).bevel(R.olive);
    f.ellipse(9.5, 10, 3, 2, R.straw.d).ellipse(9.5, 10, 1.6, 0.9, null);
    f.set(9, 10, null).set(10, 10, null);
    stand(f, R.white, R.white, R.dark.m);
    f.rect(12, 18, 10, 1, R.steel.m);
    // white hood and goggles
    f.ball(16.5, 6.5, 3.6, 3, R.white);
    f.rect(14, 8, 5, 3, R.skin.m);
    f.rect(14, 8, 5, 1, R.dark.m).set(15, 8, R.blue.l).set(17, 8, R.blue.l);
    // ice axe raised
    f.line(21, 12, 24, 8, R.white.m, 2);
    f.line(24, 9, 27, 2, R.wood.m);
    f.line(25, 2, 29, 3, R.steel.l).set(24, 2, R.steel.m);
    f.ball(24, 8, 1.4, 1.4, R.dark);
  },
  fanatic: (f) => {
    // robe to the ground
    f.rect(13, 26, 3, 2, R.dark.d).rect(18, 26, 3, 2, R.dark.d);
    f.poly(
      [
        [13, 11],
        [20, 11],
        [23, 26],
        [10, 26],
      ],
      R.dark.m
    ).bevel(R.dark);
    f.line(16, 12, 16, 25, R.dark.d);
    // both arms raised, the rifle held over the head
    f.line(13, 12, 10, 4, R.dark.l, 2).line(20, 12, 23, 4, R.dark.l, 2);
    f.ball(10, 3.5, 1.4, 1.4, R.skin).ball(23, 3.5, 1.4, 1.4, R.skin);
    f.line(5, 3, 28, 2, R.wood.m, 2);
    f.line(22, 2, 29, 2, R.dark.l);
    f.ball(16.5, 8, 3, 3.2, R.skin);
    f.set(18, 8, OUTLINE);
    // red headband, its tails flying
    f.rect(13, 6, 7, 1, R.red.m);
    f.line(13, 6, 11, 8, R.red.m).set(12, 8, R.red.d);
    f.rect(14, 5, 5, 1, R.dark.d);
  },
  partisan: (f) => {
    stand(f, JUNGLE, R.dark, R.dark.d);
    // bandolier
    f.line(13, 11, 21, 21, R.wood.d);
    for (let i = 0; i < 4; i++) f.set(14 + i * 2, 13 + i * 2.5, R.bronze.l);
    // beret, pulled to one side
    f.ellipse(16, 5.5, 4, 1.8, R.dark.m);
    f.set(20, 5, R.dark.m).set(15, 4, R.dark.l);
    // rifle across the body
    f.line(9, 23, 25, 8, R.wood.m, 2);
    f.line(20, 12, 26, 7, R.dark.l);
    f.ball(13, 19, 1.5, 1.5, R.skin).ball(20, 13, 1.5, 1.5, R.skin);
  },
  paratrooper: (f) => {
    // open canopy, panels alternating
    f.poly(
      [
        [3, 9],
        [6, 3],
        [11, 0],
        [21, 0],
        [26, 3],
        [29, 9],
        [25, 8],
        [20, 9],
        [16, 8],
        [12, 9],
        [7, 8],
      ],
      R.white.m
    );
    for (const x of [8, 16, 24]) for (let y = 0; y < 10; y++) if (f.get(x, y)) f.set(x, y, R.white.d);
    f.bevel(R.white);
    // lines down to the harness
    f.line(4, 9, 14, 17, R.canvas.d).line(28, 9, 18, 17, R.canvas.d);
    f.line(12, 9, 15, 17, R.canvas.d).line(20, 9, 17, 17, R.canvas.d);
    // the soldier, small, legs together
    f.rect(14, 17, 5, 6, R.olive.m).bevel(R.olive);
    f.rect(14, 23, 2, 4, R.olive.d).rect(17, 23, 2, 4, R.olive.d);
    f.rect(14, 27, 2, 1, R.dark.m).rect(17, 27, 2, 1, R.dark.m);
    f.ball(16.5, 15, 2, 2, R.skin);
    f.ball(16.5, 14, 2.2, 1.6, R.olive);
    f.line(13, 18, 13, 21, R.olive.d).line(19, 18, 19, 21, R.olive.d);
  },
  marine: (f) => {
    stand(f, JUNGLE, JUNGLE, R.dark.d);
    // camouflage blotches
    for (const [x, y] of [
      [14, 13],
      [19, 15],
      [15, 19],
      [20, 20],
    ])
      f.rect(x, y, 2, 1, R.wood.d);
    // dark green helmet
    f.ellipse(16.5, 6, 4.6, 1.3, JUNGLE.d);
    f.ball(16.5, 5, 3.4, 2.4, JUNGLE);
    // rifle held up
    f.line(21, 13, 23, 9, JUNGLE.m, 2);
    f.line(23, 14, 24, 1, R.dark.l, 1).line(24, 14, 25, 1, R.wood.m);
    f.ball(23.5, 9, 1.4, 1.4, R.skin);
    // surf about the boots
    for (let x = 9; x <= 25; x++) f.set(x, 26, (x + 1) % 4 < 2 ? R.sea.h : R.sea.m);
    for (let x = 10; x <= 24; x++) f.set(x, 27, R.sea.d);
  },
  engineer: (f) => {
    stand(f, ORANGE, ORANGE, R.dark.m);
    // overall bib and straps
    f.rect(14, 13, 5, 4, ORANGE.l);
    f.line(14, 11, 14, 13, ORANGE.d).line(19, 11, 19, 13, ORANGE.d);
    // yellow hard hat
    f.ellipse(16.5, 5.8, 4.6, 1.2, R.straw.d);
    f.ball(16.5, 4.6, 3.2, 2.4, R.straw);
    f.line(16, 3, 16, 5, R.straw.h);
    // pickaxe over the shoulder
    f.line(9, 22, 22, 7, R.wood.m, 1).line(10, 22, 23, 7, R.wood.d, 1);
    f.line(19, 4, 25, 9, R.steel.m, 2);
    f.set(18, 3, R.steel.l).set(26, 10, R.steel.d);
    f.ball(14, 17, 1.5, 1.5, R.skin).ball(20, 10, 1.5, 1.5, R.skin);
  },
  explorer: (f) => {
    // backpack
    f.rect(8, 11, 4, 9, R.wood.m).bevel(R.wood);
    f.rect(8, 9, 4, 2, R.canvas.m);
    stand(f, R.khaki, R.khaki, R.wood.d);
    f.rect(12, 17, 10, 1, R.wood.d).set(16, 17, R.bronze.l);
    f.rect(13, 13, 2, 2, R.khaki.d).rect(19, 13, 2, 2, R.khaki.d);
    // pith helmet
    f.ellipse(16.5, 6, 5, 1.2, R.khaki.l);
    f.ball(16.5, 4.6, 3.4, 2.8, R.canvas);
    f.rect(13, 5, 7, 1, R.wood.d);
    // walking staff
    f.line(11, 28, 10, 10, R.wood.l);
    f.ball(10.5, 15, 1.4, 1.4, R.skin);
    // telescope raised to the right
    f.line(21, 12, 23, 9, R.khaki.m, 2);
    f.line(23, 8, 29, 6, R.bronze.m, 2).set(29, 5, R.bronze.d).set(29, 6, R.bronze.d);
    f.ball(23, 9, 1.4, 1.4, R.skin);
  },
  spy: (f) => {
    // trench coat, belted, collar up
    f.rect(14, 23, 2, 3, R.dark.l).rect(18, 23, 2, 3, R.dark.l);
    f.rect(13, 26, 3, 2, OUTLINE).rect(18, 26, 3, 2, R.dark.m);
    f.poly(
      [
        [12, 10],
        [21, 10],
        [23, 24],
        [10, 24],
      ],
      R.camel.m
    ).bevel(R.camel);
    f.rect(11, 17, 12, 1, R.camel.d).rect(16, 17, 2, 1, R.bronze.l);
    f.line(16, 11, 16, 23, R.camel.d);
    f.poly(
      [
        [12, 9],
        [15, 11],
        [12, 13],
      ],
      R.camel.l
    ).poly(
      [
        [21, 9],
        [18, 11],
        [21, 13],
      ],
      R.camel.d
    );
    // hands in the pockets
    f.set(12, 19, R.camel.d).set(21, 19, R.camel.d);
    // face, dark glasses, fedora
    f.ball(16.5, 8, 3, 3.2, R.skin);
    f.rect(14, 7, 5, 1, OUTLINE).set(16, 8, OUTLINE);
    f.ellipse(16.5, 5, 5.4, 1.2, R.dark.m);
    f.rect(14, 2, 6, 3, R.dark.m).bevel(R.dark);
    f.rect(14, 4, 6, 1, R.dark.d);
    f.set(16, 2, R.dark.d).set(17, 2, R.dark.d);
  },
  howitzer: (f) => {
    // thick barrel, raised high
    f.line(13, 9, 28, 1, SAND.d, 3);
    f.line(13, 8, 27, 0, SAND.l);
    f.rect(26, 0, 4, 3, SAND.d);
    // hull
    f.poly(
      [
        [3, 15],
        [27, 15],
        [29, 19],
        [2, 19],
      ],
      SAND.m
    ).bevel(SAND);
    // big boxy turret, set back
    f.poly(
      [
        [5, 8],
        [19, 8],
        [20, 15],
        [4, 15],
      ],
      SAND.m
    ).bevel(SAND);
    f.rect(6, 6, 4, 2, SAND.d);
    f.rect(12, 11, 3, 1, OUTLINE);
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
  helicopter: (f) => {
    // rotor blur and mast
    f.line(1, 5, 31, 5, R.dark.l).line(5, 4, 27, 4, R.steel.l);
    f.rect(15, 6, 2, 3, R.dark.m);
    // tail boom and rotor
    f.line(3, 12, 10, 14, R.olive.m, 2);
    f.rect(2, 9, 2, 5, R.olive.d);
    f.ellipse(3, 11, 2.6, 2.6, R.steel.l).ellipse(3, 11, 1, 1, R.dark.m);
    // body
    f.ball(17, 14, 9, 5, R.olive);
    // cockpit glass at the front
    f.poly(
      [
        [21, 10],
        [25, 11],
        [26, 15],
        [21, 15],
      ],
      R.blue.m
    ).bevel(R.blue);
    f.set(22, 11, R.blue.h);
    // skids
    f.line(13, 19, 12, 22, R.dark.m).line(21, 19, 22, 22, R.dark.m);
    f.line(8, 23, 26, 23, R.dark.m);
    f.set(27, 22, R.dark.m);
  },
  stealthfighter: (f) => {
    // faceted body and sharply swept wings
    f.poly(
      [
        [16, 1],
        [20, 12],
        [29, 23],
        [20, 21],
        [18, 25],
        [14, 25],
        [12, 21],
        [3, 23],
        [12, 12],
      ],
      STEALTH.m
    ).bevel(STEALTH);
    // facet lines
    f.line(16, 3, 16, 24, STEALTH.d);
    f.line(16, 3, 9, 20, STEALTH.l).line(16, 3, 23, 20, STEALTH.d);
    // canopy
    f.poly(
      [
        [16, 6],
        [17.5, 10],
        [14.5, 10],
      ],
      ramp('#3a2a08', '#806010', '#c09030', '#f0d070').m
    );
    // two canted fins
    f.line(13, 19, 11, 27, STEALTH.l, 2).line(19, 19, 21, 27, STEALTH.d, 2);
  },
  stealthbomber: (f) => {
    // a flying wing with a saw-tooth trailing edge
    f.poly(
      [
        [16, 6],
        [31, 19],
        [28, 22],
        [23, 18],
        [19, 22],
        [16, 20],
        [13, 22],
        [9, 18],
        [4, 22],
        [1, 19],
      ],
      STEALTH.m
    ).bevel(STEALTH);
    // blended body and intakes
    f.ball(16, 13, 3, 5, STEALTH);
    f.line(13, 13, 14, 15, STEALTH.d).line(19, 13, 18, 15, STEALTH.d);
    f.poly(
      [
        [16, 8],
        [17, 10],
        [15, 10],
      ],
      ramp('#3a2a08', '#806010', '#c09030', '#f0d070').m
    );
  },
  cruisemissile: (f) => {
    // flame
    f.poly(
      [
        [1, 25],
        [6, 20],
        [7, 23],
      ],
      R.fire.m
    );
    f.line(4, 22, 6, 21, R.fire.h);
    // tail fins
    f.poly(
      [
        [6, 17],
        [10, 18],
        [8, 21],
      ],
      R.steel.d
    ).poly(
      [
        [8, 24],
        [11, 21],
        [12, 25],
      ],
      R.steel.d
    );
    // slim grey body on a slight climb
    f.line(7, 21, 27, 11, R.steel.m, 3);
    f.line(7, 20, 27, 10, R.steel.l);
    f.line(8, 22, 27, 12, R.steel.d);
    // nose
    f.poly(
      [
        [26, 10],
        [31, 9],
        [28, 13],
      ],
      R.steel.l
    );
    // stubby wings
    f.line(15, 17, 19, 22, R.steel.d, 2);
    f.line(17, 16, 15, 12, R.steel.l, 2);
  },
  destroyer: (f) => {
    // slim hull, high at the bow
    f.poly(
      [
        [3, 17],
        [30, 14],
        [27, 21],
        [5, 21],
        [3, 19],
      ],
      R.steel.m
    ).bevel(R.steel);
    f.line(4, 19, 27, 19, R.steel.d);
    // bridge and mast
    f.rect(16, 11, 5, 5, R.steel.m).bevel(R.steel);
    f.rect(17, 12, 3, 1, OUTLINE);
    f.line(18, 3, 18, 11, R.dark.l).line(16, 6, 20, 6, R.dark.l);
    // raked funnel
    f.poly(
      [
        [9, 9],
        [12, 9],
        [14, 16],
        [10, 16],
      ],
      R.steel.m
    ).bevel(R.steel);
    f.rect(9, 9, 3, 1, R.dark.m);
    // one turret forward
    f.line(25, 12, 29, 11, R.dark.m);
    f.poly(
      [
        [22, 16],
        [23, 13],
        [26, 13],
        [27, 16],
      ],
      R.metal.m
    ).bevel(R.metal);
    // bow wave
    f.line(27, 22, 31, 20, R.sea.h).set(30, 21, R.white.h);
    waves(f, 22, 4, 26);
  },
  missilecruiser: (f) => {
    // hull
    f.poly(
      [
        [2, 16],
        [30, 14],
        [28, 21],
        [4, 21],
        [2, 19],
      ],
      R.steel.m
    ).bevel(R.steel);
    f.line(3, 19, 28, 19, R.steel.d);
    // block superstructure with a radar mast
    f.rect(11, 9, 9, 7, R.steel.m).bevel(R.steel);
    f.rect(12, 10, 7, 1, OUTLINE);
    f.rect(13, 4, 4, 5, R.steel.m).bevel(R.steel);
    f.line(15, 0, 15, 4, R.dark.l);
    f.rect(10, 1, 11, 2, R.white.m).bevel(R.white);
    // box launchers fore and aft, angled up
    for (const [x, dir] of [
      [24, 1],
      [6, -1],
    ]) {
      f.poly(
        [
          [x - 3, 15],
          [x - 3 + dir * 1, 11],
          [x + 3 + dir * 1, 11],
          [x + 3, 15],
        ],
        R.dark.m
      ).bevel(R.dark);
      f.line(x - 2, 12, x + 2, 12, R.steel.l).line(x - 2, 14, x + 2, 14, R.steel.l);
    }
    waves(f, 22, 3, 28);
  },
  galleon: (f) => {
    // masts and yards
    for (const x of [11, 20]) f.line(x, x === 20 ? 0 : 2, x, 17, R.wood.d);
    f.line(22, 15, 30, 10, R.wood.d);
    // square sails, two to a mast
    for (const [x, top] of [
      [11, 3],
      [20, 1],
    ])
      for (const [y, h, w] of [
        [top, 5, 4],
        [top + 6, 6, 5],
      ])
        f.poly(
          [
            [x - w, y],
            [x + w, y],
            [x + w + 1, y + h / 2],
            [x + w, y + h],
            [x - w, y + h],
          ],
          R.canvas.m
        );
    f.bevel(R.canvas);
    f.poly(
      [
        [22, 13],
        [29, 10],
        [26, 15],
      ],
      R.canvas.l
    );
    // pennant
    f.line(20, 0, 24, 1, R.red.m).set(23, 0, R.red.l);
    // deep hull, high stern castle on the left, gilded trim
    f.poly(
      [
        [2, 11],
        [8, 11],
        [9, 16],
        [29, 16],
        [27, 22],
        [23, 24],
        [6, 24],
        [3, 21],
      ],
      R.wood.m
    ).bevel(R.wood);
    f.line(3, 12, 8, 12, R.bronze.l).line(4, 19, 27, 19, R.bronze.l);
    for (let x = 12; x < 26; x += 4) f.set(x, 21, OUTLINE);
    f.rect(4, 14, 3, 2, R.straw.l);
    waves(f, 25, 4, 27);
  },
  freight: (f) => {
    // hull
    f.poly(
      [
        [2, 16],
        [30, 16],
        [27, 23],
        [4, 23],
        [2, 19],
      ],
      R.blue.m
    ).bevel(R.blue);
    f.line(3, 21, 28, 21, R.red.m);
    // bridge at the stern
    f.rect(3, 8, 6, 8, R.white.m).bevel(R.white);
    f.rect(4, 10, 4, 1, OUTLINE);
    f.rect(5, 5, 2, 3, R.dark.m).set(5, 5, R.red.m).set(6, 5, R.red.m);
    // stacked containers
    const box = [R.red, R.blue, R.straw, R.olive, R.straw, R.red];
    let i = 0;
    for (const [x, y] of [
      [10, 12],
      [15, 12],
      [20, 12],
      [25, 12],
      [12, 8],
      [17, 8],
    ]) {
      const c = box[i++];
      f.rect(x, y, 5, 4, c.m);
      f.rect(x, y, 5, 1, c.l).rect(x + 4, y, 1, 4, c.d);
      f.set(x + 2, y + 2, c.d);
    }
    waves(f, 24, 3, 28);
  },
};

// Fails unless the committed packs are what the code draws: builds each afresh and compares every sprite's pixels (not
//  its bytes, which change with the zlib Node ships) and the descriptor. Then checks the hexagonal and isometric packs'
//  geometry: that their tiles cover the plane exactly once, that every sprite the shape of a tile keeps to its own
//  pixels, and that their patterns repeat on the lattice. `node tools/check-pack.js`
const fs = require('fs'),
  os = require('os'),
  path = require('path'),
  zlib = require('zlib'),
  { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');

// Width, height and the inflated scanlines of a PNG the pack's own writer made.
const pixels = (file) => {
  const buf = fs.readFileSync(file),
    idat = [];
  let width = 0,
    height = 0;
  for (let at = 8; at < buf.length; ) {
    const length = buf.readUInt32BE(at),
      type = buf.toString('ascii', at + 4, at + 8),
      data = buf.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') [width, height] = [data.readUInt32BE(0), data.readUInt32BE(4)];
    if (type === 'IDAT') idat.push(data);
    at += length + 12;
  }
  return `${width}x${height}:${zlib.inflateSync(Buffer.concat(idat)).toString('base64')}`;
};

const walk = (dir, base = dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]
    )
    .sort();

// The square pack, the hexagonal one and the isometric one, each with its descriptor.
const PACKS = [
  ['pack', 'tileset.json'],
  ['pack-hex', 'tileset-hex.json'],
  ['pack-iso', 'tileset-iso.json'],
];
let failed = false;
for (const [dir, manifest] of PACKS) {
  const committed = path.join(root, dir),
    fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-'));

  execFileSync(process.execPath, [path.join(root, 'src/build.js'), fresh, path.join(root, manifest)], {
    stdio: 'inherit',
  });

  const a = walk(committed),
    b = walk(fresh),
    problems = [
      ...a.filter((f) => !b.includes(f)).map((f) => `${f}: no longer drawn`),
      ...b.filter((f) => !a.includes(f)).map((f) => `${f}: drawn but not committed`),
    ];

  for (const f of a.filter((f) => b.includes(f))) {
    const [x, y] = [path.join(committed, f), path.join(fresh, f)];
    const same = f.endsWith('.png') ? pixels(x) === pixels(y) : fs.readFileSync(x).equals(fs.readFileSync(y));
    if (!same) problems.push(`${f}: differs`);
  }

  fs.rmSync(fresh, { recursive: true, force: true });

  if (problems.length) {
    console.error(`${dir} is not what the code draws (run npm run build):\n  ${problems.join('\n  ')}`);
    failed = true;
  } else console.log(`${dir} is what the code draws: ${a.length} files.`);
}

// ---------- the hexagonal and isometric packs' geometry ----------
// Each grid: its module, its sprites, where a tile's box goes, how often its small patterns repeat (`dither` across
//  and down, `glint`'s cells), and the sprites that are taller than a tile, reaching `tall` px above it.
const GRIDS = [
  {
    dir: 'pack-hex',
    grid: require('../src/hex'),
    sprites: require('../src/hex-map'),
    lnoise: [16, 12],
    dither: [4, 3],
    glint: { lit: 201, cell: [4, 3] },
    tall: 0,
    tallSprites: [],
    stack: null,
  },
  {
    dir: 'pack-iso',
    grid: require('../src/iso'),
    sprites: require('../src/iso-map'),
    lnoise: [32, 8],
    dither: [4, 4],
    glint: { lit: 201, cell: [4, 4] },
    // As far as the descriptor anchors units and cities above their tile.
    tall: -require('../tileset-iso.json').units.anchor.y,
    tallSprites: ['map/city', 'map/city_rim', 'map/fortify'],
    stack: require('../tileset-iso.json').units.stackOffset,
  },
];

for (const { dir, grid, sprites, lnoise, dither, glint, tall, tallSprites, stack } of GRIDS) {
  const { W, H, ROW, owns } = grid,
    // Odd rows are shifted half a tile across on both grids.
    shift = W / 2,
    geometry = [];

  // A full tile, as shipped, put down in rows covers every pixel away from the map's border exactly once.
  for (const name of ['terrain/land', 'terrain/ocean']) {
    const tile = sprites[name],
      cols = 6,
      rows = 8,
      w = cols * W + shift,
      h = rows * ROW + H - ROW,
      count = new Uint8Array(w * h);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) if (tile.get(x, y)) count[(r * ROW + y) * w + c * W + (r & 1) * shift + x]++;
    let bad = 0;
    for (let y = H; y < h - H; y++) for (let x = W; x < w - W; x++) if (count[y * w + x] !== 1) bad++;
    if (bad) geometry.push(`${name}: ${bad} pixels of a tiled map are covered other than once`);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (!!tile.get(x, y) !== owns(x, y)) {
          geometry.push(`${name}: does not fill exactly the pixels its tile owns`);
          y = H;
          break;
        }
  }

  // Every sprite drawn on the map's tiles (terrain, improvements, map and units, but not the shield, which the
  //  descriptor places) is the tile's size and draws only the pixels its tile owns, so it can't draw over a neighbour.
  //  One taller than a tile (units, and the isometric city and walls) is that much taller, its tile at the bottom, and
  //  draws only in its tile or above it, never beside its tile's lower half, where the neighbours in front are.
  for (const [name, s] of Object.entries(sprites)) {
    if (!/^(terrain|improvements|map|units)\//.test(name) || name === 'terrain/shield') continue;
    const up = tall && (name.startsWith('units/') || tallSprites.includes(name)) ? tall : 0;
    if (s.w !== W || s.h !== H + up) {
      geometry.push(`${name}: ${s.w} × ${s.h}, not ${W} × ${H + up}`);
      continue;
    }
    const allowed = (x, y) => owns(x, y - up) || (up && y - up < H / 2 && x >= 0 && x < W);
    let outside = 0;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) if (s.get(x, y) && !allowed(x, y)) outside++;
    if (outside) geometry.push(`${name}: ${outside} pixels outside its tile`);
    // A tall unit is drawn again behind a stack, `stack` px across and down, with its fortified wall: the copy keeps
    //  to the same rule. The wall, which is on the ground, is held to its tile's own pixels: its copy may not reach
    //  past the diamond's back edges either.
    if (stack && up && (name.startsWith('units/') || name === 'map/fortify')) {
      const fits = name === 'map/fortify' ? (x, y) => owns(x, y - up) : (x, y) => allowed(x, y);
      let spilt = 0;
      for (let y = 0; y < s.h; y++)
        for (let x = 0; x < W; x++) if (s.get(x, y) && !fits(x + stack.x, y + stack.y)) spilt++;
      if (spilt) geometry.push(`${name}: ${spilt} pixels of a stack's copy outside its tile`);
    }
  }

  // The patterns repeat on the lattice: a tile across, and a row down with half a tile's shift.
  for (const [name, f] of [
    ['lhash', (x, y) => grid.lhash(x, y, 1)],
    ['lnoise', (x, y) => grid.lnoise(x, y, ...lnoise, 1).toFixed(9)],
    ['dither', grid.dither],
    ['glint', (x, y) => grid.glint(x, y, glint.lit)],
  ])
    for (let y = -ROW; y < 2 * ROW; y++)
      for (let x = -W; x < 2 * W; x++)
        if (f(x, y) !== f(x + W, y) || f(x, y) !== f(x + shift, y + ROW)) {
          geometry.push(`${name}: does not repeat on the lattice at (${x}, ${y})`);
          y = 2 * ROW;
          break;
        }

  // The patterns that repeat every few pixels keep to their own small periods, so the lattice's period, which they
  //  divide, never cuts one: the dither, and each glint inside its own cell, which starts at a multiple of the cell's
  //  size in any tile's coordinates.
  const [dx, dy] = dither,
    [gx, gy] = glint.cell;
  for (let y = -ROW; y < 2 * ROW; y++)
    for (let x = -W; x < 2 * W; x++)
      if (grid.dither(x, y) !== grid.dither(x + dx, y) || grid.dither(x, y) !== grid.dither(x, y + dy)) {
        geometry.push(`dither: does not repeat every ${dx}px across and ${dy}px down, at (${x}, ${y})`);
        y = 2 * ROW;
        break;
      }
  for (let cy = -ROW; cy < 2 * ROW; cy += gy)
    for (let cx = -W; cx < 2 * W; cx += gx) {
      const lit = [];
      for (let y = cy; y < cy + gy; y++)
        for (let x = cx; x < cx + gx; x++) if (grid.glint(x, y, glint.lit)) lit.push([x, y]);
      if (lit.length && !(lit.length === 2 && lit[0][1] === lit[1][1] && lit[1][0] - lit[0][0] === 1)) {
        geometry.push(`glint: the cell at (${cx}, ${cy}) does not hold one whole 2px stroke`);
        cy = 2 * ROW;
        break;
      }
    }

  // The city keeps out from under its rim, which the game draws over it.
  {
    const city = sprites['map/city'],
      rim = sprites['map/city_rim'];
    let under = 0;
    for (let y = 0; y < city.h; y++) for (let x = 0; x < W; x++) if (city.get(x, y) && rim.get(x, y)) under++;
    if (under) geometry.push(`map/city: ${under} pixels under map/city_rim`);
  }

  if (geometry.length) {
    console.error(`${dir}'s geometry is wrong:\n  ${geometry.join('\n  ')}`);
    failed = true;
  } else console.log(`${dir}'s tiles cover the map once, its sprites keep to their tiles, and its patterns repeat.`);
}

process.exit(failed ? 1 : 0);

// Fails unless the committed packs are what the code draws: builds each afresh and compares every sprite's pixels (not
//  its bytes, which change with the zlib Node ships) and the descriptor. Then checks the hexagonal pack's geometry: that
//  its tiles cover the plane exactly once, that every sprite the shape of a tile keeps to its own pixels, and that its
//  patterns repeat on the lattice. `node tools/check-pack.js`
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

// The square pack and the hexagonal one, each with its descriptor.
const PACKS = [
  ['pack', 'tileset.json'],
  ['pack-hex', 'tileset-hex.json'],
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

// ---------- the hexagonal pack's geometry ----------
const hex = require('../src/hex'),
  sprites = require('../src/hex-map'),
  { W, H, ROW, owns } = hex,
  geometry = [];

// A full tile, as shipped, put down in odd-r rows covers every pixel away from the map's border exactly once.
for (const name of ['terrain/land', 'terrain/ocean']) {
  const tile = sprites[name],
    cols = 6,
    rows = 6,
    w = cols * W + W / 2,
    h = rows * ROW + H - ROW,
    count = new Uint8Array(w * h);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) if (tile.get(x, y)) count[(r * ROW + y) * w + c * W + (r & 1) * (W / 2) + x]++;
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
for (const [name, s] of Object.entries(sprites)) {
  if (!/^(terrain|improvements|map|units)\//.test(name) || name === 'terrain/shield') continue;
  if (s.w !== W || s.h !== H) {
    geometry.push(`${name}: ${s.w} × ${s.h}, not the tile's ${W} × ${H}`);
    continue;
  }
  let outside = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (s.get(x, y) && !owns(x, y)) outside++;
  if (outside) geometry.push(`${name}: ${outside} pixels outside its tile`);
}

// The patterns repeat on the lattice: 32px across, and 27px down with a 16px shift.
for (const [name, f] of [
  ['lhash', (x, y) => hex.lhash(x, y, 1)],
  ['lnoise', (x, y) => hex.lnoise(x, y, 16, 12, 1).toFixed(9)],
  ['dither', hex.dither],
  ['glint', (x, y) => hex.glint(x, y, 201)],
])
  for (let y = -ROW; y < 2 * ROW; y++)
    for (let x = -W; x < 2 * W; x++)
      if (f(x, y) !== f(x + W, y) || f(x, y) !== f(x + W / 2, y + ROW)) {
        geometry.push(`${name}: does not repeat on the lattice at (${x}, ${y})`);
        y = 2 * ROW;
        break;
      }

// The patterns that repeat every few pixels keep to their own small periods, so the lattice's period, which they divide,
//  never cuts one: the dither every 4px across and 3px down, and each glint inside its own 4 × 3 cell, which starts at
//  a multiple of 4 across and 3 down in any tile's coordinates.
for (let y = -ROW; y < 2 * ROW; y++)
  for (let x = -W; x < 2 * W; x++)
    if (hex.dither(x, y) !== hex.dither(x + 4, y) || hex.dither(x, y) !== hex.dither(x, y + 3)) {
      geometry.push(`dither: does not repeat every 4px across and 3px down, at (${x}, ${y})`);
      y = 2 * ROW;
      break;
    }
for (let cy = -ROW; cy < 2 * ROW; cy += 3)
  for (let cx = -W; cx < 2 * W; cx += 4) {
    const lit = [];
    for (let y = cy; y < cy + 3; y++) for (let x = cx; x < cx + 4; x++) if (hex.glint(x, y, 201)) lit.push([x, y]);
    if (lit.length && !(lit.length === 2 && lit[0][1] === lit[1][1] && lit[1][0] - lit[0][0] === 1)) {
      geometry.push(`glint: the cell at (${cx}, ${cy}) does not hold one whole 2px stroke`);
      cy = 2 * ROW;
      break;
    }
  }

// The city keeps inside its rim, which the game draws over it.
{
  const city = sprites['map/city'],
    rim = sprites['map/city_rim'];
  let under = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (city.get(x, y) && rim.get(x, y)) under++;
  if (under) geometry.push(`map/city: ${under} pixels under map/city_rim`);
}

if (geometry.length) {
  console.error(`pack-hex's geometry is wrong:\n  ${geometry.join('\n  ')}`);
  failed = true;
} else console.log("pack-hex's tiles cover the map once, its sprites keep to their tiles, and its patterns repeat.");

process.exit(failed ? 1 : 0);

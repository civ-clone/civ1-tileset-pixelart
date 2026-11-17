// Fails unless the committed packs are what the code draws: builds each afresh and compares every sprite's pixels (not
//  its bytes, which change with the zlib Node ships) and the descriptor. `node tools/check-pack.js`
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

process.exit(failed ? 1 : 0);

// Fails unless the committed pack is what the code draws: builds it afresh and compares every sprite's pixels (not
//  its bytes, which change with the zlib Node ships) and the descriptor. `node tools/check-pack.js`
const fs = require('fs'),
  os = require('os'),
  path = require('path'),
  zlib = require('zlib'),
  { execFileSync } = require('child_process');

const root = path.join(__dirname, '..'),
  committed = path.join(root, 'pack'),
  fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-'));

execFileSync(process.execPath, [path.join(root, 'src/build.js'), fresh, path.join(root, 'tileset.json')], {
  stdio: 'inherit',
});

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
  console.error(`The pack is not what the code draws (run npm run build):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

console.log(`The pack is what the code draws: ${a.length} files.`);

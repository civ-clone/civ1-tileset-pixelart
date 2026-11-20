// Drawing library for the original tileset: sprites are drawn with primitives, no source art is read.
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib');

const S = 32;
const OUTLINE = '#141018';
const KEY_L = '#60E064',
  KEY_B = '#2C7800';

const ramp = (d, m, l, h = l) => ({ d, m, l, h });
const R = {
  skin: ramp('#8a5230', '#c07a48', '#e0a070', '#f4c898'),
  wood: ramp('#4a2c14', '#7a4a22', '#a86a34', '#c88a4a'),
  metal: ramp('#3c4450', '#707c8a', '#a8b2bc', '#e4ecf2'),
  bronze: ramp('#6a4410', '#a8741c', '#d8a63a', '#fbe08a'),
  red: ramp('#5c1214', '#a02420', '#d44834', '#f07a5a'),
  blue: ramp('#1c2a5a', '#30489a', '#5070c8', '#7c9ae8'),
  canvas: ramp('#8c826c', '#c4bca2', '#e8e2ca', '#ffffff'),
  horse: ramp('#3c2010', '#6c3c1c', '#9c5e2c', '#c27e44'),
  fur: ramp('#3e2a18', '#6e5032', '#987450', '#b8946a'),
  straw: ramp('#8a6a20', '#c8a040', '#e8c860', '#f8e898'),
  olive: ramp('#283016', '#4c5a28', '#72823c', '#98a858'),
  dark: ramp('#141418', '#2c2e34', '#4a4c54', '#6c6e78'),
  stone: ramp('#5a5450', '#8c8680', '#b8b2aa', '#dcd6ce'),
  roof: ramp('#6a1c14', '#a8382a', '#d0604a', '#e88468'),
  roof2: ramp('#4a2c18', '#7c4c2c', '#a8704a', '#c89068'),
  plaster: ramp('#a08c6c', '#d4c4a0', '#f0e4c4', '#fff8e4'),
  steel: ramp('#3a3e44', '#6a7078', '#9aa0a6', '#c8ccd0'),
  khaki: ramp('#5a4a28', '#8c7a46', '#b4a26a', '#d4c490'),
  white: ramp('#8c929c', '#c8ccd4', '#eceef2', '#ffffff'),
  fire: ramp('#a02010', '#e05818', '#f8a028', '#fff070'),
  smoke: ramp('#3a3a40', '#6a6a72', '#9a9aa2', '#c8c8ce'),
  camel: ramp('#6c4820', '#a87c40', '#cca060', '#e8c888'),
  sea: ramp('#183a78', '#2c5cb0', '#5a8ad8', '#e8f4ff'),
};

class Spr {
  constructor(w = S, h = S) {
    this.w = w;
    this.h = h;
    this.p = new Array(w * h).fill(null);
  }
  in(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  get(x, y) {
    return this.in(x, y) ? this.p[y * this.w + x] : null;
  }
  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (c && this.in(x, y)) this.p[y * this.w + x] = c;
    return this;
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx,
          dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }
  // Shaded ellipse lit from the top left.
  ball(cx, cy, rx, ry, r) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx,
          dy = (y + 0.5 - cy) / ry,
          d = dx * dx + dy * dy;
        if (d > 1) continue;
        const lit = -(dx * 0.65 + dy * 0.75);
        this.set(x, y, lit > 0.55 && d < 0.5 ? r.h : lit > 0.15 ? r.l : lit > -0.45 ? r.m : r.d);
      }
    return this;
  }
  line(x0, y0, x1, y1, c, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n),
        y = Math.round(y0 + ((y1 - y0) * i) / n);
      this.rect(x - Math.floor((t - 1) / 2), y - Math.floor((t - 1) / 2), t, t, c);
    }
    return this;
  }
  poly(pts, c) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
      for (let x = 0; x < this.w; x++) {
        const px = x + 0.5,
          py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i],
            [xj, yj] = pts[j];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    return this;
  }
  // Light the top/left inner edge and darken the bottom/right inner edge of every region drawn in r.m.
  bevel(r, width = 1) {
    const src = this.p.slice(),
      at = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : null);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] !== r.m) continue;
        let dark = false,
          light = false;
        for (let k = 1; k <= width; k++) {
          if (at(x + k, y) !== r.m || at(x, y + k) !== r.m) dark = true;
          if (at(x - k, y) !== r.m || at(x, y - k) !== r.m) light = true;
        }
        if (dark) this.p[y * this.w + x] = r.d;
        else if (light) this.p[y * this.w + x] = r.l;
      }
    return this;
  }
  outline(c = OUTLINE) {
    const src = this.p.slice();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x]) continue;
        const n = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => this.in(x + dx, y + dy) && src[(y + dy) * this.w + x + dx]);
        if (n) this.p[y * this.w + x] = c;
      }
    return this;
  }
  over(o, ox = 0, oy = 0) {
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) this.set(x + ox, y + oy, o.p[y * o.w + x]);
    return this;
  }
  // Paint where `o` has pixels, offset by (dx, dy), only onto pixels that are already filled.
  shadow(o, c, dx = 1, dy = 1) {
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) if (o.p[y * o.w + x] && this.get(x + dx, y + dy)) this.set(x + dx, y + dy, c);
    return this;
  }
}

// Seeded noise.
const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (x, y, f, s) => {
  const xi = Math.floor(x / f),
    yi = Math.floor(y / f),
    tx = x / f - xi,
    ty = y / f - yi;
  const e = (t) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, s),
    b = hash(xi + 1, yi, s),
    c = hash(xi, yi + 1, s),
    d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * e(tx) + (c - a) * e(ty) + (a - b - c + d) * e(tx) * e(ty);
};
// World-space noise so neighbouring tiles of the same kind join up.
const fbm = (x, y, s) => smooth(x, y, 8, s) * 0.6 + smooth(x, y, 3, s + 7) * 0.3 + hash(x, y, s + 13) * 0.1;

// ---------- unit badge ----------
// A river's channel through a tile, as SPEC.md describes: from the middle of each joined edge (`mids`, by direction) to
//  the others, `r` wide where it crosses an edge and coming in square on, so it meets the neighbour's channel there.
//  Two edges are joined by one smooth curve, which meanders when they are opposite; three or more meet a little off
//  the middle, where the water widens; one ends in a spring; none is a pond. `ry` squashes it for a projection drawn flatter than it is wide.
//  Gives, for a pixel, how deep it is in the channel (above 0 in the water, 1 on its line) and how far beyond the
//  water it is, and how far it is from the edges along the channel (0 where it crosses one, 1 in the middle).
const channel = ({ w, h, centre, mids, mask, r, ry = 1, seed = 0 }) => {
  const [cx, cy] = centre,
    pts = [],
    rnd = (k) => hash(key(mask, k), k, seed),
    cubic = (a, b, c, d, t) =>
      a.map((_, i) => (1 - t) ** 3 * a[i] + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t * t * c[i] + t ** 3 * d[i]),
    toward = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f),
    // Square on to each crossed edge: a straight run from a little past it to a fifth of the way in, where it bends.
    inner = (d) => toward(mids[d], centre, 0.2),
    past = (d) => {
      for (let i = 0; i <= 14; i++) pts.push([...toward(mids[d], centre, -0.15 + 0.35 * (i / 14)), r, 0]);
    },
    // Along a curve from a to d through b and c, bent `amp` px to one side and swelling and narrowing as it goes.
    curve = (a, b, c, d, amp, k, rEnd = r) => {
      const n = 64,
        [ax, ay] = [d[0] - a[0], (d[1] - a[1]) / ry],
        al = Math.hypot(ax, ay) || 1,
        [nx, ny] = [-ay / al, (ax / al) * ry],
        ph = rnd(k) * Math.PI * 2;
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          env = Math.sin(Math.PI * t) ** 2,
          [x, y] = cubic(a, b, c, d, t),
          off = amp * Math.sin(2 * Math.PI * t) * env;
        pts.push([
          x + nx * off,
          y + ny * off,
          (r + (rEnd - r) * t) * (1 + 0.16 * Math.sin(3 * Math.PI * t + ph) * env),
          env,
        ]);
      }
    },
    blob = (x, y, rad, k) => {
      for (let i = 0; i < 3; i++) {
        const a = rnd(k + i) * Math.PI * 2,
          o = rad * 0.35;
        pts.push([x + Math.cos(a) * o, y + Math.sin(a) * o * ry, rad * (0.75 + rnd(k + i + 9) * 0.2), 1]);
      }
      pts.push([x, y, rad * 0.8, 1]);
    };
  mask.forEach(past);
  const side = (k) => (rnd(k) > 0.5 ? 1 : -1);
  if (mask.length === 2) {
    const [a, d] = mask.map(inner),
      opposite = Math.abs(a[0] + d[0] - 2 * cx) + Math.abs(a[1] + d[1] - 2 * cy) < 1;
    curve(a, toward(a, centre, 0.6), toward(d, centre, 0.6), d, opposite ? 1.8 * side(1) : 0.8 * side(1), 2);
  } else if (mask.length) {
    // The pool or spring sits a little off the middle, so the channels meet it each at its own angle.
    const a = rnd(3) * Math.PI * 2,
      pool = [cx + Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5 * ry];
    mask.forEach((m, i) =>
      curve(inner(m), toward(mids[m], centre, 0.5), toward(pool, mids[m], 0.25), pool, 0.9 * side(10 + i), 20 + i)
    );
    blob(pool[0], pool[1], r * (mask.length === 1 ? 1.35 : 1.3), 40);
  } else blob(cx, cy, r * 1.6, 40);
  const depth = new Float32Array(w * h),
    beyond = new Float32Array(w * h).fill(99),
    along = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let best = -Infinity,
        near = 99,
        env = 0;
      for (const [px, py, pr, e] of pts) {
        const d = Math.hypot(x + 0.5 - px, (y + 0.5 - py) / ry);
        if (1 - d / pr > best) {
          best = 1 - d / pr;
          env = e;
        }
        near = Math.min(near, d - pr);
      }
      depth[y * w + x] = best;
      beyond[y * w + x] = near;
      along[y * w + x] = env;
    }
  const at = (a) => (x, y) => x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : a === beyond ? 99 : 0;
  return { w, h, depth: at(depth), beyond: at(beyond), along: at(along) };
};
// The colour of a pixel of a river `channel`, given a smooth noise `n` and two hashes `h`, `g` there, all 0 to 1: water
//  darker along its line, an outline where it meets its bank, glints, and a muddy bank, wider here and there away from
//  the edges, with sand and reeds on it. Nothing for a pixel beyond the bank.
const RIVER = { water: ['#3c6cc4', '#4a7ad0', '#5888da'], deep: '#34609e', line: '#2c54a4', glint: '#a8c8f4' },
  BANKS = { mud: '#8c7a48', dark: '#6e6a34', sand: '#b8a46a', reed: '#3e6a24' };
const riverColour = (ch, x, y, n, h, g) => {
  const d = ch.depth(x, y);
  if (d > 0) {
    const edge = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => {
      const nx = x + dx,
        ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < ch.w && ny < ch.h && ch.depth(nx, ny) <= 0;
    });
    if (edge) return RIVER.line;
    if (d > 0.35 && h > 0.93) return RIVER.glint;
    if (d > 0.6 && n < 0.55) return RIVER.deep;
    return RIVER.water[Math.max(0, Math.min(2, Math.floor((n * 0.7 + (1 - d) * 0.5) * 3)))];
  }
  const b = ch.beyond(x, y),
    wide = ch.along(x, y) > 0.45 && n > 0.5;
  if (b < 1.2 || (wide && b < 2.3)) {
    if (b >= 1.2) return g > 0.7 ? BANKS.reed : BANKS.sand;
    return h > 0.5 ? BANKS.mud : BANKS.dark;
  }
  return null;
};
// A number fixed by a set of directions, so each mask's river is drawn its own way.
const key = (mask, k) => mask.reduce((s, d) => [...d].reduce((t, c) => (t * 131 + c.charCodeAt(0)) | 0, s * 7919), k);

const badge = () => {
  const b = new Spr();
  for (let y = 1; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      const cx = Math.min(Math.max(x, 4), 27),
        cy = Math.min(Math.max(y, 4), 27);
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 3.2) b.set(x, y, d > 2.2 || x === 1 || y === 1 || x === 30 || y === 30 ? KEY_B : KEY_L);
    }
  return b;
};
const unit = (draw) => {
  const f = new Spr();
  draw(f);
  f.outline();
  return badge().shadow(f, KEY_B, 1, 1).over(f);
};

// ---------- output ----------
// A minimal RGBA PNG writer, so the pack builds with no native dependencies.
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const length = Buffer.alloc(4),
    crc = Buffer.alloc(4),
    body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
};
const png = (spr, scale, file) => {
  const w = spr.w * scale,
    h = spr.h * scale,
    raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = spr.p[Math.floor(y / scale) * spr.w + Math.floor(x / scale)];
      if (!c) continue;
      const i = y * (w * 4 + 1) + 1 + x * 4;
      raw[i] = parseInt(c.slice(1, 3), 16);
      raw[i + 1] = parseInt(c.slice(3, 5), 16);
      raw[i + 2] = parseInt(c.slice(5, 7), 16);
      raw[i + 3] = 255;
    }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
};
const recolour = (spr, light, dark) => {
  const o = new Spr(spr.w, spr.h);
  o.p = spr.p.map((c) => (c === KEY_L ? light : c === KEY_B ? dark : c));
  return o;
};
module.exports = {
  S,
  OUTLINE,
  KEY_L,
  KEY_B,
  ramp,
  R,
  Spr,
  hash,
  smooth,
  fbm,
  channel,
  riverColour,
  RIVER,
  BANKS,
  badge,
  unit,
  png,
  recolour,
};

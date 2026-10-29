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
module.exports = { S, OUTLINE, KEY_L, KEY_B, ramp, R, Spr, hash, smooth, fbm, badge, unit, png, recolour };

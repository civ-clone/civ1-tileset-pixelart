// Combat burst: a flash that grows into fire and sparks, then turns to smoke that thins and breaks up.
const { Spr, R, hash, smooth } = require('./lib');

const RAD = [3, 5.5, 8, 10, 11.5, 12.5, 13, 13.5];
const frame = (t) => () => {
  const f = new Spr(),
    r = RAD[t - 1],
    cy = 17 - Math.max(0, t - 4) * 1.2;
  const fire = t <= 4,
    mixed = t === 5 || t === 6;
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const n = smooth(x, y, 3, t * 5) - 0.5,
        d = Math.hypot(x + 0.5 - 16, (y + 0.5 - cy) * 1.1) / r + n * 0.45;
      if (d > 1) continue;
      if (fire) {
        f.set(x, y, d < 0.3 ? (t === 1 ? '#ffffff' : R.fire.h) : d < 0.55 ? R.fire.l : d < 0.8 ? R.fire.m : R.fire.d);
      } else if (mixed) {
        const core = t === 5 ? 0.45 : 0.22;
        if (d < core) f.set(x, y, d < core / 2 ? R.fire.l : R.fire.m);
        else if (d < core + 0.15) f.set(x, y, R.fire.d);
        else f.set(x, y, d < 0.75 ? R.smoke.d : R.smoke.m);
      } else {
        // thinning smoke: holes grow as it fades
        const gap = t === 7 ? 0.3 : 0.55;
        if (smooth(x, y, 2, 91 + t) < gap || hash(x, y, t) < (t - 6) * 0.15) continue;
        f.set(x, y, d < 0.5 ? (t === 7 ? R.smoke.m : R.smoke.l) : t === 7 ? R.smoke.l : R.smoke.h);
      }
    }
  if (t <= 6) f.outline('#141018');
  // flying sparks
  if (t >= 2 && t <= 6) {
    const reach = r + 2 + t * 0.6;
    for (let i = 0; i < 14; i++) {
      const a = hash(i, t, 3) * Math.PI * 2,
        dist = reach * (0.75 + hash(i, t, 4) * 0.35);
      const x = Math.round(16 + Math.cos(a) * dist),
        y = Math.round(cy + Math.sin(a) * dist);
      if (f.get(x, y)) continue;
      f.set(x, y, t <= 4 ? R.fire.h : R.fire.l);
      if (t <= 4) f.set(x - Math.sign(Math.cos(a)), y - Math.sign(Math.sin(a)), R.fire.m);
    }
  }
  return f;
};
module.exports = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((t) => ['combat_' + t, frame(t)]));

// Contact sheet of every misc sprite at 4×: `node src/sheet-misc.js [out.png]`.
const { Spr, png, badge, recolour } = require('../src/lib');
const misc = require('../src/misc');

const gap = 4,
  W = 300;
const items = [];
const swap = (spr, main, dark) => {
  const o = new Spr(spr.w, spr.h).rect(0, 0, spr.w, spr.h, main);
  spr.p.forEach((c, i) => c && (o.p[i] = c === '#000000' ? dark : c));
  return o;
};
for (const [name, f] of Object.entries(misc)) {
  const s = f();
  if (name === 'map/city') {
    items.push(swap(s, '#e04838', '#7a1810'), swap(s, '#4870e0', '#182c78'));
  } else if (name === 'map/fortify') {
    items.push(recolour(badge(), '#e04838', '#7a1810').over(s), s);
  } else if (name.startsWith('general/')) {
    // 2×2 repeats to show the seams
    const t = new Spr(s.w * 2, s.h * 2);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) t.over(s, i * s.w, j * s.h);
    items.push(t);
  } else items.push(s);
}
let x = gap,
  y = gap,
  rowH = 0;
const pos = items.map((s) => {
  if (x + s.w + gap > W) {
    x = gap;
    y += rowH + gap;
    rowH = 0;
  }
  const p = [x, y];
  x += s.w + gap;
  rowH = Math.max(rowH, s.h);
  return p;
});
const sheet = new Spr(W, y + rowH + gap).rect(0, 0, W, y + rowH + gap, '#5a9a34');
items.forEach((s, i) => sheet.over(s, ...pos[i]));
png(sheet, 4, process.argv[2] || 'out/misc-sheet.png');
// sizes check
for (const [n, f] of Object.entries(misc)) {
  const s = f();
  console.log(n, s.w + 'x' + s.h);
}

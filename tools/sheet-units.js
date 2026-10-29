// Contact sheet of every unit (and combat frame) on four player colours, at 3×: `node src/sheet-units.js <out.png>`.
const { S, Spr, unit, png, recolour } = require('../src/lib');
const units = require('../src/units');
let combat = {};
try {
  combat = require('../src/combat');
} catch (e) {}

const PL = [
  ['#e04838', '#7a1810'],
  ['#4870e0', '#182c78'],
  ['#f0d040', '#806010'],
  ['#f0f0f0', '#686868'],
];
const names = Object.keys(units),
  cols = 8,
  gap = 4;
const rows = Math.ceil(names.length / cols) * PL.length + Math.ceil(Object.keys(combat).length / cols);
const sheet = new Spr(cols * (S + gap) + gap, rows * (S + gap) + gap);
sheet.rect(0, 0, sheet.w, sheet.h, '#5a9a34');
const drawn = names.map((n) => unit(units[n]));
PL.forEach((pl, p) =>
  drawn.forEach((u, i) => {
    const row = Math.floor(i / cols) * PL.length + p;
    sheet.over(recolour(u, ...pl), gap + (i % cols) * (S + gap), gap + row * (S + gap));
  })
);
const base = Math.ceil(names.length / cols) * PL.length;
Object.values(combat).forEach((f, i) =>
  sheet.over(f(), gap + (i % cols) * (S + gap), gap + (base + Math.floor(i / cols)) * (S + gap))
);
png(sheet, 3, process.argv[2]);
console.log(names.join(' '));

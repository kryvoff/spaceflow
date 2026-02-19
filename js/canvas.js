// ─── Canvas setup & shared utilities ─────────────────────────────────
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 600, H = 500;
canvas.width = W;
canvas.height = H;

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2+w2 && x1+w1 > x2 && y1 < y2+h2 && y1+h1 > y2;
}

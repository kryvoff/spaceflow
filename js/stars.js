// ─── Background stars ─────────────────────────────────────────────────
// W and H are defined in canvas.js (loaded first)
const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random()*W, y: Math.random()*H,
    size: Math.random()*2+0.5,
    speed: Math.random()*0.5+0.2,
    brightness: Math.random()*0.5+0.5
  });
}

function updateStars() {
  for (const s of stars) {
    s.y += s.speed;
    if (s.y > H) { s.y = 0; s.x = Math.random()*W; }
  }
}

function drawStars() {
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
}

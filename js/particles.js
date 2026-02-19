// ─── Particles ────────────────────────────────────────────────────────
let particles = [];

function spawnExplosion(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random()*Math.PI*2, sp = Math.random()*3+1;
    particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
      life: 30+Math.random()*20, maxLife: 50, color, size: Math.random()*3+1 });
  }
}

function updateParticles() {
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

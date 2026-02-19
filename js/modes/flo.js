// ═══════════════════════════════════════════════════════════════════════
// FLO MODE — Space Invaders + Bunnies
//
// Controls: Arrow Left/Right or A/D to move, Space to shoot
// Goal:     Survive the timer; protect bunnies (+5 per survivor)
//           Killing basic alien = +10, shooter alien = +20
//           Bunny hit by alien/bullet = -15
// ═══════════════════════════════════════════════════════════════════════

let floPlayer, floAliens, floBullets, floAlienBullets, floSpawnTimer, floDifficulty;
let bunnies = [];

function initBunnies() {
  bunnies = [];
  const count = 14 + Math.min(globalRound, 10) * 2;
  const cols  = Math.floor(W / 36);
  for (let i = 0; i < count; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    bunnies.push({
      x: 22 + col*35 + (Math.random()-0.5)*8,
      y: H - 14 - row*18,
      alive: true,
      hop: Math.random()*Math.PI*2,
      w: 14, h: 12
    });
  }
}

function drawBunny(b) {
  if (!b.alive) return;
  const hopY = Math.abs(Math.sin(b.hop)) * 2;
  const bx = b.x, by = b.y - hopY;
  ctx.fillStyle = '#ffccee';
  ctx.fillRect(bx-5, by-4, 10, 8);
  ctx.fillRect(bx-3, by-8, 6, 5);
  ctx.fillStyle = '#ffaadd';
  ctx.fillRect(bx-3, by-14, 2, 6);
  ctx.fillRect(bx+1, by-14, 2, 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(bx-2, by-7, 1, 1);
  ctx.fillRect(bx+1, by-7, 1, 1);
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx+5, by-2, 3, 3);
}

function drawAlienShape(x, y, w, h) {
  ctx.fillRect(x-w/2, y-h/2, w, h);
  ctx.fillRect(x-w/2-4, y, 4, h/2);
  ctx.fillRect(x+w/2, y, 4, h/2);
  ctx.fillRect(x-3, y-h/2-5, 2, 5);
  ctx.fillRect(x+1, y-h/2-5, 2, 5);
}

function initFlo() {
  floPlayer = { x: W/2, y: H-55, w: 36, h: 28, speed: 5, shootCooldown: 0 };
  floAliens      = [];
  floBullets     = [];
  floAlienBullets = [];
  floSpawnTimer  = 0;
  floDifficulty  = Math.min(globalRound, 15);
  roundScore     = 0;
  roundTimer     = FLO_ROUND_DURATION + globalRound * 30;
  lives          = 3;
  initBunnies();
}

function updateFlo() {
  for (const b of bunnies) { if (b.alive) b.hop += 0.04; }

  if (keys['ArrowLeft']||keys['KeyA']) floPlayer.x -= floPlayer.speed;
  if (keys['ArrowRight']||keys['KeyD']) floPlayer.x += floPlayer.speed;
  floPlayer.x = Math.max(floPlayer.w/2, Math.min(W-floPlayer.w/2, floPlayer.x));

  if (floPlayer.shootCooldown > 0) floPlayer.shootCooldown--;
  if (keys['Space'] && floPlayer.shootCooldown <= 0) {
    floBullets.push({ x: floPlayer.x, y: floPlayer.y-floPlayer.h/2, vy: -7, w: 3, h: 10 });
    floPlayer.shootCooldown = Math.max(6, 12 - Math.floor(globalRound/4));
    sfxShoot();
  }

  // Spawn aliens — harder each round
  floSpawnTimer--;
  if (floSpawnTimer <= 0) {
    const spawnRate   = Math.max(10, 50 - floDifficulty * 3);
    floSpawnTimer     = spawnRate;
    const shooterChance = Math.min(0.6, 0.15 + globalRound * 0.04);
    const alienType   = Math.random() < shooterChance ? 'shooter' : 'basic';
    const alienSpeed  = 1 + floDifficulty * 0.18 + Math.random() * 0.5;
    floAliens.push({
      x: Math.random()*(W-60)+30, y: -30,
      w: 28, h: 22,
      vy: alienSpeed,
      vx: (Math.random()-0.5)*(2+floDifficulty*0.1),
      type: alienType,
      shootTimer: alienType==='shooter' ? 40+Math.random()*40 : 9999,
      hp: alienType==='shooter' ? 2 : 1
    });
  }

  // Update aliens
  for (let i = floAliens.length-1; i >= 0; i--) {
    const a = floAliens[i];
    a.y += a.vy;
    a.x += a.vx;
    if (a.x < 20 || a.x > W-20) a.vx *= -1;

    if (a.type === 'shooter') {
      a.shootTimer--;
      if (a.shootTimer <= 0) {
        const bspd = 3.5 + Math.min(globalRound, 10)*0.2;
        floAlienBullets.push({ x: a.x, y: a.y+a.h/2, vy: bspd, w: 3, h: 8 });
        a.shootTimer = Math.max(30, 70-globalRound*2) + Math.random()*30;
      }
    }

    // Alien hits bunnies
    let alienRemoved = false;
    for (let bi = 0; bi < bunnies.length; bi++) {
      const bn = bunnies[bi];
      if (!bn.alive) continue;
      if (a.y + a.h/2 > bn.y-12 && rectsOverlap(
        a.x-a.w/2, a.y-a.h/2, a.w, a.h,
        bn.x-bn.w/2, bn.y-bn.h, bn.w, bn.h
      )) {
        bn.alive = false;
        spawnExplosion(bn.x, bn.y, '#ffaadd', 8);
        sfxBunnyHit();
        roundScore -= 15;
        floAliens.splice(i, 1);
        alienRemoved = true;
        break;
      }
    }
    if (alienRemoved) continue;

    if (a.y > H+30) { floAliens.splice(i, 1); continue; }

    // Hit player
    if (rectsOverlap(a.x-a.w/2, a.y-a.h/2, a.w, a.h,
      floPlayer.x-floPlayer.w/2, floPlayer.y-floPlayer.h/2, floPlayer.w, floPlayer.h)) {
      spawnExplosion(a.x, a.y, '#ff4444', 15);
      floAliens.splice(i, 1);
      lives--;
      sfxDeath();
      if (lives <= 0) { endCurrentTurn(); return; }
    }
  }

  // Player bullets
  for (let i = floBullets.length-1; i >= 0; i--) {
    const b = floBullets[i];
    b.y += b.vy;
    if (b.y < -10) { floBullets.splice(i, 1); continue; }
    for (let j = floAliens.length-1; j >= 0; j--) {
      const a = floAliens[j];
      if (rectsOverlap(b.x-b.w/2, b.y-b.h/2, b.w, b.h, a.x-a.w/2, a.y-a.h/2, a.w, a.h)) {
        a.hp--;
        floBullets.splice(i, 1);
        if (a.hp <= 0) {
          spawnExplosion(a.x, a.y, '#ff6600', 12);
          sfxKill();
          floAliens.splice(j, 1);
          roundScore += a.type==='shooter' ? 20 : 10;
        }
        break;
      }
    }
  }

  // Alien bullets
  for (let i = floAlienBullets.length-1; i >= 0; i--) {
    const b = floAlienBullets[i];
    b.y += b.vy;
    if (b.y > H+10) { floAlienBullets.splice(i, 1); continue; }

    if (rectsOverlap(b.x-b.w/2, b.y-b.h/2, b.w, b.h,
      floPlayer.x-floPlayer.w/2, floPlayer.y-floPlayer.h/2, floPlayer.w, floPlayer.h)) {
      spawnExplosion(floPlayer.x, floPlayer.y, '#ff4444', 10);
      floAlienBullets.splice(i, 1);
      lives--;
      sfxDeath();
      if (lives <= 0) { endCurrentTurn(); return; }
      continue;
    }

    // Bullet hits bunnies
    for (let bi = 0; bi < bunnies.length; bi++) {
      const bn = bunnies[bi];
      if (!bn.alive) continue;
      if (rectsOverlap(b.x-b.w/2, b.y-b.h/2, b.w, b.h, bn.x-bn.w/2, bn.y-bn.h, bn.w, bn.h)) {
        bn.alive = false;
        spawnExplosion(bn.x, bn.y, '#ffaadd', 8);
        sfxBunnyHit();
        roundScore -= 15;
        floAlienBullets.splice(i, 1);
        break;
      }
    }
  }

  roundScore += 0.05; // survival trickle

  roundTimer--;
  if (roundTimer <= 0) {
    const aliveBunnies = bunnies.filter(b => b.alive).length;
    roundScore += aliveBunnies * 5;
    endCurrentTurn();
  }
}

function drawFlo() {
  // Bunnies
  for (const b of bunnies) drawBunny(b);
  const alive = bunnies.filter(b => b.alive).length;
  ctx.fillStyle = '#ffaadd';
  ctx.font = '10px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(`🐰 ${alive}/${bunnies.length}`, 10, H-5);

  // Player ship
  ctx.fillStyle = '#00ddff';
  ctx.beginPath();
  ctx.moveTo(floPlayer.x, floPlayer.y-floPlayer.h/2);
  ctx.lineTo(floPlayer.x-floPlayer.w/2, floPlayer.y+floPlayer.h/2);
  ctx.lineTo(floPlayer.x+floPlayer.w/2, floPlayer.y+floPlayer.h/2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0088aa';
  ctx.fillRect(floPlayer.x-5, floPlayer.y+floPlayer.h/2, 10, 4+Math.random()*4);

  // Aliens
  for (const a of floAliens) {
    ctx.fillStyle = a.type==='shooter' ? '#ff3366' : '#44ff44';
    drawAlienShape(a.x, a.y, a.w, a.h);
    ctx.fillStyle = a.type==='shooter' ? '#ffff00' : '#000';
    ctx.fillRect(a.x-6, a.y-3, 4, 4);
    ctx.fillRect(a.x+2, a.y-3, 4, 4);
  }

  // Player bullets
  ctx.fillStyle = '#00ffff';
  for (const b of floBullets) {
    ctx.fillRect(b.x-b.w/2, b.y-b.h/2, b.w, b.h);
    ctx.fillStyle = 'rgba(0,255,255,0.3)';
    ctx.fillRect(b.x-b.w, b.y-b.h/2-2, b.w*2, b.h+4);
    ctx.fillStyle = '#00ffff';
  }

  // Alien bullets
  ctx.fillStyle = '#ff3366';
  for (const b of floAlienBullets) ctx.fillRect(b.x-b.w/2, b.y-b.h/2, b.w, b.h);
}

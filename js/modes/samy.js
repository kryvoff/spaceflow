// ═══════════════════════════════════════════════════════════════════════
// SAMY MODE — Geometry Dash runner
//
// Controls: Space to jump
// Goal:     Survive as long as possible; one hit = turn over
//           +5 per obstacle cleared, +1 per 100px, +10 per flying enemy dodged
// ═══════════════════════════════════════════════════════════════════════

let samyPlayer, samyObstacles, samySpeed, samySpawnTimer, samyDistance;
let samyEnemies = [], samyEnemySpawnTimer = 0;

const SAMY_GROUND_Y  = H - 60;
const SAMY_GRAVITY   = 0.6;
const SAMY_JUMP_FORCE = -11;

function initSamy() {
  samyPlayer = { x: 100, y: SAMY_GROUND_Y-25, w: 25, h: 25, vy: 0, onGround: true, rotation: 0 };
  samyObstacles        = [];
  samyEnemies          = [];
  samySpeed            = 4 + Math.min(globalRound, 12) * 0.35;
  samySpawnTimer       = 60;
  samyEnemySpawnTimer  = 120;
  samyDistance         = 0;
  roundScore           = 0;
}

function updateSamy() {
  if (keys['Space'] && samyPlayer.onGround) {
    samyPlayer.vy = SAMY_JUMP_FORCE;
    samyPlayer.onGround = false;
    sfxJump();
  }

  samyPlayer.vy += SAMY_GRAVITY;
  samyPlayer.y  += samyPlayer.vy;
  if (samyPlayer.y >= SAMY_GROUND_Y - samyPlayer.h/2) {
    samyPlayer.y       = SAMY_GROUND_Y - samyPlayer.h/2;
    samyPlayer.vy      = 0;
    samyPlayer.onGround = true;
  }

  if (!samyPlayer.onGround) samyPlayer.rotation += 0.08;
  else samyPlayer.rotation = Math.round(samyPlayer.rotation/(Math.PI/2)) * (Math.PI/2);

  // Spawn obstacles
  samySpawnTimer--;
  if (samySpawnTimer <= 0) {
    const gap = Math.max(20, 72 - globalRound * 4);
    samySpawnTimer = gap + Math.random() * 22;
    const r = Math.random();
    if (r < 0.16) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y, w:20, h:30, type:'spike'});
    } else if (r < 0.30) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y, w:20, h:30, type:'spike'});
      samyObstacles.push({x:W+45, y:SAMY_GROUND_Y, w:20, h:30, type:'spike'});
    } else if (r < 0.42) {
      for (let s=0; s<3; s++) samyObstacles.push({x:W+20+s*25, y:SAMY_GROUND_Y, w:20, h:30, type:'spike'});
    } else if (r < 0.50) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y, w:24, h:50, type:'spike'});
    } else if (r < 0.58) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y-25, w:25, h:25, type:'block'});
    } else if (r < 0.66) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y-25, w:25, h:25, type:'block'});
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y-25, w:18, h:22, type:'spike'});
    } else if (r < 0.76) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y-15, w:26, h:26, type:'saw', angle:0});
    } else if (r < 0.86) {
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y-55, w:20, h:25, type:'ceilSpike'});
      samyObstacles.push({x:W+20, y:SAMY_GROUND_Y,    w:20, h:25, type:'spike'});
    } else {
      for (let s=0; s<4; s++) samyObstacles.push({x:W+20+s*22, y:SAMY_GROUND_Y, w:18, h:28, type:'spike'});
    }
  }

  // Flying enemies
  samyEnemySpawnTimer--;
  if (samyEnemySpawnTimer <= 0) {
    samyEnemySpawnTimer = Math.max(55, 170-globalRound*12) + Math.random()*45;
    const flyY = SAMY_GROUND_Y - 60 - Math.random()*80;
    samyEnemies.push({x:W+30, y:flyY, w:22, h:18, baseY:flyY, phase:Math.random()*Math.PI*2});
  }

  // Update obstacles
  for (let i = samyObstacles.length-1; i >= 0; i--) {
    const o = samyObstacles[i];
    o.x -= samySpeed;
    if (o.type==='saw') o.angle = (o.angle||0) + 0.15;
    if (o.x < -40) { samyObstacles.splice(i, 1); roundScore += 5; continue; }

    let hit = false;
    const px = samyPlayer.x-samyPlayer.w/2+3, py = samyPlayer.y-samyPlayer.h/2+3;
    const pw = samyPlayer.w-6, ph = samyPlayer.h-6;
    if (o.type==='spike') {
      hit = rectsOverlap(px, py, pw, ph, o.x-o.w/2+4, o.y-o.h, o.w-8, o.h-4);
    } else if (o.type==='saw') {
      const r=o.w/2, cx=o.x, cy=o.y;
      const clX=Math.max(px,Math.min(cx,px+pw)), clY=Math.max(py,Math.min(cy,py+ph));
      const dx=cx-clX, dy=cy-clY;
      hit = (dx*dx+dy*dy) < (r*r);
    } else if (o.type==='ceilSpike') {
      hit = rectsOverlap(px, py, pw, ph, o.x-o.w/2+3, o.y, o.w-6, o.h-4);
    } else {
      hit = rectsOverlap(px, py, pw, ph, o.x-o.w/2, o.y-o.h, o.w, o.h);
    }
    if (hit) {
      spawnExplosion(samyPlayer.x, samyPlayer.y, '#ffaa00', 25);
      sfxDeath();
      endCurrentTurn();
      return;
    }
  }

  // Flying enemies
  for (let i = samyEnemies.length-1; i >= 0; i--) {
    const e = samyEnemies[i];
    e.x -= samySpeed * 0.8;
    e.phase += 0.06;
    e.y = e.baseY + Math.sin(e.phase) * 20;
    if (e.x < -40) { samyEnemies.splice(i, 1); roundScore += 10; sfxScore(); continue; }
    if (rectsOverlap(samyPlayer.x-samyPlayer.w/2+3, samyPlayer.y-samyPlayer.h/2+3,
      samyPlayer.w-6, samyPlayer.h-6, e.x-e.w/2, e.y-e.h/2, e.w, e.h)) {
      spawnExplosion(samyPlayer.x, samyPlayer.y, '#ffaa00', 25);
      sfxDeath();
      endCurrentTurn();
      return;
    }
  }

  samyDistance += samySpeed;
  if (samyDistance >= 100) { samyDistance -= 100; roundScore += 1; }
  samySpeed += 0.001;
}

function drawSamy() {
  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(0, SAMY_GROUND_Y, W, H-SAMY_GROUND_Y);
  ctx.strokeStyle = '#5555aa'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, SAMY_GROUND_Y); ctx.lineTo(W, SAMY_GROUND_Y); ctx.stroke();
  ctx.strokeStyle = 'rgba(85,85,170,0.3)'; ctx.lineWidth = 1;
  const go = (performance.now()*samySpeed*0.06)%40;
  for (let gx = -go; gx < W; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, SAMY_GROUND_Y); ctx.lineTo(gx, H); ctx.stroke();
  }

  for (const o of samyObstacles) {
    if (o.type==='spike') {
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y-o.h); ctx.lineTo(o.x-o.w/2, o.y); ctx.lineTo(o.x+o.w/2, o.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#ff6666'; ctx.lineWidth=1; ctx.stroke();
    } else if (o.type==='saw') {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.angle||0);
      const r = o.w/2;
      ctx.fillStyle='#aaa'; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ccc';
      for (let t=0; t<8; t++) {
        const a=(t/8)*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*r*0.6, Math.sin(a)*r*0.6);
        ctx.lineTo(Math.cos(a-0.2)*r*1.15, Math.sin(a-0.2)*r*1.15);
        ctx.lineTo(Math.cos(a+0.2)*r*1.15, Math.sin(a+0.2)*r*1.15);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle='#666'; ctx.beginPath(); ctx.arc(0,0,r*0.25,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else if (o.type==='ceilSpike') {
      ctx.fillStyle='#ff6644';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y+o.h); ctx.lineTo(o.x-o.w/2, o.y); ctx.lineTo(o.x+o.w/2, o.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#ff8866'; ctx.lineWidth=1; ctx.stroke();
    } else {
      ctx.fillStyle='#cc3333'; ctx.fillRect(o.x-o.w/2, o.y-o.h, o.w, o.h);
      ctx.strokeStyle='#ff5555'; ctx.lineWidth=1; ctx.strokeRect(o.x-o.w/2, o.y-o.h, o.w, o.h);
    }
  }

  for (const e of samyEnemies) {
    ctx.fillStyle='#dd44ff'; ctx.fillRect(e.x-e.w/2, e.y-e.h/2, e.w, e.h);
    const wOff = Math.sin(performance.now()*0.02)*4;
    ctx.fillStyle='#aa22cc';
    ctx.beginPath(); ctx.moveTo(e.x-e.w/2, e.y); ctx.lineTo(e.x-e.w/2-8, e.y-6+wOff); ctx.lineTo(e.x-e.w/2, e.y+4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(e.x+e.w/2, e.y); ctx.lineTo(e.x+e.w/2+8, e.y-6-wOff); ctx.lineTo(e.x+e.w/2, e.y+4); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff0'; ctx.fillRect(e.x-4, e.y-4, 3, 3); ctx.fillRect(e.x+1, e.y-4, 3, 3);
  }

  ctx.save();
  ctx.translate(samyPlayer.x, samyPlayer.y); ctx.rotate(samyPlayer.rotation);
  ctx.fillStyle='#ffaa00'; ctx.fillRect(-samyPlayer.w/2, -samyPlayer.h/2, samyPlayer.w, samyPlayer.h);
  ctx.strokeStyle='#ffcc44'; ctx.lineWidth=2;
  ctx.strokeRect(-samyPlayer.w/2, -samyPlayer.h/2, samyPlayer.w, samyPlayer.h);
  ctx.fillStyle='#cc7700';
  ctx.fillRect(-5,-5,4,4); ctx.fillRect(2,-5,4,4); ctx.fillRect(-4,3,8,2);
  ctx.restore();

  if (!samyPlayer.onGround) {
    ctx.fillStyle='rgba(255,170,0,0.15)';
    for (let t=1; t<=3; t++) {
      ctx.fillRect(samyPlayer.x-samyPlayer.w/2-t*8, samyPlayer.y-samyPlayer.h/2+t*2, samyPlayer.w-t*2, samyPlayer.h-t*2);
    }
  }
}

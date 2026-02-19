// ═══════════════════════════════════════════════════════════════════════
// JAN MODE — Soccer Goalkeeper
//
// Controls: Arrow Up/Down or W/S to move, Space to dive (extends reach)
// Goal:     Save shots; 3 goals conceded = turn over
//           Save = +15 (diving save = +25), goal conceded = -20
//           All shots cleared with saves = +3 per save bonus
// ═══════════════════════════════════════════════════════════════════════

let janKeeper, janBalls, janGoalsConceded, janSaves, janShotTimer, janShotsTotal, janMaxShots;

function initJan() {
  janKeeper      = { x:60, y:H/2, w:20, h:60, speed:5, diving:false, diveTimer:0 };
  janBalls       = [];
  janGoalsConceded = 0;
  janSaves       = 0;
  janShotTimer   = 60;
  janShotsTotal  = 0;
  janMaxShots    = 15 + globalRound * 3;
  roundScore     = 0;
}

function updateJan() {
  if (keys['ArrowUp']  ||keys['KeyW']) janKeeper.y -= janKeeper.speed;
  if (keys['ArrowDown']||keys['KeyS']) janKeeper.y += janKeeper.speed;
  const goalTop = H/2 - 90, goalBot = H/2 + 90;
  janKeeper.y = Math.max(goalTop + janKeeper.h/2, Math.min(goalBot - janKeeper.h/2, janKeeper.y));

  // Dive with Space
  if (keys['Space'] && !janKeeper.diving) {
    janKeeper.diving    = true;
    janKeeper.diveTimer = 18;
    janKeeper.h         = 90;
    sfxJump();
  }
  if (janKeeper.diving) {
    janKeeper.diveTimer--;
    if (janKeeper.diveTimer <= 0) { janKeeper.diving = false; janKeeper.h = 60; }
  }

  // Spawn shots
  if (janShotsTotal < janMaxShots) {
    janShotTimer--;
    if (janShotTimer <= 0) {
      const spd     = 4 + Math.min(globalRound, 10)*0.5 + Math.random()*2;
      const targetY = H/2 - 75 + Math.random()*150;
      const startX  = W + 10;
      const startY  = 60 + Math.random()*(H-120);
      const dx = 50 - startX, dy = targetY - startY;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const curve = (Math.random()-0.5) * (0.06 + globalRound*0.012);
      janBalls.push({ x:startX, y:startY, r:10, vx:dx/dist*spd, vy:dy/dist*spd, curve, spin:0, active:true });
      janShotsTotal++;
      janShotTimer = Math.max(18, 55 - globalRound*3) + Math.random()*25;
      sfxKick();
    }
  }

  // Update balls
  for (let i = janBalls.length-1; i >= 0; i--) {
    const b = janBalls[i];
    if (!b.active) continue;
    b.vy += b.curve;
    b.x  += b.vx;
    b.y  += b.vy;
    b.spin += 0.15;

    // Keeper save (circle-rect)
    const kx = janKeeper.x-janKeeper.w/2, ky = janKeeper.y-janKeeper.h/2;
    const closestX = Math.max(kx, Math.min(b.x, kx+janKeeper.w));
    const closestY = Math.max(ky, Math.min(b.y, ky+janKeeper.h));
    const ddx = b.x-closestX, ddy = b.y-closestY;
    if (ddx*ddx+ddy*ddy < b.r*b.r) {
      b.active = false;
      janSaves++;
      roundScore += 15 + (janKeeper.diving ? 10 : 0);
      spawnExplosion(b.x, b.y, '#44ff44', 14);
      sfxSave();
      continue;
    }

    // Goal conceded
    if (b.x < 50 && b.y > goalTop && b.y < goalBot) {
      b.active = false;
      janGoalsConceded++;
      roundScore -= 20;
      spawnExplosion(b.x, b.y, '#ff4444', 18);
      sfxGoal();
      if (janGoalsConceded >= 3) { endCurrentTurn(); return; }
      continue;
    }

    // Ball went wide / off screen
    if (b.x < -20 || b.y < -20 || b.y > H+20) {
      b.active = false;
      janSaves++;
      roundScore += 5;
      continue;
    }
  }

  roundScore += 0.03;

  // All shots taken and cleared
  if (janShotsTotal >= janMaxShots && janBalls.every(b => !b.active)) {
    roundScore += janSaves * 3;
    endCurrentTurn();
  }
}

function drawJan() {
  // Green pitch with stripes
  ctx.fillStyle = '#1a5a1a';
  ctx.fillRect(0, 0, W, H);
  for (let sx = 0; sx < W; sx += 80) {
    ctx.fillStyle = sx % 160 === 0 ? '#1d5e1d' : '#175417';
    ctx.fillRect(sx, 0, 80, H);
  }

  // Field lines
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W/2, H/2, 60, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.strokeRect(0, H/2-120, 140, 240);
  ctx.strokeRect(0, H/2-60, 50, 120);

  // Goal frame
  const gT = H/2-90, gB = H/2+90;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(50,gT); ctx.lineTo(50,gB); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15,gT); ctx.lineTo(50,gT); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15,gB); ctx.lineTo(50,gB); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15,gT); ctx.lineTo(15,gB); ctx.stroke();
  // Net
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  for (let ny = gT; ny <= gB; ny += 15) { ctx.beginPath(); ctx.moveTo(15,ny); ctx.lineTo(50,ny); ctx.stroke(); }
  for (let nx = 15; nx <= 50; nx += 10) { ctx.beginPath(); ctx.moveTo(nx,gT); ctx.lineTo(nx,gB); ctx.stroke(); }

  // Goalkeeper
  ctx.fillStyle = janKeeper.diving ? '#ffff00' : '#ff8800';
  ctx.fillRect(janKeeper.x-janKeeper.w/2, janKeeper.y-janKeeper.h/2, janKeeper.w, janKeeper.h);
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath(); ctx.arc(janKeeper.x, janKeeper.y-janKeeper.h/2-6, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#44ff44';
  ctx.fillRect(janKeeper.x-janKeeper.w/2-4, janKeeper.y-8, 6, 10);
  ctx.fillRect(janKeeper.x+janKeeper.w/2-2, janKeeper.y-8, 6, 10);
  if (janKeeper.diving) {
    ctx.fillStyle = 'rgba(255,255,0,0.15)';
    ctx.fillRect(janKeeper.x-janKeeper.w/2-6, janKeeper.y-janKeeper.h/2-4, janKeeper.w+12, janKeeper.h+8);
  }

  // Soccer balls
  for (const b of janBalls) {
    if (!b.active) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(b.x-b.vx*2, b.y-b.vy*2, b.r*0.6, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#333';
    for (let p = 0; p < 5; p++) {
      const a = (p/5)*Math.PI*2 - Math.PI/2;
      ctx.beginPath(); ctx.arc(Math.cos(a)*b.r*0.45, Math.sin(a)*b.r*0.45, b.r*0.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  ctx.fillStyle = '#fff';
  ctx.font = '11px "Courier New"';
  ctx.textAlign = 'left';
  const remaining = janMaxShots - janShotsTotal + janBalls.filter(b => b.active).length;
  ctx.fillText(`⚽ ${remaining} shots left`, 10, H-8);
}

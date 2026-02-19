// ═══════════════════════════════════════════════════════════════════════
// FELIX MODE — Rugby Tackle
//
// Controls: Arrow Up/Down or W/S to move between lanes
//           Space to tackle (lunge forward, wider hit box)
//           Arrow Down / S to duck (dodge small runners passing overhead)
// Goal:     Tackle runners for points; too many missed = turn over
//           Tackle normal = +15, fast = +20, big = +25
//           Successful duck dodge = +10
//           Missed runner = -5, runner that hits you = lose a chance
// ═══════════════════════════════════════════════════════════════════════

let felixPlayer, felixRunners, felixSpawnTimer, felixTackles, felixMissed, felixMaxMissed;
let felixDistance = 0;

const FELIX_GROUND_Y = H - 50;

function initFelix() {
  felixPlayer   = { x:120, y:FELIX_GROUND_Y, w:30, h:40, speed:5, ducking:false, tackling:false, tackleTimer:0, tackleCD:0, duckH:22 };
  felixRunners  = [];
  felixSpawnTimer = 50;
  felixTackles  = 0;
  felixMissed   = 0;
  felixMaxMissed = 3 + Math.min(globalRound, 5);
  felixDistance = 0;
  roundScore    = 0;
}

function updateFelix() {
  felixPlayer.ducking = !!(keys['ArrowDown'] || keys['KeyS']);
  const effectiveH = felixPlayer.ducking ? felixPlayer.duckH : felixPlayer.h;

  // Tackle with Space
  if (felixPlayer.tackleCD > 0) felixPlayer.tackleCD--;
  if (keys['Space'] && !felixPlayer.tackling && felixPlayer.tackleCD <= 0) {
    felixPlayer.tackling    = true;
    felixPlayer.tackleTimer = 15;
    sfxTackle();
  }
  if (felixPlayer.tackling) {
    felixPlayer.tackleTimer--;
    if (felixPlayer.tackleTimer <= 0) { felixPlayer.tackling = false; felixPlayer.tackleCD = 10; }
  }

  // Move up/down lanes
  if (keys['ArrowUp'] ||keys['KeyW']) felixPlayer.y -= felixPlayer.speed;
  if (keys['ArrowDown']||keys['KeyS']) felixPlayer.y += felixPlayer.speed;
  felixPlayer.y = Math.max(100, Math.min(FELIX_GROUND_Y, felixPlayer.y));

  // Spawn runners
  felixSpawnTimer--;
  if (felixSpawnTimer <= 0) {
    const gap  = Math.max(18, 55 - globalRound * 3);
    felixSpawnTimer = gap + Math.random() * 20;
    const lane = 100 + Math.random() * (FELIX_GROUND_Y - 100);
    const spd  = 3 + Math.min(globalRound, 12) * 0.3 + Math.random() * 1.5;
    const rtype = Math.random();
    const type  = rtype > 0.9 ? 'fast' : rtype > 0.7 ? 'big' : 'runner';
    const sz    = type==='big' ? {w:35,h:45} : type==='fast' ? {w:22,h:32} : {w:28,h:38};
    felixRunners.push({
      x: W + 30, y: lane, w: sz.w, h: sz.h,
      vx: -spd * (type==='fast' ? 1.5 : 1),
      type, tackled: false, passed: false,
      armPhase: Math.random() * Math.PI * 2
    });
  }

  // Update runners
  for (let i = felixRunners.length-1; i >= 0; i--) {
    const r = felixRunners[i];
    r.x += r.vx;
    r.armPhase += 0.12;

    if (r.tackled) {
      r.y += 3; // fall down
      if (r.y > H + 40) felixRunners.splice(i, 1);
      continue;
    }

    const ey      = felixPlayer.y - effectiveH;
    const tackleW = felixPlayer.tackling ? 50 : felixPlayer.w;

    // Tackle collision
    if (felixPlayer.tackling && !r.tackled &&
      rectsOverlap(felixPlayer.x - 5, ey, tackleW, effectiveH,
        r.x - r.w/2, r.y - r.h, r.w, r.h)) {
      r.tackled = true;
      felixTackles++;
      roundScore += r.type==='big' ? 25 : r.type==='fast' ? 20 : 15;
      spawnExplosion(r.x, r.y - r.h/2, '#88cc44', 12);
      sfxKill();
      continue;
    }

    // Player collision (not tackling = hit)
    if (!felixPlayer.tackling && !r.tackled &&
      rectsOverlap(felixPlayer.x - felixPlayer.w/2, ey, felixPlayer.w, effectiveH,
        r.x - r.w/2, r.y - r.h, r.w, r.h)) {
      if (felixPlayer.ducking && r.type !== 'big') {
        if (!r.passed) {
          r.passed = true;
          roundScore += 10;
          sfxDodge();
        }
      } else {
        spawnExplosion(felixPlayer.x, felixPlayer.y - effectiveH/2, '#ff4444', 15);
        sfxDeath();
        felixMissed++;
        r.tackled = true;
        if (felixMissed >= felixMaxMissed) { endCurrentTurn(); return; }
      }
    }

    // Runner passed behind player
    if (r.x < -40) {
      felixRunners.splice(i, 1);
      if (!r.tackled && !r.passed) {
        felixMissed++;
        roundScore -= 5;
        if (felixMissed >= felixMaxMissed) { endCurrentTurn(); return; }
      }
    }
  }

  roundScore += 0.04;
  felixDistance += 1;
}

function drawFelix() {
  // Rugby pitch with stripes
  ctx.fillStyle = '#1a6e1a';
  ctx.fillRect(0, 0, W, H);
  for (let sx = 0; sx < W; sx += 60) {
    ctx.fillStyle = sx % 120 === 0 ? '#1d721d' : '#176117';
    ctx.fillRect(sx, 0, 60, H);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
  for (let lx = 60; lx < W; lx += 80) {
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(50, 0); ctx.lineTo(50, H); ctx.stroke();

  // "H" goal posts
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(20, 60);  ctx.lineTo(20, H-60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, 80);  ctx.lineTo(30, 80);   ctx.stroke();

  const effectiveH = felixPlayer.ducking ? felixPlayer.duckH : felixPlayer.h;
  const px = felixPlayer.x, py = felixPlayer.y;

  // Player
  if (felixPlayer.tackling) {
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(px - 5, py - effectiveH + 5, 50, effectiveH - 5);
    ctx.fillStyle = '#2266aa';
    ctx.beginPath(); ctx.arc(px + 40, py - effectiveH/2, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(px + 40, py - effectiveH/2, 4, -Math.PI/2, Math.PI/2); ctx.fill();
  } else if (felixPlayer.ducking) {
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(px - felixPlayer.w/2, py - effectiveH, felixPlayer.w, effectiveH);
    ctx.fillStyle = '#2266aa';
    ctx.beginPath(); ctx.arc(px, py - effectiveH - 4, 6, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(px - felixPlayer.w/2, py - effectiveH, felixPlayer.w, effectiveH);
    ctx.fillStyle = '#2266aa';
    ctx.beginPath(); ctx.arc(px, py - effectiveH - 6, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(px + 4, py - effectiveH - 6, 4, -Math.PI/2, Math.PI/2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('9', px, py - effectiveH/2 + 4);
  }

  // Runners
  for (const r of felixRunners) {
    if (r.tackled) {
      ctx.fillStyle = '#666';
      ctx.fillRect(r.x - r.w/2, r.y - 8, r.w, 12);
      continue;
    }
    const rc = r.type==='big' ? '#cc3333' : r.type==='fast' ? '#ff8800' : '#dd4444';
    ctx.fillStyle = rc;
    ctx.fillRect(r.x - r.w/2, r.y - r.h, r.w, r.h);
    ctx.fillStyle = r.type==='big' ? '#881111' : r.type==='fast' ? '#aa5500' : '#992222';
    ctx.beginPath(); ctx.arc(r.x, r.y - r.h - 5, 7, 0, Math.PI*2); ctx.fill();
    // Running arms
    const armOff = Math.sin(r.armPhase) * 6;
    ctx.strokeStyle = rc; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r.x-r.w/2, r.y-r.h*0.6); ctx.lineTo(r.x-r.w/2-8, r.y-r.h*0.6+armOff); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r.x+r.w/2, r.y-r.h*0.6); ctx.lineTo(r.x+r.w/2+8, r.y-r.h*0.6-armOff); ctx.stroke();
    // Rugby ball
    ctx.fillStyle = '#8B4513';
    ctx.save(); ctx.translate(r.x + r.w/2 + 6, r.y - r.h*0.6 - armOff);
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.restore();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(r.x-4, r.y-r.h+5, 3, 3);
    ctx.fillRect(r.x+1, r.y-r.h+5, 3, 3);
  }

  ctx.fillStyle = '#fff';
  ctx.font = '11px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(`🏈 Missed: ${felixMissed}/${felixMaxMissed}  Tackles: ${felixTackles}`, 10, H - 8);
}

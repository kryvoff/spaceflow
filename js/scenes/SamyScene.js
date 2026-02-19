// ═══════════════════════════════════════════════════════════════════════
// SAMY MODE — Geometry Dash runner
//
// Player physics: Phaser Arcade Physics (gravity + floor collision)
// Obstacle / enemy collision: manual AABB via rectsOverlap()
//
// Controls: Space to jump
// Goal:     Survive; one hit = turn over
//           +5 per obstacle cleared, +1 per 100 px, +10 per enemy dodged
// ═══════════════════════════════════════════════════════════════════════

const SAMY_GROUND_Y = 440;  // H - 60
const SAMY_PW = 25, SAMY_PH = 25;

class SamyScene extends Phaser.Scene {
  constructor() { super({ key: 'Samy' }); }

  // ─── Setup ───────────────────────────────────────────────────────────
  create() {
    GameState.roundScore = 0;
    this.isDead = false;
    this.samySpeed = 3 + Math.min(GameState.globalRound, 12) * 0.27;
    this.spawnTimer = 60;
    this.enemySpawnTimer = 120;
    this.distance = 0;
    this.obstacles = [];   // {x,y,w,h,type,angle?}
    this.enemies   = [];   // {x,y,w,h,baseY,phase}
    this.playerRot = 0;    // visual rotation (not physics)

    // ── Player physics body ──────────────────────────────────────────
    // Arcade Physics gives us free gravity, velocity, and floor detection.
    this.player = this.physics.add.image(100, SAMY_GROUND_Y - SAMY_PH / 2, 'pixel');
    this.player.setAlpha(0);                         // invisible – we draw manually
    this.player.body.setSize(SAMY_PW, SAMY_PH);          // full visual size — body bottom aligns with ground line
    this.player.body.setGravityY(1400);
    // World bounds bottom = SAMY_GROUND_Y acts as the floor
    this.physics.world.setBounds(0, -2000, 600, 2000 + SAMY_GROUND_Y);
    this.player.setCollideWorldBounds(true);

    // ── Input ────────────────────────────────────────────────────────
    this.spaceKey = this.input.keyboard.addKey('SPACE');

    // ── Particles ─────────────────────────────────────────────────────
    this.emitter = createEmitter(this, 0xffaa00);

    // ── Drawing ───────────────────────────────────────────────────────
    this.gfx = this.add.graphics();

    // ── HUD (Text objects sit above gfx in the display list) ─────────
    this.hud = createCommonHUD(this, 'samy');
    this.hudSpeed = makeText(this, 300, 4, '', { fontSize: '10px', color: '#888', align: 'center' }).setOrigin(0.5, 0);
  }

  // ─── Obstacle spawning ───────────────────────────────────────────────
  _spawnObstacle() {
    const gap = Math.max(20, 72 - GameState.globalRound * 4);
    this.spawnTimer = gap + Math.random() * 22;
    const r = Math.random(), g = SAMY_GROUND_Y;
    const p = (...obs) => obs.forEach(o => this.obstacles.push(o));
    if      (r < 0.16) p({ x: 620, y: g, w: 20, h: 30, type: 'spike' });
    else if (r < 0.30) p({ x: 620, y: g, w: 20, h: 30, type: 'spike' }, { x: 645, y: g, w: 20, h: 30, type: 'spike' });
    else if (r < 0.42) for (let s = 0; s < 3; s++) p({ x: 620 + s * 25, y: g, w: 20, h: 30, type: 'spike' });
    else if (r < 0.50) p({ x: 620, y: g, w: 24, h: 50, type: 'spike' });
    else if (r < 0.58) p({ x: 620, y: g - 25, w: 25, h: 25, type: 'block' });
    else if (r < 0.66) p({ x: 620, y: g - 25, w: 25, h: 25, type: 'block' }, { x: 620, y: g - 25, w: 18, h: 22, type: 'spike' });
    else if (r < 0.76) p({ x: 620, y: g - 15, w: 26, h: 26, type: 'saw', angle: 0 });
    else if (r < 0.86) p({ x: 620, y: g - 55, w: 20, h: 25, type: 'ceilSpike' }, { x: 620, y: g, w: 20, h: 25, type: 'spike' });
    else               for (let s = 0; s < 4; s++) p({ x: 620 + s * 22, y: g, w: 18, h: 28, type: 'spike' });
  }

  _spawnEnemy() {
    this.enemySpawnTimer = Math.max(55, 170 - GameState.globalRound * 12) + Math.random() * 45;
    const flyY = SAMY_GROUND_Y - 60 - Math.random() * 80;
    this.enemies.push({ x: 630, y: flyY, w: 22, h: 18, baseY: flyY, phase: Math.random() * Math.PI * 2 });
  }

  // ─── Collision helpers ───────────────────────────────────────────────
  _hitsObstacle(px, py, pw, ph) {
    for (const o of this.obstacles) {
      let hit = false;
      if (o.type === 'spike') {
        hit = rectsOverlap(px, py, pw, ph, o.x - o.w / 2 + 4, o.y - o.h, o.w - 8, o.h - 4);
      } else if (o.type === 'saw') {
        const r = o.w / 2, cx = o.x, cy = o.y;
        const clX = Math.max(px, Math.min(cx, px + pw));
        const clY = Math.max(py, Math.min(cy, py + ph));
        const dx = cx - clX, dy = cy - clY;
        hit = dx * dx + dy * dy < r * r;
      } else if (o.type === 'ceilSpike') {
        hit = rectsOverlap(px, py, pw, ph, o.x - o.w / 2 + 3, o.y, o.w - 6, o.h - 4);
      } else {
        hit = rectsOverlap(px, py, pw, ph, o.x - o.w / 2, o.y - o.h, o.w, o.h);
      }
      if (hit) return true;
    }
    return false;
  }

  _hitsEnemy(px, py, pw, ph) {
    for (const e of this.enemies) {
      if (rectsOverlap(px, py, pw, ph, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) return true;
    }
    return false;
  }

  // ─── Death / turn end ────────────────────────────────────────────────
  _die() {
    if (this.isDead) return;
    this.isDead = true;
    this.emitter.explode(25, this.player.x, this.player.y);
    sfxDeath();
    GameState.endTurn();
    updateSidebar();
    this.scene.start('TurnAnnounce');
  }

  // ─── Update ──────────────────────────────────────────────────────────
  update() {
    if (this.isDead) return;

    // Handle "new game" from sidebar
    if (GameState._resetRequested) { GameState._resetRequested = false; this.scene.start('Menu'); return; }

    const px = this.player.x, py = this.player.y;
    const onFloor = this.player.body.blocked.down;

    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && onFloor) {
      this.player.setVelocityY(-800);
      sfxJump();
    }

    // Visual rotation
    if (!onFloor) this.playerRot += 0.08;
    else          this.playerRot = Math.round(this.playerRot / (Math.PI / 2)) * (Math.PI / 2);

    // Spawn timers
    if (--this.spawnTimer <= 0)      this._spawnObstacle();
    if (--this.enemySpawnTimer <= 0) this._spawnEnemy();

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x -= this.samySpeed;
      if (o.type === 'saw') o.angle = (o.angle || 0) + 0.15;
      if (o.x < -50) { this.obstacles.splice(i, 1); GameState.roundScore += 5; }
    }

    // Move enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x -= this.samySpeed * 0.8;
      e.phase += 0.06;
      e.y = e.baseY + Math.sin(e.phase) * 20;
      if (e.x < -50) { this.enemies.splice(i, 1); GameState.roundScore += 10; sfxScore(); }
    }

    // Collision (hitbox slightly inset, centered on player body)
    const hw = (SAMY_PW - 6) / 2, hh = (SAMY_PH - 6) / 2;
    if (this._hitsObstacle(px - hw, py - hh, SAMY_PW - 6, SAMY_PH - 6) ||
        this._hitsEnemy   (px - hw, py - hh, SAMY_PW - 6, SAMY_PH - 6)) {
      this._die(); return;
    }

    // Distance score
    this.distance += this.samySpeed;
    if (this.distance >= 100) { this.distance -= 100; GameState.roundScore += 1; }
    this.samySpeed += 0.001;

    // Draw
    this._draw(px, py, onFloor);
    updateCommonHUD(this.hud);
    this.hudSpeed.setText(`SPEED: ${this.samySpeed.toFixed(1)}`);
  }

  // ─── Drawing ─────────────────────────────────────────────────────────
  _draw(px, py, onFloor) {
    const g = this.gfx;
    g.clear();
    drawSpaceBg(g);

    // Ground fill + border
    g.fillStyle(0x2a2a4a);
    g.fillRect(0, SAMY_GROUND_Y, 600, 500 - SAMY_GROUND_Y);
    g.lineStyle(2, 0x5555aa);
    g.beginPath(); g.moveTo(0, SAMY_GROUND_Y); g.lineTo(600, SAMY_GROUND_Y); g.strokePath();

    // Ground grid lines (scrolling)
    g.lineStyle(1, 0x5555aa, 0.3);
    const go = (this.time.now * this.samySpeed * 0.0001 * 60) % 40;
    for (let gx = -go; gx < 600; gx += 40) {
      g.beginPath(); g.moveTo(gx, SAMY_GROUND_Y); g.lineTo(gx, 500); g.strokePath();
    }

    // Obstacles
    for (const o of this.obstacles) {
      if (o.type === 'spike') {
        g.fillStyle(0xff4444);
        g.fillTriangle(o.x, o.y - o.h, o.x - o.w / 2, o.y, o.x + o.w / 2, o.y);
        g.lineStyle(1, 0xff6666); g.strokeTriangle(o.x, o.y - o.h, o.x - o.w / 2, o.y, o.x + o.w / 2, o.y);
      } else if (o.type === 'ceilSpike') {
        g.fillStyle(0xff6644);
        g.fillTriangle(o.x, o.y + o.h, o.x - o.w / 2, o.y, o.x + o.w / 2, o.y);
      } else if (o.type === 'saw') {
        const r = o.w / 2, a = o.angle;
        g.fillStyle(0xaaaaaa); g.fillCircle(o.x, o.y, r);
        g.fillStyle(0xcccccc);
        for (let t = 0; t < 8; t++) {
          const ta = (t / 8) * Math.PI * 2 + a;
          g.fillTriangle(
            o.x + Math.cos(ta - 0.2) * r * 1.15, o.y + Math.sin(ta - 0.2) * r * 1.15,
            o.x + Math.cos(ta)       * r * 0.6,  o.y + Math.sin(ta)       * r * 0.6,
            o.x + Math.cos(ta + 0.2) * r * 1.15, o.y + Math.sin(ta + 0.2) * r * 1.15,
          );
        }
        g.fillStyle(0x666666); g.fillCircle(o.x, o.y, r * 0.25);
      } else {
        g.fillStyle(0xcc3333); g.fillRect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
        g.lineStyle(1, 0xff5555); g.strokeRect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
      }
    }

    // Flying enemies
    for (const e of this.enemies) {
      g.fillStyle(0xdd44ff); g.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      const wOff = Math.sin(this.time.now * 0.02) * 4;
      g.fillStyle(0xaa22cc);
      g.fillTriangle(e.x - e.w / 2, e.y, e.x - e.w / 2 - 8, e.y - 6 + wOff, e.x - e.w / 2, e.y + 4);
      g.fillTriangle(e.x + e.w / 2, e.y, e.x + e.w / 2 + 8, e.y - 6 - wOff, e.x + e.w / 2, e.y + 4);
      g.fillStyle(0xffff00);
      g.fillRect(e.x - 4, e.y - 4, 3, 3); g.fillRect(e.x + 1, e.y - 4, 3, 3);
    }

    // Player (rotated square drawn as a polygon — avoids raw canvas)
    const cos = Math.cos(this.playerRot), sin = Math.sin(this.playerRot);
    const hw = SAMY_PW / 2, hh = SAMY_PH / 2;
    const corners = [
      { x: px + (-hw * cos + hh * sin), y: py + (-hw * sin - hh * cos) },
      { x: px + ( hw * cos + hh * sin), y: py + ( hw * sin - hh * cos) },
      { x: px + ( hw * cos - hh * sin), y: py + ( hw * sin + hh * cos) },
      { x: px + (-hw * cos - hh * sin), y: py + (-hw * sin + hh * cos) },
    ];
    g.fillStyle(0xffaa00);
    g.fillPoints(corners, true);
    g.lineStyle(2, 0xffcc44);
    g.strokePoints(corners, true);
    // Face dots (rotated with player)
    g.fillStyle(0xcc7700);
    for (const [dx, dy] of [[-5, -5], [2, -5], [-4, 3]]) {
      g.fillRect(px + dx * cos - dy * sin, py + dx * sin + dy * cos, 4, 4);
    }

    // Motion trail when airborne
    if (!onFloor) {
      g.fillStyle(0xffaa00, 0.15);
      for (let t = 1; t <= 3; t++) {
        g.fillRect(px - SAMY_PW / 2 - t * 8, py - SAMY_PH / 2 + t * 2, SAMY_PW - t * 2, SAMY_PH - t * 2);
      }
    }
  }

  shutdown() { this.input.keyboard.removeAllListeners(); }
}

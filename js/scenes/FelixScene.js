// ═══════════════════════════════════════════════════════════════════════
// FELIX MODE — Rugby Tackle
//
// Controls: Arrow Up/Down or W/S  ·  Space to tackle  ·  Down/S to duck
// Goal:     Tackle runners; too many missed = turn over
//           Normal +15, fast +20, big +25  ·  Duck dodge +10
//           Missed runner -5, runner hits you = -1 chance
// ═══════════════════════════════════════════════════════════════════════

const FELIX_GROUND_Y = 450;

class FelixScene extends Phaser.Scene {
  constructor() { super({ key: 'Felix' }); }

  // ─── Setup ───────────────────────────────────────────────────────────
  create() {
    GameState.roundScore = 0;
    this.isDead = false;

    this.player   = { x: 120, y: FELIX_GROUND_Y, w: 30, h: 40, speed: 5,
                      ducking: false, tackling: false, tackleTimer: 0, tackleCD: 0, duckH: 22 };
    this.runners  = [];
    this.spawnTimer = 50;
    this.tackles  = 0;
    this.missed   = 0;
    this.maxMissed = 3 + Math.min(GameState.globalRound, 5);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys({ w: 'W', s: 'S', space: 'SPACE' });

    // Particles (two emitters so we avoid setTint() which doesn't exist in Phaser 3.60+)
    this.emitterTackle = createEmitter(this, 0x88cc44);
    this.emitterHit    = createEmitter(this, 0xff4444);

    // Graphics + HUD
    this.gfx = this.add.graphics();
    this.hud = createCommonHUD(this, 'felix');
    this.hudTackles = makeText(this, 590, 22, '', { fontSize: '12px', color: '#44aaff',  align: 'right' }).setOrigin(1, 0);
    this.hudMissed  = makeText(this, 590, 36, '', { fontSize: '12px', color: '#ff4444',  align: 'right' }).setOrigin(1, 0);
    this.hudInfo    = makeText(this, 10, 492, '', { fontSize: '11px', color: '#ffffff' }).setOrigin(0, 1);
    // Jersey number (repositioned each frame in update)
    this.jerseyNum  = makeText(this, 0, 0, '9', { fontSize: '12px', fontStyle: 'bold', color: '#ffffff', align: 'center' }).setOrigin(0.5, 0.5);
    this.jerseyNum.setVisible(false);
  }

  // ─── Update ──────────────────────────────────────────────────────────
  update() {
    if (this.isDead) return;
    if (GameState._resetRequested) { GameState._resetRequested = false; this.scene.start('Menu'); return; }

    const p = this.player, c = this.cursors, k = this.keys;

    p.ducking = c.down.isDown || k.s.isDown;
    const effH = p.ducking ? p.duckH : p.h;

    // Tackle
    if (p.tackleCD > 0) p.tackleCD--;
    if ((c.space.isDown || k.space.isDown) && !p.tackling && p.tackleCD <= 0) {
      p.tackling = true; p.tackleTimer = 15; sfxTackle();
    }
    if (p.tackling) { p.tackleTimer--; if (p.tackleTimer <= 0) { p.tackling = false; p.tackleCD = 10; } }

    // Move
    if (c.up.isDown   || k.w.isDown) p.y -= p.speed;
    if (c.down.isDown || k.s.isDown) p.y += p.speed;
    p.y = Math.max(100, Math.min(FELIX_GROUND_Y, p.y));

    // Spawn runners
    if (--this.spawnTimer <= 0) this._spawnRunner();

    // Update runners
    for (let i = this.runners.length - 1; i >= 0; i--) {
      const r = this.runners[i];
      r.x += r.vx;
      r.armPhase += 0.12;

      if (r.tackled) {
        r.y += 3;
        if (r.y > 540) this.runners.splice(i, 1);
        continue;
      }

      const ey = p.y - effH;
      const tackleW = p.tackling ? 50 : p.w;

      // Tackle hit
      if (p.tackling && rectsOverlap(p.x - 5, ey, tackleW, effH, r.x - r.w / 2, r.y - r.h, r.w, r.h)) {
        r.tackled = true; this.tackles++;
        GameState.roundScore += r.type === 'big' ? 25 : r.type === 'fast' ? 20 : 15;
        this.emitterTackle.explode(12, r.x, r.y - r.h / 2);
        sfxKill(); continue;
      }

      // Collision with non-tackling player
      if (!p.tackling && rectsOverlap(p.x - p.w / 2, ey, p.w, effH, r.x - r.w / 2, r.y - r.h, r.w, r.h)) {
        if (p.ducking && r.type !== 'big') {
          if (!r.passed) { r.passed = true; GameState.roundScore += 10; sfxDodge(); }
        } else {
          this.emitterHit.explode(15, p.x, p.y - effH / 2);
          sfxDeath(); this.missed++; r.tackled = true;
          if (this.missed >= this.maxMissed) { this._endTurn(); return; }
        }
      }

      // Out of screen
      if (r.x < -40) {
        this.runners.splice(i, 1);
        if (!r.tackled && !r.passed) {
          this.missed++; GameState.roundScore -= 5;
          if (this.missed >= this.maxMissed) { this._endTurn(); return; }
        }
      }
    }

    GameState.roundScore += 0.04;
    this._draw();
    // Position jersey number text over player
    const eff2 = this.player.ducking ? this.player.duckH : this.player.h;
    if (!this.player.tackling && !this.player.ducking) {
      this.jerseyNum.setPosition(this.player.x, this.player.y - eff2 / 2 + 4);
      this.jerseyNum.setVisible(true);
    } else {
      this.jerseyNum.setVisible(false);
    }
    updateCommonHUD(this.hud);
    this.hudTackles.setText(`TACKLES: ${this.tackles}`);
    this.hudMissed.setText(`MISSED: ${this.missed}/${this.maxMissed}`);
    this.hudInfo.setText(`🏈 Missed: ${this.missed}/${this.maxMissed}  Tackles: ${this.tackles}`);
  }

  _spawnRunner() {
    const gap  = Math.max(18, 55 - GameState.globalRound * 3);
    this.spawnTimer = gap + Math.random() * 20;
    const lane  = 100 + Math.random() * (FELIX_GROUND_Y - 100);
    const spd   = 3 + Math.min(GameState.globalRound, 12) * 0.3 + Math.random() * 1.5;
    const rt    = Math.random();
    const type  = rt > 0.9 ? 'fast' : rt > 0.7 ? 'big' : 'runner';
    const sz    = type === 'big' ? { w: 35, h: 45 } : type === 'fast' ? { w: 22, h: 32 } : { w: 28, h: 38 };
    this.runners.push({
      x: 630, y: lane, ...sz,
      vx: -spd * (type === 'fast' ? 1.5 : 1),
      type, tackled: false, passed: false, armPhase: Math.random() * Math.PI * 2,
    });
  }

  _endTurn() {
    if (this.isDead) return;
    this.isDead = true;
    GameState.endTurn(); updateSidebar();
    this.scene.start('TurnAnnounce');
  }

  // ─── Drawing ─────────────────────────────────────────────────────────
  _draw() {
    const g = this.gfx, p = this.player;
    const effH = p.ducking ? p.duckH : p.h;
    g.clear();

    // Rugby pitch stripes
    g.fillStyle(0x1a6e1a); g.fillRect(0, 0, 600, 500);
    for (let sx = 0; sx < 600; sx += 60) {
      g.fillStyle(sx % 120 === 0 ? 0x1d721d : 0x176117);
      g.fillRect(sx, 0, 60, 500);
    }
    g.lineStyle(2, 0xffffff, 0.15);
    for (let lx = 60; lx < 600; lx += 80) { g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, 500); g.strokePath(); }
    g.lineStyle(3, 0xffffff, 0.3);
    g.beginPath(); g.moveTo(50, 0); g.lineTo(50, 500); g.strokePath();

    // Goal posts ("H")
    g.lineStyle(4, 0xffffff);
    g.beginPath(); g.moveTo(20, 60);  g.lineTo(20, 440); g.strokePath();
    g.beginPath(); g.moveTo(10, 80);  g.lineTo(30, 80);  g.strokePath();

    // Player
    const px = p.x, py = p.y;
    if (p.tackling) {
      g.fillStyle(0x44aaff);  g.fillRect(px - 5, py - effH + 5, 50, effH - 5);
      g.fillStyle(0x2266aa);  g.fillCircle(px + 40, py - effH / 2, 8);
      g.fillStyle(0xcccccc);  g.fillCircle(px + 40, py - effH / 2, 4);  // helmet visor half
    } else if (p.ducking) {
      g.fillStyle(0x44aaff);  g.fillRect(px - p.w / 2, py - effH, p.w, effH);
      g.fillStyle(0x2266aa);  g.fillCircle(px, py - effH - 4, 6);
    } else {
      g.fillStyle(0x44aaff);  g.fillRect(px - p.w / 2, py - effH, p.w, effH);
      g.fillStyle(0x2266aa);  g.fillCircle(px, py - effH - 6, 8);
      g.fillStyle(0xcccccc);  g.fillCircle(px + 4, py - effH - 6, 4);  // helmet visor
      // Jersey number "9" is drawn by this.jerseyNum (Text object, repositioned in update)
    }

    // Runners
    for (const r of this.runners) {
      if (r.tackled) { g.fillStyle(0x666666); g.fillRect(r.x - r.w / 2, r.y - 8, r.w, 12); continue; }
      const rc = r.type === 'big' ? 0xcc3333 : r.type === 'fast' ? 0xff8800 : 0xdd4444;
      g.fillStyle(rc); g.fillRect(r.x - r.w / 2, r.y - r.h, r.w, r.h);
      const headCol = r.type === 'big' ? 0x881111 : r.type === 'fast' ? 0xaa5500 : 0x992222;
      g.fillStyle(headCol); g.fillCircle(r.x, r.y - r.h - 5, 7);
      // Arms
      const armOff = Math.sin(r.armPhase) * 6;
      g.lineStyle(3, rc);
      g.beginPath(); g.moveTo(r.x - r.w / 2, r.y - r.h * 0.6); g.lineTo(r.x - r.w / 2 - 8, r.y - r.h * 0.6 + armOff); g.strokePath();
      g.beginPath(); g.moveTo(r.x + r.w / 2, r.y - r.h * 0.6); g.lineTo(r.x + r.w / 2 + 8, r.y - r.h * 0.6 - armOff); g.strokePath();
      // Rugby ball (approximated as rotated rect)
      const bx = r.x + r.w / 2 + 6, by = r.y - r.h * 0.6 - armOff;
      g.fillStyle(0x8B4513); g.fillRect(bx - 8, by - 5, 16, 10);
      g.lineStyle(0.8, 0xffffff); g.beginPath(); g.moveTo(bx - 6, by); g.lineTo(bx + 6, by); g.strokePath();
      // Eyes
      g.fillStyle(0xffffff);
      g.fillRect(r.x - 4, r.y - r.h + 5, 3, 3); g.fillRect(r.x + 1, r.y - r.h + 5, 3, 3);
    }
  }

  shutdown() { this.input.keyboard.removeAllListeners(); }
}

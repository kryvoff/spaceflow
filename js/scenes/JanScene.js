// ═══════════════════════════════════════════════════════════════════════
// JAN MODE — Soccer Goalkeeper
//
// Controls: Arrow Up/Down or W/S to move  ·  Space to dive
// Goal:     Save shots; 3 goals conceded = turn over
//           Save +15 (diving save +25), goal conceded -20
//           All shots cleared with no goals = +3 per save bonus
// ═══════════════════════════════════════════════════════════════════════

class JanScene extends Phaser.Scene {
  constructor() { super({ key: 'Jan' }); }

  // ─── Setup ───────────────────────────────────────────────────────────
  create() {
    GameState.roundScore = 0;
    this.isDead = false;

    const GOAL_TOP = 250 - 90, GOAL_BOT = 250 + 90;
    this.GOAL_TOP = GOAL_TOP; this.GOAL_BOT = GOAL_BOT;

    this.keeper = { x: 60, y: 250, w: 20, h: 60, speed: 5, diving: false, diveTimer: 0 };
    this.balls  = [];
    this.goalsConceded = 0;
    this.saves  = 0;
    this.shotTimer  = 60;
    this.shotsTotal = 0;
    this.maxShots   = 15 + GameState.globalRound * 3;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys({ w: 'W', s: 'S', space: 'SPACE' });

    // Particles (two emitters so we avoid setTint() which doesn't exist in Phaser 3.60+)
    this.emitterSave = createEmitter(this, 0x44ff44);
    this.emitterGoal = createEmitter(this, 0xff4444);

    // Graphics + HUD
    this.gfx = this.add.graphics();
    this.hud = createCommonHUD(this, 'jan');
    this.hudSaves = makeText(this, 590, 22, '', { fontSize: '12px', color: '#44ff44', align: 'right' }).setOrigin(1, 0);
    this.hudGoals = makeText(this, 590, 36, '', { fontSize: '12px', color: '#ff4444', align: 'right' }).setOrigin(1, 0);
    this.hudShots = makeText(this, 300, 4,  '', { fontSize: '10px', color: '#888',    align: 'center' }).setOrigin(0.5, 0);
    this.hudInfo  = makeText(this, 10, 492, '', { fontSize: '11px', color: '#ffffff' }).setOrigin(0, 1);
  }

  // ─── Update ──────────────────────────────────────────────────────────
  update() {
    if (this.isDead) return;
    if (GameState._resetRequested) { GameState._resetRequested = false; this.scene.start('Menu'); return; }

    const k = this.keeper, c = this.cursors, ks = this.keys;

    // Move keeper
    if (c.up.isDown   || ks.w.isDown) k.y -= k.speed;
    if (c.down.isDown || ks.s.isDown) k.y += k.speed;
    k.y = Math.max(this.GOAL_TOP + k.h / 2, Math.min(this.GOAL_BOT - k.h / 2, k.y));

    // Dive
    if ((c.space.isDown || ks.space.isDown) && !k.diving) {
      k.diving = true; k.diveTimer = 18; k.h = 90; sfxJump();
    }
    if (k.diving) { k.diveTimer--; if (k.diveTimer <= 0) { k.diving = false; k.h = 60; } }

    // Spawn shots
    if (this.shotsTotal < this.maxShots) {
      this.shotTimer--;
      if (this.shotTimer <= 0) {
        const spd    = 4 + Math.min(GameState.globalRound, 10) * 0.5 + Math.random() * 2;
        const targetY = 250 - 75 + Math.random() * 150;
        const startX  = 610, startY = 60 + Math.random() * 380;
        const dx = 50 - startX, dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curve = (Math.random() - 0.5) * (0.06 + GameState.globalRound * 0.012);
        this.balls.push({ x: startX, y: startY, r: 10, vx: dx / dist * spd, vy: dy / dist * spd, curve, spin: 0, active: true });
        this.shotsTotal++;
        this.shotTimer = Math.max(18, 55 - GameState.globalRound * 3) + Math.random() * 25;
        sfxKick();
      }
    }

    // Update balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (!b.active) continue;
      b.vy += b.curve; b.x += b.vx; b.y += b.vy; b.spin += 0.15;

      // Keeper saves (circle-rect)
      const kx = k.x - k.w / 2, ky = k.y - k.h / 2;
      const clX = Math.max(kx, Math.min(b.x, kx + k.w));
      const clY = Math.max(ky, Math.min(b.y, ky + k.h));
      const dx = b.x - clX, dy = b.y - clY;
      if (dx * dx + dy * dy < b.r * b.r) {
        b.active = false;
        this.saves++;
        GameState.roundScore += 15 + (k.diving ? 10 : 0);
        this.emitterSave.explode(14, b.x, b.y);
        sfxSave(); continue;
      }

      // Goal conceded
      if (b.x < 50 && b.y > this.GOAL_TOP && b.y < this.GOAL_BOT) {
        b.active = false; this.goalsConceded++;
        GameState.roundScore -= 20;
        this.emitterGoal.explode(18, b.x, b.y);
        sfxGoal();
        if (this.goalsConceded >= 3) { this._endTurn(); return; }
        continue;
      }

      // Off-screen
      if (b.x < -20 || b.y < -20 || b.y > 520) {
        b.active = false; this.saves++;
        GameState.roundScore += 5;
      }
    }

    GameState.roundScore += 0.03;

    // All shots fired and cleared
    if (this.shotsTotal >= this.maxShots && this.balls.every(b => !b.active)) {
      GameState.roundScore += this.saves * 3;
      this._endTurn();
    }

    this._draw();
    updateCommonHUD(this.hud);
    this.hudSaves.setText(`SAVES: ${this.saves}`);
    this.hudGoals.setText(`GOALS: ${this.goalsConceded}/3`);
    const rem = this.maxShots - this.shotsTotal + this.balls.filter(b => b.active).length;
    this.hudShots.setText(`SHOTS LEFT: ${rem}`);
    this.hudInfo.setText(`⚽ ${rem} shots left`);
  }

  _endTurn() {
    if (this.isDead) return;
    this.isDead = true;
    GameState.endTurn(); updateSidebar();
    this.scene.start('TurnAnnounce');
  }

  // ─── Drawing ─────────────────────────────────────────────────────────
  _draw() {
    const g = this.gfx, k = this.keeper;
    const GT = this.GOAL_TOP, GB = this.GOAL_BOT;
    g.clear();

    // Pitch stripes
    g.fillStyle(0x1a5a1a); g.fillRect(0, 0, 600, 500);
    for (let sx = 0; sx < 600; sx += 80) {
      g.fillStyle(sx % 160 === 0 ? 0x1d5e1d : 0x175417);
      g.fillRect(sx, 0, 80, 500);
    }

    // Field lines
    g.lineStyle(2, 0xffffff, 0.25);
    g.strokeCircle(300, 250, 60);
    g.beginPath(); g.moveTo(300, 0); g.lineTo(300, 500); g.strokePath();
    g.strokeRect(0, 130, 140, 240);
    g.strokeRect(0, 190, 50, 120);

    // Goal frame
    g.lineStyle(4, 0xffffff);
    g.beginPath(); g.moveTo(50, GT); g.lineTo(50, GB); g.strokePath();
    g.beginPath(); g.moveTo(15, GT); g.lineTo(50, GT); g.strokePath();
    g.beginPath(); g.moveTo(15, GB); g.lineTo(50, GB); g.strokePath();
    g.beginPath(); g.moveTo(15, GT); g.lineTo(15, GB); g.strokePath();
    // Net
    g.lineStyle(1, 0xffffff, 0.12);
    for (let ny = GT; ny <= GB; ny += 15) { g.beginPath(); g.moveTo(15, ny); g.lineTo(50, ny); g.strokePath(); }
    for (let nx = 15; nx <= 50; nx += 10) { g.beginPath(); g.moveTo(nx, GT); g.lineTo(nx, GB); g.strokePath(); }

    // Goalkeeper
    g.fillStyle(k.diving ? 0xffff00 : 0xff8800);
    g.fillRect(k.x - k.w / 2, k.y - k.h / 2, k.w, k.h);
    g.fillStyle(0xffcc88);
    g.fillCircle(k.x, k.y - k.h / 2 - 6, 6);
    g.fillStyle(0x44ff44);
    g.fillRect(k.x - k.w / 2 - 4, k.y - 8, 6, 10);
    g.fillRect(k.x + k.w / 2 - 2, k.y - 8, 6, 10);
    if (k.diving) { g.fillStyle(0xffff00, 0.15); g.fillRect(k.x - k.w / 2 - 6, k.y - k.h / 2 - 4, k.w + 12, k.h + 8); }

    // Balls
    for (const b of this.balls) {
      if (!b.active) continue;
      // Shadow
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(b.x - b.vx * 2, b.y - b.vy * 2, b.r * 0.6);
      // White ball
      g.fillStyle(0xffffff); g.fillCircle(b.x, b.y, b.r);
      g.lineStyle(0.5, 0x999999); g.strokeCircle(b.x, b.y, b.r);
      // Rotating pentagon spots
      g.fillStyle(0x333333);
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 - Math.PI / 2 + b.spin;
        g.fillCircle(b.x + Math.cos(a) * b.r * 0.45, b.y + Math.sin(a) * b.r * 0.45, b.r * 0.2);
      }
    }
  }

  shutdown() { this.input.keyboard.removeAllListeners(); }
}

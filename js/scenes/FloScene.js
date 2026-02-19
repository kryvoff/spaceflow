// ═══════════════════════════════════════════════════════════════════════
// FLO MODE — Space Invaders + Bunnies
//
// Controls: Arrow Left/Right or A/D to move, Space to shoot
// Goal:     Survive the timer; protect bunnies (+5 per survivor)
//           Basic alien kill = +10, shooter alien = +20
//           Bunny hit = -15
// ═══════════════════════════════════════════════════════════════════════

class FloScene extends Phaser.Scene {
  constructor() { super({ key: 'Flo' }); }

  // ─── Setup ───────────────────────────────────────────────────────────
  create() {
    GameState.roundScore = 0;
    GameState.lives = 3;
    GameState.roundTimer = GameState.FLO_ROUND_DURATION + GameState.globalRound * 30;
    this.isDead = false;

    // Player ship
    this.ship = { x: 300, y: 445, w: 36, h: 28, speed: 5, shootCD: 0 };

    // Bunnies
    this.bunnies = this._makeBunnies();

    // Aliens, bullets
    this.aliens       = [];
    this.bullets      = [];   // player bullets
    this.alienBullets = [];
    this.spawnTimer   = 0;
    this.difficulty   = Math.min(GameState.globalRound, 15);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys({ a: 'A', d: 'D', space: 'SPACE' });

    // Particles
    this.emitter = createEmitter(this, 0xff6600);

    // Graphics + HUD (Text objects on top)
    this.gfx = this.add.graphics();
    this.hud = createCommonHUD(this, 'flo');
    this.hudLives = makeText(this, 590, 22, '', { fontSize: '12px', color: '#ff4444', align: 'right' }).setOrigin(1, 0);
    this.hudTimer = makeText(this, 300, 8, '', { fontSize: '8px', color: '#444', align: 'center' }).setOrigin(0.5, 0);
    this.hudBunnies = makeText(this, 10, 492, '', { fontSize: '10px', color: '#ffaadd' }).setOrigin(0, 1);
  }

  _makeBunnies() {
    const count = 14 + Math.min(GameState.globalRound, 10) * 2;
    const cols  = Math.floor(600 / 36);
    return Array.from({ length: count }, (_, i) => ({
      x: 22 + (i % cols) * 35 + (Math.random() - 0.5) * 8,
      y: 500 - 14 - Math.floor(i / cols) * 18,
      alive: true, hop: Math.random() * Math.PI * 2, w: 14, h: 12,
    }));
  }

  // ─── Update ──────────────────────────────────────────────────────────
  update() {
    if (this.isDead) return;
    if (GameState._resetRequested) { GameState._resetRequested = false; this.scene.start('Menu'); return; }

    const s = this.ship;
    const c = this.cursors, k = this.keys;

    // Move ship
    if (c.left.isDown  || k.a.isDown) s.x -= s.speed;
    if (c.right.isDown || k.d.isDown) s.x += s.speed;
    s.x = Math.max(s.w / 2, Math.min(600 - s.w / 2, s.x));

    // Shoot
    if (s.shootCD > 0) s.shootCD--;
    if (k.space.isDown && s.shootCD <= 0) {
      this.bullets.push({ x: s.x, y: s.y - s.h / 2, vy: -7, w: 3, h: 10 });
      s.shootCD = Math.max(6, 12 - Math.floor(GameState.globalRound / 4));
      sfxShoot();
    }

    // Bunny hops
    for (const b of this.bunnies) if (b.alive) b.hop += 0.04;

    // Spawn aliens
    this.spawnTimer--;
    if (this.spawnTimer <= 0) this._spawnAlien();

    // Update aliens
    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const a = this.aliens[i];
      a.y += a.vy; a.x += a.vx;
      if (a.x < 20 || a.x > 580) a.vx *= -1;

      // Shooter fires back
      if (a.type === 'shooter') {
        a.shootTimer--;
        if (a.shootTimer <= 0) {
          const spd = 3.5 + Math.min(GameState.globalRound, 10) * 0.2;
          this.alienBullets.push({ x: a.x, y: a.y + a.h / 2, vy: spd, w: 3, h: 8 });
          a.shootTimer = Math.max(30, 70 - GameState.globalRound * 2) + Math.random() * 30;
        }
      }

      // Alien hits bunny
      let removed = false;
      for (const bn of this.bunnies) {
        if (!bn.alive) continue;
        if (a.y + a.h / 2 > bn.y - 12 && rectsOverlap(a.x - a.w / 2, a.y - a.h / 2, a.w, a.h, bn.x - bn.w / 2, bn.y - bn.h, bn.w, bn.h)) {
          bn.alive = false;
          this.emitter.explode(8, bn.x, bn.y);
          sfxBunnyHit(); GameState.roundScore -= 15;
          this.aliens.splice(i, 1); removed = true; break;
        }
      }
      if (removed) continue;
      if (a.y > 530) { this.aliens.splice(i, 1); continue; }

      // Alien hits player
      if (rectsOverlap(a.x - a.w / 2, a.y - a.h / 2, a.w, a.h, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h)) {
        this.emitter.explode(15, a.x, a.y);
        this.aliens.splice(i, 1);
        GameState.lives--;
        sfxDeath();
        if (GameState.lives <= 0) { this._endTurn(); return; }
      }
    }

    // Player bullets vs aliens
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]; b.y += b.vy;
      if (b.y < -10) { this.bullets.splice(i, 1); continue; }
      for (let j = this.aliens.length - 1; j >= 0; j--) {
        const a = this.aliens[j];
        if (rectsOverlap(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, a.x - a.w / 2, a.y - a.h / 2, a.w, a.h)) {
          a.hp--;
          this.bullets.splice(i, 1);
          if (a.hp <= 0) {
            this.emitter.explode(12, a.x, a.y);
            sfxKill(); GameState.roundScore += a.type === 'shooter' ? 20 : 10;
            this.aliens.splice(j, 1);
          }
          break;
        }
      }
    }

    // Alien bullets
    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const b = this.alienBullets[i]; b.y += b.vy;
      if (b.y > 510) { this.alienBullets.splice(i, 1); continue; }
      // Hit player
      if (rectsOverlap(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h)) {
        this.emitter.explode(10, s.x, s.y);
        this.alienBullets.splice(i, 1);
        GameState.lives--; sfxDeath();
        if (GameState.lives <= 0) { this._endTurn(); return; }
        continue;
      }
      // Hit bunny
      for (const bn of this.bunnies) {
        if (!bn.alive) continue;
        if (rectsOverlap(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, bn.x - bn.w / 2, bn.y - bn.h, bn.w, bn.h)) {
          bn.alive = false;
          this.emitter.explode(8, bn.x, bn.y);
          sfxBunnyHit(); GameState.roundScore -= 15;
          this.alienBullets.splice(i, 1); break;
        }
      }
    }

    GameState.roundScore += 0.05; // survival trickle
    GameState.roundTimer--;
    if (GameState.roundTimer <= 0) {
      GameState.roundScore += this.bunnies.filter(b => b.alive).length * 5;
      this._endTurn();
    }

    this._draw();
    updateCommonHUD(this.hud);
    let ls = ''; for (let i = 0; i < GameState.lives; i++) ls += '♥ ';
    this.hudLives.setText(ls);
    const max = GameState.FLO_ROUND_DURATION + GameState.globalRound * 30;
    const pct = GameState.roundTimer / max;
    this.hudTimer.setText('');   // timer bar drawn in _draw()
    this.hudBunnies.setText(`🐰 ${this.bunnies.filter(b => b.alive).length}/${this.bunnies.length}`);
  }

  _spawnAlien() {
    const rate   = Math.max(10, 50 - this.difficulty * 3);
    this.spawnTimer = rate;
    const shooterChance = Math.min(0.6, 0.15 + GameState.globalRound * 0.04);
    const type   = Math.random() < shooterChance ? 'shooter' : 'basic';
    const spd    = 1 + this.difficulty * 0.18 + Math.random() * 0.5;
    this.aliens.push({
      x: Math.random() * 540 + 30, y: -30, w: 28, h: 22,
      vy: spd, vx: (Math.random() - 0.5) * (2 + this.difficulty * 0.1),
      type, hp: type === 'shooter' ? 2 : 1,
      shootTimer: type === 'shooter' ? 40 + Math.random() * 40 : 9999,
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
    const g = this.gfx, s = this.ship;
    g.clear();
    drawSpaceBg(g);

    // Bunnies
    for (const b of this.bunnies) this._drawBunny(b);

    // Player ship
    g.fillStyle(0x00ddff);
    g.fillTriangle(s.x, s.y - s.h / 2, s.x - s.w / 2, s.y + s.h / 2, s.x + s.w / 2, s.y + s.h / 2);
    g.fillStyle(0x0088aa);
    g.fillRect(s.x - 5, s.y + s.h / 2, 10, 4 + Math.floor(Math.random() * 4));

    // Aliens
    for (const a of this.aliens) {
      g.fillStyle(a.type === 'shooter' ? 0xff3366 : 0x44ff44);
      this._drawAlienShape(g, a.x, a.y, a.w, a.h);
      g.fillStyle(a.type === 'shooter' ? 0xffff00 : 0x000000);
      g.fillRect(a.x - 6, a.y - 3, 4, 4); g.fillRect(a.x + 2, a.y - 3, 4, 4);
    }

    // Player bullets
    for (const b of this.bullets) {
      g.fillStyle(0x00ffff); g.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      g.fillStyle(0x00ffff, 0.3); g.fillRect(b.x - b.w, b.y - b.h / 2 - 2, b.w * 2, b.h + 4);
    }

    // Alien bullets
    g.fillStyle(0xff3366);
    for (const b of this.alienBullets) g.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);

    // Timer bar
    const max = GameState.FLO_ROUND_DURATION + GameState.globalRound * 30;
    const pct = Math.max(0, GameState.roundTimer / max);
    g.fillStyle(0xffffff, 0.1); g.fillRect(200, 8, 200, 6);
    g.fillStyle(0x00ddff);       g.fillRect(200, 8, 200 * pct, 6);
  }

  _drawBunny(b) {
    if (!b.alive) return;
    const g = this.gfx;
    const hopY = Math.abs(Math.sin(b.hop)) * 2;
    const bx = b.x, by = b.y - hopY;
    g.fillStyle(0xffccee); g.fillRect(bx - 5, by - 4, 10, 8); g.fillRect(bx - 3, by - 8, 6, 5);
    g.fillStyle(0xffaadd); g.fillRect(bx - 3, by - 14, 2, 6); g.fillRect(bx + 1, by - 14, 2, 6);
    g.fillStyle(0x000000); g.fillRect(bx - 2, by - 7, 1, 1); g.fillRect(bx + 1, by - 7, 1, 1);
    g.fillStyle(0xffffff); g.fillRect(bx + 5, by - 2, 3, 3);
  }

  _drawAlienShape(g, x, y, w, h) {
    g.fillRect(x - w / 2, y - h / 2, w, h);
    g.fillRect(x - w / 2 - 4, y, 4, h / 2);
    g.fillRect(x + w / 2, y, 4, h / 2);
    g.fillRect(x - 3, y - h / 2 - 5, 2, 5);
    g.fillRect(x + 1, y - h / 2 - 5, 2, 5);
  }

  shutdown() { this.input.keyboard.removeAllListeners(); }
}

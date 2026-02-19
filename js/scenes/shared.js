// ─── Shared utilities used by all Phaser scenes ───────────────────────
// W and H are defined in game.js before scenes are loaded.

// ─── Mode metadata ────────────────────────────────────────────────────
const MODE_COLOR = { flo: '#00ddff', jan: '#44cc44', felix: '#44aaff', samy: '#ffaa00' };
const MODE_EMOJI = { flo: '👾', jan: '⚽', felix: '🏈', samy: '🏃' };
const MODE_NAME  = { flo: 'FLO', jan: 'JAN', felix: 'FELIX', samy: 'SAMY' };
const MODE_LABEL = { flo: '👾 FLO', jan: '⚽ JAN', felix: '🏈 FELIX', samy: '🏃 SAMY' };
const MODE_TIPS  = {
  flo:   'Left/Right to move, Space to shoot · Defend the bunnies! 🐰',
  jan:   'Up/Down to move · Space to dive · 3 goals = turn over',
  felix: 'Up/Down move · Space tackle · Down duck · Tackle the runners!',
  samy:  'Space to jump · One hit = turn over — survive!',
};
const MODE_SCENE = { samy: 'Samy', flo: 'Flo', jan: 'Jan', felix: 'Felix' };

// ─── CSS colour → Phaser int (0xRRGGBB) ──────────────────────────────
function col(cssHex) {
  return parseInt(cssHex.replace('#', ''), 16);
}

// ─── AABB overlap check (kept for modes that use manual collision) ─────
function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// ─── Scrolling star field (shared state across scenes) ────────────────
const STARS = Array.from({ length: 80 }, () => ({
  x: Math.random() * 600,
  y: Math.random() * 500,
  size: Math.random() * 2 + 0.5,
  speed: Math.random() * 0.5 + 0.2,
  alpha: Math.random() * 0.5 + 0.5,
}));

function drawSpaceBg(gfx) {
  gfx.fillStyle(0x0a0a1a);
  gfx.fillRect(0, 0, 600, 500);
  for (const s of STARS) {
    s.y += s.speed;
    if (s.y > 500) { s.y = 0; s.x = Math.random() * 600; }
    gfx.fillStyle(0xffffff, s.alpha);
    gfx.fillRect(s.x, s.y, s.size, s.size);
  }
}

// ─── HUD helpers ──────────────────────────────────────────────────────
function makeText(scene, x, y, str, extra) {
  return scene.add.text(x, y, str, {
    fontFamily: '"Courier New", monospace',
    fontSize: '14px',
    color: '#ffffff',
    ...extra,
  });
}

// Build a common top-bar HUD for all modes and return the text objects
function createCommonHUD(scene, modeKey) {
  const modeCol = MODE_COLOR[modeKey];
  const name = makeText(scene, 10, 4, '', { fontStyle: 'bold' });
  const score = makeText(scene, 590, 4, '', { fontStyle: 'bold', align: 'right' }).setOrigin(1, 0);
  const modeLabel = makeText(scene, 10, 20, MODE_LABEL[modeKey], { fontSize: '11px', color: modeCol });
  const round = makeText(scene, 10, 32, '', { fontSize: '10px', color: '#888' });
  return { name, score, modeLabel, round };
}

function updateCommonHUD(hud) {
  const p = GameState.getCurrentPlayer();
  hud.name.setText(p.name);
  hud.score.setText(`SCORE: ${p.totalScore + Math.max(0, Math.floor(GameState.roundScore))}`);
  hud.round.setText(`ROUND ${GameState.globalRound}`);
}

// ─── Particle emitter factory (one per scene) ─────────────────────────
function createEmitter(scene, tintColor) {
  return scene.add.particles(0, 0, 'pixel', {
    speed: { min: 60, max: 260 },
    angle: { min: 0, max: 360 },
    lifespan: { min: 250, max: 600 },
    scale: { start: 1.2, end: 0 },
    quantity: 0,
    emitting: false,
    tint: tintColor,
  });
}

// ─── Sidebar DOM — player management & game flow ─────────────────────
// Communicates with Phaser via the global `phaserGame` (game.js) and
// shared `GameState` object.  MODE_EMOJI / MODE_NAME come from shared.js.

const nameInput     = document.getElementById('nameInput');
const addBtn        = document.getElementById('addPlayerBtn');
const startBtn      = document.getElementById('startGameBtn');
const nextTurnBtn   = document.getElementById('nextTurnBtn');
const resetBtn      = document.getElementById('resetBtn');
const resetPlayersBtn = document.getElementById('resetPlayersBtn');
const playerListEl  = document.getElementById('playerList');
const setupArea     = document.getElementById('setupArea');
const gameAreaEl    = document.getElementById('gameArea');
const turnNameEl    = document.getElementById('turnName');
const turnModeEl    = document.getElementById('turnMode');
const scoreboardEl  = document.getElementById('scoreboard');

// Switch to a named Phaser scene from outside the game loop.
// Uses scene.scenes (all, not just active) so it works even when a scene has crashed.
function gotoScene(key) {
  if (!phaserGame) return;
  phaserGame.scene.scenes.forEach(s => {
    const k = s.sys.settings.key;
    if (k !== key) { try { phaserGame.scene.stop(k); } catch (e) {} }
  });
  phaserGame.scene.start(key);
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderPlayerList() {
  playerListEl.innerHTML = '';
  GameState.players.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'player-entry';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = p.name;
    const removeSpan = document.createElement('span');
    removeSpan.className = 'remove';
    removeSpan.textContent = '✕';
    removeSpan.addEventListener('click', () => removePlayer(i));
    div.appendChild(nameSpan);
    div.appendChild(removeSpan);
    playerListEl.appendChild(div);
  });
}

function removePlayer(idx) {
  GameState.players.splice(idx, 1);
  renderPlayerList();
  savePlayers();
  startBtn.disabled = GameState.players.length < 1;
}

// Called from Phaser scenes (and the start button) to sync the sidebar UI.
function updateSidebar() {
  const p = GameState.getCurrentPlayer();
  if (!p) return;
  turnNameEl.textContent = p.name;
  turnModeEl.textContent = `${MODE_EMOJI[GameState.mode]} ${MODE_NAME[GameState.mode]} · Round ${GameState.globalRound}`;

  const sorted = [...GameState.players].sort((a, b) => b.totalScore - a.totalScore);
  scoreboardEl.innerHTML = '';
  sorted.forEach((pl, rank) => {
    const row = document.createElement('div');
    row.className = 'sb-row';
    const rankSpan = document.createElement('span');
    rankSpan.className = 'rank';
    rankSpan.textContent = `${rank+1}.`;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'sb-name';
    nameSpan.textContent = pl.name;
    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'sb-score';
    scoreSpan.textContent = pl.totalScore;
    const hiSpan = document.createElement('span');
    hiSpan.className = 'sb-hi';
    hiSpan.textContent = `(${pl.highScore || 0})`;
    row.appendChild(rankSpan);
    row.appendChild(nameSpan);
    row.appendChild(scoreSpan);
    row.appendChild(hiSpan);
    scoreboardEl.appendChild(row);
  });
}

// ─── Event listeners ─────────────────────────────────────────────────
addBtn.addEventListener('click', () => {
  const raw  = nameInput.value.trim();
  const name = sanitize(raw).slice(0, 12);
  if (!name || GameState.players.length >= 8) return;
  if (GameState.players.some(p => p.name === name)) return;
  GameState.players.push({ name, totalScore: 0, highScore: 0 });
  nameInput.value = '';
  renderPlayerList();
  savePlayers();
  startBtn.disabled = GameState.players.length < 1;
  nameInput.focus();
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addBtn.click();
});

resetPlayersBtn.addEventListener('click', () => {
  GameState.players = [];
  localStorage.removeItem('spaceflow_players');
  renderPlayerList();
  startBtn.disabled = true;
});

startBtn.addEventListener('click', () => {
  if (GameState.players.length < 1) return;
  initAudio();
  GameState.currentPlayerIdx = 0;
  GameState.globalRound = 1;
  GameState.mode = 'samy';
  GameState.players.forEach(p => { p.totalScore = 0; });
  setupArea.style.display = 'none';
  gameAreaEl.style.display       = 'flex';
  gameAreaEl.style.flexDirection = 'column';
  gameAreaEl.style.gap           = '10px';
  updateSidebar();
  gotoScene('TurnAnnounce');
});

nextTurnBtn.addEventListener('click', () => {
  stopMusic();
  GameState.endTurn();
  updateSidebar();
  gotoScene('TurnAnnounce');
});

resetBtn.addEventListener('click', () => {
  stopMusic();
  GameState.players.forEach(p => { p.totalScore = 0; });
  GameState.currentPlayerIdx = 0;
  GameState.globalRound = 1;
  GameState.mode = 'samy';
  setupArea.style.display = 'flex';
  gameAreaEl.style.display = 'none';
  renderPlayerList();
  startBtn.disabled = GameState.players.length < 1;
  savePlayers();
  // Signal the active scene to go back to Menu on its next frame
  GameState._resetRequested = true;
});

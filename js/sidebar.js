// ─── Sidebar DOM & event handlers ────────────────────────────────────
const nameInput   = document.getElementById('nameInput');
const addBtn      = document.getElementById('addPlayerBtn');
const startBtn    = document.getElementById('startGameBtn');
const resetBtn    = document.getElementById('resetBtn');
const resetPlayersBtn = document.getElementById('resetPlayersBtn');
const playerListEl = document.getElementById('playerList');
const setupArea   = document.getElementById('setupArea');
const gameAreaEl  = document.getElementById('gameArea');
const turnNameEl  = document.getElementById('turnName');
const turnModeEl  = document.getElementById('turnMode');
const scoreboardEl = document.getElementById('scoreboard');

function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderPlayerList() {
  playerListEl.innerHTML = '';
  players.forEach((p, i) => {
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
  players.splice(idx, 1);
  renderPlayerList();
  savePlayers();
  startBtn.disabled = players.length < 1;
}

function updateSidebar() {
  if (state === 'menu') return;
  const p = getCurrentPlayer();
  turnNameEl.textContent = p.name;
  const modeEmoji = mode==='flo' ? '👾' : mode==='jan' ? '⚽' : mode==='felix' ? '🏈' : '🏃';
  const modeName  = mode==='flo' ? 'FLO' : mode==='jan' ? 'JAN' : mode==='felix' ? 'FELIX' : 'SAMY';
  turnModeEl.textContent = `${modeEmoji} ${modeName} · Round ${globalRound}`;

  // Scoreboard
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
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
  if (!name || players.length >= 8) return;
  if (players.some(p => p.name === name)) return;
  players.push({ name, totalScore: 0, highScore: 0 });
  nameInput.value = '';
  renderPlayerList();
  savePlayers();
  startBtn.disabled = players.length < 1;
  nameInput.focus();
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addBtn.click();
});

resetPlayersBtn.addEventListener('click', () => {
  players = [];
  localStorage.removeItem('spaceflow_players');
  renderPlayerList();
  startBtn.disabled = true;
});

startBtn.addEventListener('click', () => {
  if (players.length < 1) return;
  initAudio();
  currentPlayerIdx = 0;
  globalRound      = 1;
  mode             = 'samy';
  players.forEach(p => p.totalScore = 0);
  setupArea.style.display = 'none';
  gameAreaEl.style.display       = 'flex';
  gameAreaEl.style.flexDirection = 'column';
  gameAreaEl.style.gap           = '10px';
  state             = 'turnAnnounce';
  turnAnnounceTimer = TURN_ANNOUNCE_DURATION;
  updateSidebar();
});

resetBtn.addEventListener('click', () => {
  stopMusic();
  state = 'menu';
  players.forEach(p => p.totalScore = 0);
  currentPlayerIdx = 0;
  globalRound      = 1;
  mode             = 'samy';
  setupArea.style.display = 'flex';
  gameAreaEl.style.display = 'none';
  renderPlayerList();
  startBtn.disabled = players.length < 1;
  savePlayers();
});

// ─── Players & game state ─────────────────────────────────────────────
let players = [];
let currentPlayerIdx = 0;
let globalRound = 1;

let state = 'menu'; // 'menu' | 'turnAnnounce' | 'playing'
let mode  = 'samy'; // 'samy' | 'flo' | 'jan' | 'felix'

let roundScore = 0;
let lives = 3;
let roundTimer = 0;
let turnAnnounceTimer = 0;

const FLO_ROUND_DURATION   = 600;
const TURN_ANNOUNCE_DURATION = 150;

function getCurrentPlayer() { return players[currentPlayerIdx]; }

// ─── Turn management ──────────────────────────────────────────────────
function endCurrentTurn() {
  const p = getCurrentPlayer();
  const finalScore = Math.max(0, Math.floor(roundScore));
  p.totalScore += finalScore;
  if (p.totalScore > (p.highScore || 0)) p.highScore = p.totalScore;
  roundScore = 0;

  stopMusic();
  sfxRoundEnd();
  savePlayers();

  currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
  if (currentPlayerIdx === 0) globalRound++;

  // Rotate mode: samy → flo → jan → felix → samy
  mode = mode === 'samy' ? 'flo' : mode === 'flo' ? 'jan' : mode === 'jan' ? 'felix' : 'samy';

  state = 'turnAnnounce';
  turnAnnounceTimer = TURN_ANNOUNCE_DURATION;
  updateSidebar();
}

function startCurrentTurn() {
  particles = [];
  if      (mode === 'samy')  { initSamy();  startMusic('samy'); }
  else if (mode === 'jan')   { initJan();   startMusic('jan'); }
  else if (mode === 'felix') { initFelix(); startMusic('felix'); }
  else                       { initFlo();   startMusic('flo'); }
  state = 'playing';
  updateSidebar();
}

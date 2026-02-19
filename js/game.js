// ─── SpaceFlow — Phaser 3 game configuration & shared state ──────────
//
// GameState is a plain JS object (no Phaser dependency) shared by all
// Phaser scenes and by the DOM sidebar code in sidebar.js.
//
// phaserGame is the global Phaser.Game instance.  sidebar.js uses it
// to switch scenes (e.g. phaserGame.scene.start('TurnAnnounce')).

const W = 600, H = 500;

// ─── GameState ────────────────────────────────────────────────────────
const GameState = {
  players: [],
  currentPlayerIdx: 0,
  globalRound: 1,
  mode: 'samy',
  roundScore: 0,
  lives: 3,
  roundTimer: 0,
  FLO_ROUND_DURATION: 600,

  // Flag read by the active scene each frame; set by sidebar "New Game"
  _resetRequested: false,

  getCurrentPlayer() { return this.players[this.currentPlayerIdx]; },

  // Call BEFORE scene.start('TurnAnnounce') when a turn ends.
  // Updates scores, rotates player/mode, persists.
  endTurn() {
    const p = this.getCurrentPlayer();
    p.totalScore += Math.max(0, Math.floor(this.roundScore));
    if (p.totalScore > (p.highScore || 0)) p.highScore = p.totalScore;
    this.roundScore = 0;

    stopMusic();
    sfxRoundEnd();
    savePlayers();

    this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
    if (this.currentPlayerIdx === 0) this.globalRound++;

    const next = { samy: 'flo', flo: 'jan', jan: 'felix', felix: 'samy' };
    this.mode = next[this.mode];
  },
};

// ─── Phaser boot ─────────────────────────────────────────────────────
let phaserGame;

window.addEventListener('DOMContentLoaded', () => {
  phaserGame = new Phaser.Game({
    type: Phaser.CANVAS,
    canvas: document.getElementById('game'),
    width: W,
    height: H,
    backgroundColor: '#0a0a1a',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [
      BootScene,
      MenuScene,
      TurnAnnounceScene,
      SamyScene,
      FloScene,
      JanScene,
      FelixScene,
    ],
  });

  loadPlayers();
  document.getElementById('nameInput').focus();
});

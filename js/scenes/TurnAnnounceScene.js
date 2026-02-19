// ─── TurnAnnounceScene: "Next Up" card between turns ─────────────────
class TurnAnnounceScene extends Phaser.Scene {
  constructor() { super({ key: 'TurnAnnounce' }); }

  create() {
    updateSidebar();

    this.gfx = this.add.graphics();

    const m   = GameState.mode;
    const p   = GameState.getCurrentPlayer();
    const col = MODE_COLOR[m];
    const cx  = 300;
    const add = (x, y, txt, extra) => makeText(this, x, y, txt, { ...extra }).setOrigin(0.5, 0);

    // Dim overlay (drawn once on top of bg)
    this.add.rectangle(cx, 250, 600, 500, 0x000000, 0.85).setOrigin(0.5);

    add(cx, 185, 'NEXT UP',                              { fontSize: '16px', fontStyle: 'bold' });
    add(cx, 215, p.name,                                 { fontSize: '36px', fontStyle: 'bold', color: col });
    add(cx, 265, `${MODE_EMOJI[m]} ${MODE_NAME[m]} MODE`, { fontSize: '20px', color: col });
    add(cx, 300, `Round ${GameState.globalRound}`,        { fontSize: '12px', color: '#888' });
    add(cx, 320, MODE_TIPS[m],                            { fontSize: '10px', color: col });

    this.pressText = add(cx, 360, 'PRESS ENTER TO PLAY', { fontSize: '14px', fontStyle: 'bold', color: '#aaa' });
    this.pressText.setVisible(false);

    // Accept input after 0.6 s to avoid accidental skip
    this.ready = false;
    this.time.delayedCall(600, () => {
      this.ready = true;
      this.blinkEvent = this.time.addEvent({
        delay: 500, loop: true,
        callback: () => { if (this.pressText.active) this.pressText.setVisible(!this.pressText.visible); },
      });
      // Register the listener only after the delay so an accidental Enter from
      // the "Start Game" button click doesn't immediately skip the announcement.
      this.input.keyboard.once('keydown-ENTER', () => this._startTurn());
    });
  }

  update() {
    this.gfx.clear();
    drawSpaceBg(this.gfx);
  }

  _startTurn() {
    initAudio();
    startMusic(GameState.mode);
    this.scene.start(MODE_SCENE[GameState.mode]);
  }

  shutdown() {
    this.input.keyboard.removeAllListeners();
    if (this.blinkEvent) this.blinkEvent.destroy();
  }
}

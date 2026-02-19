// ─── MenuScene: title screen (shown while players sign up in the sidebar)
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'Menu' }); }

  create() {
    this.gfx = this.add.graphics();

    const cx = 300;
    const add = (x, y, txt, extra) => makeText(this, x, y, txt, { ...extra }).setOrigin(0.5, 0);

    add(cx, 150, 'SPACEFLOW',                                 { fontSize: '44px', fontStyle: 'bold', color: '#00ddff' });
    add(cx, 198, 'Four games. One challenge.',                { fontSize: '13px', color: '#888' });
    add(cx, 235, '👾 FLO — Defend the bunnies from aliens',  { fontSize: '12px', color: '#00ddff' });
    add(cx, 255, '🏃 SAMY — Jump & survive!',                { fontSize: '12px', color: '#ffaa00' });
    add(cx, 275, '⚽ JAN — Block the shots!',               { fontSize: '12px', color: '#44cc44' });
    add(cx, 295, '🏈 FELIX — Tackle the runners!',          { fontSize: '12px', color: '#44aaff' });
    add(cx, 325, '← Add players in the sidebar',            { fontSize: '14px', color: '#666' });
    add(cx, 343, 'then press START',                         { fontSize: '14px', color: '#666' });
    add(cx, 370, 'Players take turns. Rounds get harder.',   { fontSize: '10px', color: '#444' });
    add(cx, 385, 'ENTER = start next round',                 { fontSize: '10px', color: '#444' });
  }

  update() {
    this.gfx.clear();
    drawSpaceBg(this.gfx);
  }
}

// ─── BootScene: runs once to set up shared textures ───────────────────
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  create() {
    // White 4×4 square — used as source texture for all particle emitters
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('pixel', 4, 4);
    g.destroy();

    this.scene.start('Menu');
  }
}

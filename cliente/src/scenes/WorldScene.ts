import Phaser from 'phaser';

const TILE = 64;
const MAP_COLUMNS = 48;
const MAP_ROWS = 36;
const WALK_SPEED = 190;

type Facing = 'south' | 'west' | 'east' | 'north';

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private facing: Facing = 'south';
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('world');
  }

  preload(): void {
    this.load.spritesheet('player', '/assets/characters/player/player-placeholder.png', {
      frameWidth: 64,
      frameHeight: 96,
    });
    this.load.spritesheet('sylvaren', '/assets/tilesets/sylvaren/sylvaren-placeholder.png', {
      frameWidth: TILE,
      frameHeight: TILE,
    });
  }

  create(): void {
    this.createAnimations();
    const mapData = this.createMapData();
    const map = this.make.tilemap({ data: mapData, tileWidth: TILE, tileHeight: TILE });
    const tiles = map.addTilesetImage('sylvaren', 'sylvaren', TILE, TILE, 0, 0, 1);
    if (!tiles) throw new Error('Não foi possível carregar o tileset de Sylvaren.');
    const ground = map.createLayer(0, tiles, 0, 0);
    if (!ground) throw new Error('Não foi possível criar a camada do mapa.');

    // Índices do tilemap começam em 1: 3 = árvore (frame 2), 4 = pedra (frame 3).
    ground.setCollision([3, 4]);
    this.physics.world.setBounds(0, 0, MAP_COLUMNS * TILE, MAP_ROWS * TILE);

    this.player = this.physics.add.sprite(15 * TILE + TILE / 2, 17 * TILE + TILE / 2, 'player', 0);
    this.player.setOrigin(0.5, 0.875);
    this.player.setSize(24, 22);
    this.player.setOffset(20, 62);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(this.player.y);
    this.physics.add.collider(this.player, ground);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.wasd;

    this.cameras.main.setBounds(0, 0, MAP_COLUMNS * TILE, MAP_ROWS * TILE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 48);
    this.cameras.main.setRoundPixels(true);

    this.add.rectangle(8, 8, 248, 38, 0x171d2b, 0.84).setOrigin(0).setScrollFactor(0).setDepth(1000)
      .setStrokeStyle(1, 0xb8d879, 0.65);
    this.add.text(16, 13, 'AETHERION / SYLVAREN', {
      fontFamily: 'monospace', fontSize: '8px', color: '#F1EBD9', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(1001);
    this.add.text(16, 27, 'WASD / SETAS · EXPLORE', {
      fontFamily: 'monospace', fontSize: '6px', color: '#B8D879',
    }).setScrollFactor(0).setDepth(1001);
    this.status = this.add.text(8, 0, '', {
      fontFamily: 'monospace', fontSize: '6px', color: '#F1EBD9',
      backgroundColor: '#171D2BDD', padding: { x: 4, y: 3 },
    }).setScrollFactor(0).setDepth(1001);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.positionStatus, this);
    this.positionStatus();
  }

  update(): void {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const direction = new Phaser.Math.Vector2(Number(right) - Number(left), Number(down) - Number(up));
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.player.setVelocity(direction.x * WALK_SPEED, direction.y * WALK_SPEED);
      if (Math.abs(direction.x) > Math.abs(direction.y)) this.facing = direction.x < 0 ? 'west' : 'east';
      else this.facing = direction.y < 0 ? 'north' : 'south';
      this.player.anims.play(`walk-${this.facing}`, true);
    } else {
      this.player.setVelocity(0, 0);
      this.player.anims.play(`idle-${this.facing}`, true);
    }
    this.player.setDepth(this.player.y);
    this.status.setText(`POS  ${Math.floor(this.player.x / TILE)}, ${Math.floor(this.player.y / TILE)}   ·   COLISÃO ATIVA`);
  }

  private createAnimations(): void {
    const rows: Record<Facing, number> = { south: 0, west: 1, east: 2, north: 3 };
    for (const [facing, row] of Object.entries(rows) as [Facing, number][]) {
      const idleFrame = row * 3;
      this.anims.create({
        key: `idle-${facing}`,
        frames: [{ key: 'player', frame: idleFrame }],
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `walk-${facing}`,
        frames: this.anims.generateFrameNumbers('player', { start: idleFrame + 1, end: idleFrame + 2 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  private createMapData(): number[][] {
    const data = Array.from({ length: MAP_ROWS }, () => Array<number>(MAP_COLUMNS).fill(1));
    // Manchas de vegetação decorativa. A faixa central fica livre para caminhar.
    for (let y = 2; y < MAP_ROWS - 2; y += 5) {
      for (let x = 2 + (y % 3); x < MAP_COLUMNS - 2; x += 7) data[y][x] = 2;
    }
    // Árvores em pequenos agrupamentos; mantém uma clareira inicial e caminhos entre áreas.
    const groves = [[5, 5], [30, 5], [39, 14], [6, 27], [33, 28], [20, 7], [19, 29]];
    for (const [gx, gy] of groves) {
      for (let y = gy; y < gy + 3; y++) for (let x = gx; x < gx + 3; x++) {
        if ((x + y) % 4 !== 0 && !(x === 15 && y === 17)) data[y][x] = 3;
      }
    }
    // Pedras fora da clareira.
    for (const [x, y] of [[12, 8], [26, 10], [41, 25], [13, 29], [35, 18], [3, 18]]) data[y][x] = 4;
    // Borda sólida de cenário para evidenciar os limites da câmera/mundo.
    for (let x = 0; x < MAP_COLUMNS; x++) { data[0][x] = 3; data[MAP_ROWS - 1][x] = 3; }
    for (let y = 0; y < MAP_ROWS; y++) { data[y][0] = 3; data[y][MAP_COLUMNS - 1] = 3; }
    return data;
  }

  private positionStatus(): void {
    if (this.status) this.status.setPosition(8, this.scale.height - 22);
  }
}

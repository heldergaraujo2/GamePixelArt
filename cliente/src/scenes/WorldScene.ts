import Phaser from 'phaser';

const TILE = 64;
const MAP_COLUMNS = 48;
const MAP_ROWS = 36;
const WALK_SPEED = 190;
type Facing = 'south' | 'west' | 'east' | 'north';

interface FrameRect { x: number; y: number; width: number; height: number }
interface DirectionFrames { frames: FrameRect[] }
interface AnimationSpec {
  fps: number;
  loop: boolean;
  directions: Partial<Record<Facing, DirectionFrames>>;
}
interface SpriteManifest {
  id: string;
  source: string;
  frameSize: { width: number; height: number };
  pivot: { x: number; y: number };
  animations: Record<string, AnimationSpec>;
}
interface TileSpec extends FrameRect {
  id: string;
  solid: boolean;
  walkable: boolean;
}
interface TilesetManifest {
  id: string;
  source: string;
  tiles: TileSpec[];
}

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
    this.load.json('player-manifest', '/assets/characters/player/manifest.json');
    this.load.json('sylvaren-manifest', '/assets/tilesets/sylvaren/manifest.json');
    // Carregamos cada PNG como textura única: os retângulos reais vêm dos manifests,
    // não de uma suposição de spritesheet uniforme feita pelo loader do Phaser.
    this.load.image('player-source', '/assets/characters/player/player-placeholder.png');
    this.load.image('sylvaren-source', '/assets/tilesets/sylvaren/sylvaren-placeholder.png');
  }

  create(): void {
    const playerManifest = this.cache.json.get('player-manifest') as SpriteManifest;
    const tilesetManifest = this.cache.json.get('sylvaren-manifest') as TilesetManifest;
    this.assertSource(playerManifest.source, 'player-placeholder.png', 'player');
    this.assertSource(tilesetManifest.source, 'sylvaren-placeholder.png', 'tileset');
    this.registerPlayerFrames(playerManifest);
    this.registerTileFrames(tilesetManifest);
    this.createAnimations(playerManifest);

    const mapData = this.createMapData(tilesetManifest);
    const map = this.make.tilemap({ data: mapData, tileWidth: TILE, tileHeight: TILE });
    const tiles = map.addTilesetImage('sylvaren', 'sylvaren-source', TILE, TILE, 0, 0, 1);
    if (!tiles) throw new Error('Não foi possível carregar o tileset de Sylvaren.');
    const ground = map.createLayer(0, tiles, 0, 0);
    if (!ground) throw new Error('Não foi possível criar a camada do mapa.');

    const solidIndexes = tilesetManifest.tiles
      .map((tile, index) => tile.solid ? index + 1 : -1)
      .filter((index) => index >= 0);
    ground.setCollision(solidIndexes);
    this.physics.world.setBounds(0, 0, MAP_COLUMNS * TILE, MAP_ROWS * TILE);

    this.player = this.physics.add.sprite(15 * TILE + TILE / 2, 17 * TILE + TILE / 2, 'player-source', 'idle-south-0');
    this.player.setOrigin(0.5, playerManifest.pivot.y / playerManifest.frameSize.height);
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

  private assertSource(source: string, expectedFile: string, label: string): void {
    if (!source || !source.endsWith(expectedFile)) {
      throw new Error(`Manifest de ${label} aponta para um asset inesperado: ${source}`);
    }
  }

  private registerPlayerFrames(manifest: SpriteManifest): void {
    const texture = this.textures.get('player-source');
    for (const [animationName, animation] of Object.entries(manifest.animations)) {
      for (const [direction, spec] of Object.entries(animation.directions) as [Facing, DirectionFrames][]) {
        spec.frames.forEach((rect, index) => {
          const frameName = `${animationName}-${direction}-${index}`;
          this.addManifestFrame(texture, frameName, rect, 'player');
        });
      }
    }
  }

  private registerTileFrames(manifest: TilesetManifest): void {
    const texture = this.textures.get('sylvaren-source');
    for (const tile of manifest.tiles) this.addManifestFrame(texture, tile.id, tile, 'tileset');
  }

  private addManifestFrame(texture: Phaser.Textures.Texture, name: string, rect: FrameRect, label: string): void {
    if (rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height <= 0) {
      throw new Error(`Frame inválido no manifest de ${label}: ${name}`);
    }
    const source = texture.getSourceImage() as HTMLImageElement;
    if (rect.x + rect.width > source.width || rect.y + rect.height > source.height) {
      throw new Error(`Frame ${name} excede as dimensões do PNG de ${label}.`);
    }
    texture.add(name, 0, rect.x, rect.y, rect.width, rect.height);
  }

  private createAnimations(manifest: SpriteManifest): void {
    for (const [animationName, animation] of Object.entries(manifest.animations)) {
      for (const [direction, spec] of Object.entries(animation.directions) as [Facing, DirectionFrames][]) {
        const frames = spec.frames.map((_, index) => ({
          key: 'player-source',
          frame: `${animationName}-${direction}-${index}`,
        }));
        this.anims.create({
          key: `${animationName}-${direction}`,
          frames,
          frameRate: animation.fps,
          repeat: animation.loop ? -1 : 0,
        });
      }
    }
  }

  private createMapData(manifest: TilesetManifest): number[][] {
    const tileIndex = (id: string): number => {
      const index = manifest.tiles.findIndex((tile) => tile.id === id);
      if (index < 0) throw new Error(`Tile '${id}' não foi definido no manifest Sylvaren.`);
      return index + 1;
    };
    const ground = tileIndex('grass-ground');
    const grass = tileIndex('grass-tufts');
    const tree = tileIndex('tree');
    const stone = tileIndex('stone');
    const data = Array.from({ length: MAP_ROWS }, () => Array<number>(MAP_COLUMNS).fill(ground));

    for (let y = 2; y < MAP_ROWS - 2; y += 5) {
      for (let x = 2 + (y % 3); x < MAP_COLUMNS - 2; x += 7) data[y][x] = grass;
    }
    const groves = [[5, 5], [30, 5], [39, 14], [6, 27], [33, 28], [20, 7], [19, 29]];
    for (const [gx, gy] of groves) {
      for (let y = gy; y < gy + 3; y++) for (let x = gx; x < gx + 3; x++) {
        if ((x + y) % 4 !== 0) data[y][x] = tree;
      }
    }
    for (const [x, y] of [[12, 8], [26, 10], [41, 25], [13, 29], [35, 18], [3, 18]]) data[y][x] = stone;
    for (let x = 0; x < MAP_COLUMNS; x++) { data[0][x] = tree; data[MAP_ROWS - 1][x] = tree; }
    for (let y = 0; y < MAP_ROWS; y++) { data[y][0] = tree; data[y][MAP_COLUMNS - 1] = tree; }
    return data;
  }

  private positionStatus(): void {
    if (this.status) this.status.setPosition(8, this.scale.height - 22);
  }
}

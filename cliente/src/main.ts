import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  // Base lógica 640×360: escala inteira 2× a 1280×720 e 3× a 1920×1080.
  width: 640,
  height: 360,
  backgroundColor: '#171D2B',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
  powerPreference: 'high-performance',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 360,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [WorldScene],
};

new Phaser.Game(config);

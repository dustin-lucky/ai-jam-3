import Phaser from 'phaser';
import { BettingScene } from './scenes/BettingScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BettingScene, ArenaScene, ResultsScene],
};

new Phaser.Game(config);

import '../style.css'
import Phaser, { CANVAS } from 'phaser'
import GameScene from './scenes/GameScene'
import MainMenu from './scenes/MainMenu'

const res = {
    width: 1280,
    height: 720
  }

const config = {
    type: Phaser.AUTO,
    width: res.width,
    height: res.height,
    parent: 'gameDiv',
    scene: [MainMenu, GameScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: {y: 0},
        debug: false
      }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    fps: {
      target: 60,
      forceSetTimeOut: true
    }
  }

  new Phaser.Game(config)
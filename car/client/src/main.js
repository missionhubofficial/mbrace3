import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { TournamentScene } from './scenes/TournamentScene.js';
import { AuthManager } from './managers/AuthManager.js';
import { SocketManager } from './managers/SocketManager.js';
import { UIManager } from './managers/UIManager.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, LobbyScene, TournamentScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    input: {
        activePointers: 3
    }
};

// Initialize managers
window.authManager = new AuthManager();
window.socketManager = new SocketManager();
window.uiManager = new UIManager();

// Start the game
const game = new Phaser.Game(config);

// Hide loading screen when game is ready
game.events.once('ready', () => {
    document.getElementById('loading').style.display = 'none';
});

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.refresh();
});

// Mobile controls setup
const setupMobileControls = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        const leftBtn = document.getElementById('btn-left');
        const rightBtn = document.getElementById('btn-right');
        const brakeBtn = document.getElementById('btn-brake');
        const gasBtn = document.getElementById('btn-gas');
        
        // Add touch event listeners
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('LEFT').isDown = true;
        });
        
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('LEFT').isDown = false;
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('RIGHT').isDown = true;
        });
        
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('RIGHT').isDown = false;
        });
        
        brakeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('DOWN').isDown = true;
        });
        
        brakeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('DOWN').isDown = false;
        });
        
        gasBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('UP').isDown = true;
        });
        
        gasBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            game.input.keyboard.addKey('UP').isDown = false;
        });
    }
};

// Initialize mobile controls
setupMobileControls();

export default game;

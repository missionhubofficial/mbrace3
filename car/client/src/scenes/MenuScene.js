import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load placeholder assets
        this.load.image('car', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('track', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
        
        // Title
        this.add.text(width / 2, height / 4, 'MissionHub Car Game', {
            fontSize: '48px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(width / 2, height / 4 + 60, 'Multiplayer Racing Tournament', {
            fontSize: '24px',
            fill: '#bdc3c7',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Menu buttons
        const buttonStyle = {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 }
        };
        
        // Single Player
        const singlePlayerBtn = this.add.text(width / 2, height / 2, 'Single Player', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('GameScene', { mode: 'singleplayer' });
            });
        
        // Multiplayer
        const multiplayerBtn = this.add.text(width / 2, height / 2 + 60, 'Multiplayer', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('LobbyScene');
            });
        
        // Tournament
        const tournamentBtn = this.add.text(width / 2, height / 2 + 120, 'Tournament', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('TournamentScene');
            });
        
        // Settings
        const settingsBtn = this.add.text(width / 2, height / 2 + 180, 'Settings', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.showSettings();
            });
        
        // Auth status
        this.updateAuthStatus();
        
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    update() {
        if (this.cursors.up.isDown || this.spaceKey.isDown) {
            this.scene.start('GameScene', { mode: 'singleplayer' });
        }
    }
    
    updateAuthStatus() {
        const { width, height } = this.cameras.main;
        
        // Remove existing auth text
        if (this.authText) {
            this.authText.destroy();
        }
        
        const isLoggedIn = window.authManager && window.authManager.isLoggedIn();
        const authStatus = isLoggedIn ? 'Logged In' : 'Guest Mode';
        const authColor = isLoggedIn ? '#27ae60' : '#e74c3c';
        
        this.authText = this.add.text(width - 20, 20, authStatus, {
            fontSize: '16px',
            fill: authColor,
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        
        // Login/Logout button
        if (this.authBtn) {
            this.authBtn.destroy();
        }
        
        const buttonText = isLoggedIn ? 'Logout' : 'Login';
        this.authBtn = this.add.text(width - 20, 50, buttonText, {
            fontSize: '14px',
            fill: '#3498db',
            fontFamily: 'Arial',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0)
        .setInteractive()
        .on('pointerdown', () => {
            if (isLoggedIn) {
                window.authManager.logout();
            } else {
                this.showLoginOptions();
            }
        });
    }
    
    showLoginOptions() {
        // Simple login options - in production, integrate with Firebase Auth
        const { width, height } = this.cameras.main;
        
        const loginModal = this.add.rectangle(width / 2, height / 2, 400, 300, 0x2c3e50, 0.9);
        loginModal.setStroke(2, 0x3498db);
        
        this.add.text(width / 2, height / 2 - 100, 'Login Options', {
            fontSize: '24px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Email login placeholder
        const emailBtn = this.add.text(width / 2, height / 2 - 30, 'Email Login (Coming Soon)', {
            fontSize: '16px',
            fill: '#bdc3c7',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            // Placeholder for email login
            console.log('Email login clicked');
        });
        
        // Google login placeholder
        const googleBtn = this.add.text(width / 2, height / 2 + 20, 'Google Login (Coming Soon)', {
            fontSize: '16px',
            fill: '#bdc3c7',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            // Placeholder for Google login
            console.log('Google login clicked');
        });
        
        // Guest mode
        const guestBtn = this.add.text(width / 2, height / 2 + 70, 'Continue as Guest', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            loginModal.destroy();
            this.updateAuthStatus();
        });
        
        // Close button
        const closeBtn = this.add.text(width / 2 + 180, height / 2 - 130, '×', {
            fontSize: '24px',
            fill: '#e74c3c',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            loginModal.destroy();
        });
    }
    
    showSettings() {
        const { width, height } = this.cameras.main;
        
        const settingsModal = this.add.rectangle(width / 2, height / 2, 500, 400, 0x2c3e50, 0.9);
        settingsModal.setStroke(2, 0x3498db);
        
        this.add.text(width / 2, height / 2 - 150, 'Settings', {
            fontSize: '28px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Sound toggle
        this.add.text(width / 2 - 100, height / 2 - 80, 'Sound:', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        const soundToggle = this.add.text(width / 2 + 50, height / 2 - 80, 'ON', {
            fontSize: '16px',
            fill: '#27ae60',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            // Toggle sound
            console.log('Sound toggled');
        });
        
        // Graphics quality
        this.add.text(width / 2 - 100, height / 2 - 40, 'Graphics:', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        const graphicsToggle = this.add.text(width / 2 + 50, height / 2 - 40, 'HIGH', {
            fontSize: '16px',
            fill: '#3498db',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            // Toggle graphics quality
            console.log('Graphics quality toggled');
        });
        
        // Close button
        const closeBtn = this.add.text(width / 2 + 230, height / 2 - 180, '×', {
            fontSize: '24px',
            fill: '#e74c3c',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            settingsModal.destroy();
        });
    }
}

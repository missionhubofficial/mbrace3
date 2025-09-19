import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.players = new Map();
        this.aiBots = [];
        this.checkpoints = [];
        this.lapTimes = new Map();
        this.raceStarted = false;
        this.raceFinished = false;
        this.gameMode = 'singleplayer';
    }

    init(data) {
        this.gameMode = data.mode || 'singleplayer';
    }

    preload() {
        // Create placeholder car sprite
        this.load.image('car', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('track', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Create track
        this.createTrack();
        
        // Create player car
        this.createPlayer();
        
        // Create AI bots for singleplayer
        if (this.gameMode === 'singleplayer') {
            this.createAIBots();
        }
        
        // Setup physics
        this.setupPhysics();
        
        // Setup controls
        this.setupControls();
        
        // Setup UI
        this.setupUI();
        
        // Setup checkpoints
        this.setupCheckpoints();
        
        // Start race countdown
        this.startRaceCountdown();
        
        // Connect to multiplayer if needed
        if (this.gameMode === 'multiplayer' && window.socketManager) {
            this.setupMultiplayer();
        }
    }

    createTrack() {
        const { width, height } = this.cameras.main;
        
        // Simple oval track
        this.track = this.add.graphics();
        this.track.lineStyle(20, 0x8B4513); // Brown track
        this.track.strokeEllipse(width / 2, height / 2, width * 0.8, height * 0.6);
        
        // Track boundaries for collision
        this.trackBounds = this.add.graphics();
        this.trackBounds.lineStyle(2, 0x000000, 0);
        this.trackBounds.strokeEllipse(width / 2, height / 2, width * 0.8, height * 0.6);
        
        // Inner boundary
        this.innerBounds = this.add.graphics();
        this.innerBounds.lineStyle(2, 0x000000, 0);
        this.innerBounds.strokeEllipse(width / 2, height / 2, width * 0.6, height * 0.4);
    }

    createPlayer() {
        const { width, height } = this.cameras.main;
        
        // Player car
        this.player = this.physics.add.sprite(width / 2, height * 0.7, 'car');
        this.player.setDisplaySize(30, 50);
        this.player.setTint(0x3498db); // Blue
        this.player.setCollideWorldBounds(false);
        
        // Player physics
        this.player.setMaxVelocity(200);
        this.player.setDrag(0.95);
        this.player.setAngularDrag(0.9);
        
        // Player data
        this.player.lap = 0;
        this.player.checkpoint = 0;
        this.player.speed = 0;
        this.player.maxSpeed = 200;
        this.player.acceleration = 150;
        this.player.turnSpeed = 200;
    }

    createAIBots() {
        const { width, height } = this.cameras.main;
        const botCount = 3;
        
        for (let i = 0; i < botCount; i++) {
            const bot = this.physics.add.sprite(
                width / 2 + (i - 1) * 40, 
                height * 0.7 + (i + 1) * 30, 
                'car'
            );
            bot.setDisplaySize(30, 50);
            bot.setTint(0xe74c3c + i * 0x111111); // Different colors
            bot.setCollideWorldBounds(false);
            
            // Bot physics
            bot.setMaxVelocity(180 + i * 10);
            bot.setDrag(0.95);
            bot.setAngularDrag(0.9);
            
            // Bot data
            bot.lap = 0;
            bot.checkpoint = 0;
            bot.speed = 0;
            bot.maxSpeed = 180 + i * 10;
            bot.acceleration = 120 + i * 10;
            bot.turnSpeed = 150 + i * 20;
            bot.isAI = true;
            bot.difficulty = 0.7 + i * 0.1; // 0.7 to 1.0
            
            this.aiBots.push(bot);
        }
    }

    setupPhysics() {
        // Collision between cars
        this.physics.add.collider(this.player, this.aiBots);
        
        // Track boundary collision
        this.physics.add.collider(this.player, this.trackBounds);
        this.aiBots.forEach(bot => {
            this.physics.add.collider(bot, this.trackBounds);
        });
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Gamepad support
        this.input.gamepad.on('down', (pad, button) => {
            if (button.index === 0) { // A button
                this.accelerate();
            } else if (button.index === 1) { // B button
                this.brake();
            }
        });
    }

    setupUI() {
        const { width, height } = this.cameras.main;
        
        // Speed display
        this.speedText = this.add.text(20, 20, 'Speed: 0', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        
        // Lap display
        this.lapText = this.add.text(20, 50, 'Lap: 1/3', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        
        // Position display
        this.positionText = this.add.text(20, 80, 'Position: 1', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        
        // Timer
        this.timerText = this.add.text(width - 20, 20, '00:00', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        
        // Race status
        this.statusText = this.add.text(width / 2, 50, '', {
            fontSize: '32px',
            fill: '#f39c12',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    setupCheckpoints() {
        const { width, height } = this.cameras.main;
        
        // Create checkpoints around the track
        this.checkpoints = [
            { x: width / 2, y: height * 0.3, radius: 50 }, // Top
            { x: width * 0.7, y: height / 2, radius: 50 }, // Right
            { x: width / 2, y: height * 0.7, radius: 50 }, // Bottom
            { x: width * 0.3, y: height / 2, radius: 50 }  // Left
        ];
        
        // Visual checkpoints
        this.checkpoints.forEach((checkpoint, index) => {
            const circle = this.add.circle(checkpoint.x, checkpoint.y, checkpoint.radius, 0x00ff00, 0.3);
            this.add.text(checkpoint.x, checkpoint.y, (index + 1).toString(), {
                fontSize: '16px',
                fill: '#000000',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });
    }

    startRaceCountdown() {
        let countdown = 3;
        this.statusText.setText(countdown.toString());
        
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    this.statusText.setText(countdown.toString());
                } else {
                    this.statusText.setText('GO!');
                    this.raceStarted = true;
                    this.time.delayedCall(1000, () => {
                        this.statusText.setText('');
                    });
                }
            },
            repeat: countdown
        });
    }

    setupMultiplayer() {
        // Setup Socket.IO events for multiplayer
        window.socketManager.on('playerJoined', (playerData) => {
            this.addPlayer(playerData);
        });
        
        window.socketManager.on('playerLeft', (playerId) => {
            this.removePlayer(playerId);
        });
        
        window.socketManager.on('playerUpdate', (playerData) => {
            this.updatePlayer(playerData);
        });
        
        window.socketManager.on('raceStart', () => {
            this.raceStarted = true;
        });
        
        window.socketManager.on('raceEnd', (results) => {
            this.endRace(results);
        });
    }

    addPlayer(playerData) {
        const player = this.physics.add.sprite(playerData.x, playerData.y, 'car');
        player.setDisplaySize(30, 50);
        player.setTint(playerData.color);
        player.setCollideWorldBounds(false);
        
        player.lap = 0;
        player.checkpoint = 0;
        player.speed = 0;
        player.isRemote = true;
        
        this.players.set(playerData.id, player);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.destroy();
            this.players.delete(playerId);
        }
    }

    updatePlayer(playerData) {
        const player = this.players.get(playerData.id);
        if (player) {
            player.setPosition(playerData.x, playerData.y);
            player.setRotation(playerData.rotation);
            player.lap = playerData.lap;
            player.checkpoint = playerData.checkpoint;
        }
    }

    update() {
        if (!this.raceStarted || this.raceFinished) return;
        
        // Handle player input
        this.handlePlayerInput();
        
        // Update AI bots
        this.updateAIBots();
        
        // Update UI
        this.updateUI();
        
        // Check checkpoints
        this.checkCheckpoints();
        
        // Send multiplayer updates
        if (this.gameMode === 'multiplayer' && window.socketManager) {
            this.sendPlayerUpdate();
        }
    }

    handlePlayerInput() {
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.accelerate();
        }
        
        if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.brake();
        }
        
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.turnLeft();
        }
        
        if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.turnRight();
        }
    }

    accelerate() {
        if (this.player.speed < this.player.maxSpeed) {
            this.player.speed += this.player.acceleration * 0.016;
            this.player.setVelocity(
                Math.cos(this.player.rotation) * this.player.speed,
                Math.sin(this.player.rotation) * this.player.speed
            );
        }
    }

    brake() {
        this.player.speed *= 0.9;
        this.player.setVelocity(
            Math.cos(this.player.rotation) * this.player.speed,
            Math.sin(this.player.rotation) * this.player.speed
        );
    }

    turnLeft() {
        this.player.setAngularVelocity(-this.player.turnSpeed);
    }

    turnRight() {
        this.player.setAngularVelocity(this.player.turnSpeed);
    }

    updateAIBots() {
        this.aiBots.forEach(bot => {
            // Simple AI: follow the track and avoid other cars
            const targetCheckpoint = this.checkpoints[bot.checkpoint];
            const distance = Phaser.Math.Distance.Between(bot.x, bot.y, targetCheckpoint.x, targetCheckpoint.y);
            
            if (distance < targetCheckpoint.radius) {
                bot.checkpoint = (bot.checkpoint + 1) % this.checkpoints.length;
            }
            
            // Move towards next checkpoint
            const angle = Phaser.Math.Angle.Between(
                bot.x, bot.y, 
                targetCheckpoint.x, targetCheckpoint.y
            );
            
            bot.setRotation(angle);
            
            // Accelerate with some randomness
            if (Math.random() < bot.difficulty) {
                bot.speed = Math.min(bot.speed + bot.acceleration * 0.016, bot.maxSpeed);
                bot.setVelocity(
                    Math.cos(bot.rotation) * bot.speed,
                    Math.sin(bot.rotation) * bot.speed
                );
            }
        });
    }

    updateUI() {
        // Update speed
        this.speedText.setText(`Speed: ${Math.round(this.player.speed)}`);
        
        // Update lap
        this.lapText.setText(`Lap: ${this.player.lap + 1}/3`);
        
        // Update position
        const allCars = [this.player, ...this.aiBots];
        allCars.sort((a, b) => b.lap - a.lap || b.checkpoint - a.checkpoint);
        const position = allCars.indexOf(this.player) + 1;
        this.positionText.setText(`Position: ${position}`);
        
        // Update timer
        const elapsed = Math.floor(this.time.now / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    checkCheckpoints() {
        this.checkpoints.forEach((checkpoint, index) => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                checkpoint.x, checkpoint.y
            );
            
            if (distance < checkpoint.radius && this.player.checkpoint === index) {
                this.player.checkpoint = (this.player.checkpoint + 1) % this.checkpoints.length;
                
                // Check if lap completed
                if (this.player.checkpoint === 0 && index === this.checkpoints.length - 1) {
                    this.player.lap++;
                    
                    if (this.player.lap >= 3) {
                        this.endRace();
                    }
                }
            }
        });
    }

    sendPlayerUpdate() {
        if (window.socketManager) {
            window.socketManager.emit('playerUpdate', {
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
                lap: this.player.lap,
                checkpoint: this.player.checkpoint
            });
        }
    }

    endRace(results = null) {
        this.raceFinished = true;
        this.raceStarted = false;
        
        // Show race results
        const { width, height } = this.cameras.main;
        
        const resultsModal = this.add.rectangle(width / 2, height / 2, 400, 300, 0x2c3e50, 0.9);
        resultsModal.setStroke(2, 0x3498db);
        
        this.add.text(width / 2, height / 2 - 100, 'Race Finished!', {
            fontSize: '28px',
            fill: '#f39c12',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Show position
        const allCars = [this.player, ...this.aiBots];
        allCars.sort((a, b) => b.lap - a.lap || b.checkpoint - a.checkpoint);
        const position = allCars.indexOf(this.player) + 1;
        
        this.add.text(width / 2, height / 2 - 50, `You finished ${position}${this.getOrdinalSuffix(position)}!`, {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Continue button
        const continueBtn = this.add.text(width / 2, height / 2 + 50, 'Continue', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Send results to server if multiplayer
        if (this.gameMode === 'multiplayer' && window.socketManager) {
            window.socketManager.emit('raceComplete', {
                position: position,
                lap: this.player.lap,
                time: this.time.now
            });
        }
    }

    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }
}

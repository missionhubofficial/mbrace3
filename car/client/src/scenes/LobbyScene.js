import Phaser from 'phaser';

export class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.rooms = [];
        this.currentRoom = null;
        this.players = [];
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
        
        // Title
        this.add.text(width / 2, 50, 'Multiplayer Lobby', {
            fontSize: '36px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Create room button
        const createRoomBtn = this.add.text(width / 2, 120, 'Create Room', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.createRoom();
        });
        
        // Refresh rooms button
        const refreshBtn = this.add.text(width / 2, 160, 'Refresh Rooms', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.refreshRooms();
        });
        
        // Back button
        const backBtn = this.add.text(50, 50, '← Back', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        }).setOrigin(0, 0)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Room list container
        this.roomListContainer = this.add.container(0, 0);
        
        // Setup Socket.IO
        this.setupSocketIO();
        
        // Load initial rooms
        this.refreshRooms();
    }

    setupSocketIO() {
        if (!window.socketManager) return;
        
        // Room events
        window.socketManager.on('roomList', (rooms) => {
            this.updateRoomList(rooms);
        });
        
        window.socketManager.on('roomCreated', (room) => {
            this.rooms.push(room);
            this.updateRoomList(this.rooms);
        });
        
        window.socketManager.on('roomJoined', (room) => {
            this.currentRoom = room;
            this.showRoomDetails(room);
        });
        
        window.socketManager.on('playerJoined', (player) => {
            this.players.push(player);
            this.updatePlayerList();
        });
        
        window.socketManager.on('playerLeft', (playerId) => {
            this.players = this.players.filter(p => p.id !== playerId);
            this.updatePlayerList();
        });
        
        window.socketManager.on('roomStart', () => {
            this.scene.start('GameScene', { mode: 'multiplayer' });
        });
    }

    createRoom() {
        const roomName = prompt('Enter room name:') || `Room ${Date.now()}`;
        
        if (window.socketManager) {
            window.socketManager.emit('createRoom', {
                name: roomName,
                maxPlayers: 8,
                isPrivate: false
            });
        } else {
            // Fallback for offline mode
            const room = {
                id: Date.now().toString(),
                name: roomName,
                players: 1,
                maxPlayers: 8,
                isPrivate: false,
                status: 'waiting'
            };
            this.rooms.push(room);
            this.updateRoomList(this.rooms);
        }
    }

    refreshRooms() {
        if (window.socketManager) {
            window.socketManager.emit('getRooms');
        } else {
            // Mock rooms for offline testing
            this.rooms = [
                { id: '1', name: 'Test Room 1', players: 2, maxPlayers: 8, status: 'waiting' },
                { id: '2', name: 'Test Room 2', players: 5, maxPlayers: 8, status: 'waiting' },
                { id: '3', name: 'Test Room 3', players: 8, maxPlayers: 8, status: 'full' }
            ];
            this.updateRoomList(this.rooms);
        }
    }

    updateRoomList(rooms) {
        this.rooms = rooms;
        
        // Clear existing room list
        this.roomListContainer.removeAll();
        
        const { width, height } = this.cameras.main;
        
        // Room list title
        this.roomListContainer.add(this.add.text(width / 2, 220, 'Available Rooms', {
            fontSize: '24px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5));
        
        // Display rooms
        rooms.forEach((room, index) => {
            const y = 280 + index * 60;
            
            // Room background
            const roomBg = this.add.rectangle(width / 2, y, width - 100, 50, 0x34495e);
            roomBg.setStroke(2, 0x3498db);
            
            // Room info
            const roomText = this.add.text(width / 2 - 200, y, `${room.name} (${room.players}/${room.maxPlayers})`, {
                fontSize: '18px',
                fill: '#ecf0f1',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            // Room status
            const statusText = this.add.text(width / 2 + 100, y, room.status.toUpperCase(), {
                fontSize: '16px',
                fill: room.status === 'waiting' ? '#27ae60' : '#e74c3c',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            // Join button
            const joinBtn = this.add.text(width / 2 + 200, y, 'Join', {
                fontSize: '16px',
                fill: '#ecf0f1',
                fontFamily: 'Arial',
                backgroundColor: '#3498db',
                padding: { x: 15, y: 8 }
            }).setOrigin(0, 0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.joinRoom(room.id);
            });
            
            // Disable join button if room is full
            if (room.players >= room.maxPlayers) {
                joinBtn.setTint(0x7f8c8d);
                joinBtn.removeInteractive();
            }
            
            this.roomListContainer.add([roomBg, roomText, statusText, joinBtn]);
        });
    }

    joinRoom(roomId) {
        if (window.socketManager) {
            window.socketManager.emit('joinRoom', roomId);
        } else {
            // Fallback for offline mode
            const room = this.rooms.find(r => r.id === roomId);
            if (room) {
                this.currentRoom = room;
                this.showRoomDetails(room);
            }
        }
    }

    showRoomDetails(room) {
        const { width, height } = this.cameras.main;
        
        // Clear room list
        this.roomListContainer.removeAll();
        
        // Room details background
        const roomDetailsBg = this.add.rectangle(width / 2, height / 2, width - 100, height - 200, 0x2c3e50);
        roomDetailsBg.setStroke(2, 0x3498db);
        
        // Room title
        this.add.text(width / 2, 150, room.name, {
            fontSize: '28px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Players list
        this.add.text(width / 2, 200, 'Players in Room', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Player list container
        this.playerListContainer = this.add.container(0, 0);
        
        // Start game button (only for room creator)
        const startBtn = this.add.text(width / 2, height - 100, 'Start Game', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.startGame();
        });
        
        // Leave room button
        const leaveBtn = this.add.text(width / 2, height - 60, 'Leave Room', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.leaveRoom();
        });
        
        this.roomListContainer.add([roomDetailsBg, startBtn, leaveBtn]);
        
        // Update player list
        this.updatePlayerList();
    }

    updatePlayerList() {
        if (!this.playerListContainer) return;
        
        this.playerListContainer.removeAll();
        
        const { width, height } = this.cameras.main;
        
        // Display players
        this.players.forEach((player, index) => {
            const y = 250 + index * 40;
            
            const playerText = this.add.text(width / 2 - 200, y, player.name || `Player ${player.id}`, {
                fontSize: '16px',
                fill: '#ecf0f1',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            const readyText = this.add.text(width / 2 + 100, y, player.ready ? 'READY' : 'NOT READY', {
                fontSize: '14px',
                fill: player.ready ? '#27ae60' : '#e74c3c',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            this.playerListContainer.add([playerText, readyText]);
        });
    }

    startGame() {
        if (window.socketManager) {
            window.socketManager.emit('startGame');
        } else {
            // Fallback for offline mode
            this.scene.start('GameScene', { mode: 'multiplayer' });
        }
    }

    leaveRoom() {
        if (window.socketManager) {
            window.socketManager.emit('leaveRoom');
        }
        
        this.currentRoom = null;
        this.players = [];
        this.refreshRooms();
    }
}

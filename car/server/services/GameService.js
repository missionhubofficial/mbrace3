const Game = require('../models/Game');
const User = require('../models/User');

class GameService {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.playerSockets = new Map();
    }

    createRoom(socket, data) {
        try {
            const roomId = this.generateRoomId();
            const room = {
                id: roomId,
                name: data.name || `Room ${roomId}`,
                maxPlayers: data.maxPlayers || 8,
                isPrivate: data.isPrivate || false,
                players: [],
                status: 'waiting',
                createdAt: new Date()
            };

            this.rooms.set(roomId, room);
            
            // Join the room
            socket.join(roomId);
            socket.roomId = roomId;
            
            // Add creator as first player
            this.addPlayerToRoom(socket, roomId, data.playerData);
            
            socket.emit('roomCreated', room);
            this.broadcastRoomList();
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    joinRoom(socket, roomId) {
        try {
            const room = this.rooms.get(roomId);
            if (!room) {
                throw new Error('Room not found');
            }

            if (room.players.length >= room.maxPlayers) {
                throw new Error('Room is full');
            }

            if (room.status !== 'waiting') {
                throw new Error('Room is not accepting new players');
            }

            // Join the room
            socket.join(roomId);
            socket.roomId = roomId;
            
            // Add player to room
            this.addPlayerToRoom(socket, roomId, { name: `Player ${room.players.length + 1}` });
            
            socket.emit('roomJoined', room);
            this.broadcastRoomUpdate(roomId);
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    leaveRoom(socket) {
        if (!socket.roomId) return;

        const roomId = socket.roomId;
        const room = this.rooms.get(roomId);
        
        if (room) {
            // Remove player from room
            room.players = room.players.filter(p => p.socketId !== socket.id);
            
            // If no players left, delete room
            if (room.players.length === 0) {
                this.rooms.delete(roomId);
            } else {
                this.broadcastRoomUpdate(roomId);
            }
        }

        socket.leave(roomId);
        socket.roomId = null;
        this.playerSockets.delete(socket.id);
        
        socket.emit('roomLeft');
        this.broadcastRoomList();
    }

    getRooms(socket) {
        const publicRooms = Array.from(this.rooms.values())
            .filter(room => !room.isPrivate)
            .map(room => ({
                id: room.id,
                name: room.name,
                players: room.players.length,
                maxPlayers: room.maxPlayers,
                status: room.status
            }));

        socket.emit('roomList', publicRooms);
    }

    startGame(socket) {
        if (!socket.roomId) return;

        const room = this.rooms.get(socket.roomId);
        if (!room) return;

        // Check if all players are ready
        const allReady = room.players.every(p => p.ready);
        if (!allReady) {
            socket.emit('error', { message: 'Not all players are ready' });
            return;
        }

        if (room.players.length < 2) {
            socket.emit('error', { message: 'Need at least 2 players to start' });
            return;
        }

        // Start countdown
        room.status = 'countdown';
        this.broadcastRoomUpdate(socket.roomId);
        
        // Countdown sequence
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            this.io.to(socket.roomId).emit('countdown', countdown);
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                this.startRace(socket.roomId);
            }
        }, 1000);
    }

    startRace(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.status = 'racing';
        this.broadcastRoomUpdate(roomId);
        
        this.io.to(roomId).emit('raceStart', {
            roomId,
            players: room.players,
            settings: room.settings || {}
        });
    }

    updatePlayer(socket, data) {
        if (!socket.roomId) return;

        const room = this.rooms.get(socket.roomId);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Update player data
        Object.assign(player, data);
        
        // Broadcast to other players in room
        socket.to(socket.roomId).emit('playerUpdate', {
            socketId: socket.id,
            ...data
        });
    }

    handlePlayerAction(socket, data) {
        if (!socket.roomId) return;

        const { action, data: actionData } = data;
        
        // Broadcast action to other players
        socket.to(socket.roomId).emit('playerAction', {
            socketId: socket.id,
            action,
            data: actionData
        });
    }

    handleRaceComplete(socket, data) {
        if (!socket.roomId) return;

        const room = this.rooms.get(socket.roomId);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Mark player as finished
        player.finished = true;
        player.finishTime = new Date();
        player.position = data.position;
        player.lapTimes = data.lapTimes || [];

        // Check if all players finished
        const finishedPlayers = room.players.filter(p => p.finished);
        if (finishedPlayers.length === room.players.length) {
            this.endRace(roomId);
        }

        this.broadcastRoomUpdate(roomId);
    }

    handleCollision(socket, data) {
        if (!socket.roomId) return;

        // Broadcast collision to all players in room
        this.io.to(socket.roomId).emit('collision', {
            socketId: socket.id,
            ...data
        });
    }

    endRace(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.status = 'finished';
        
        // Calculate final results
        const results = room.players
            .filter(p => p.finished)
            .sort((a, b) => {
                if (a.lap !== b.lap) return b.lap - a.lap;
                if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;
                return a.finishTime - b.finishTime;
            })
            .map((player, index) => ({
                socketId: player.socketId,
                name: player.name,
                position: index + 1,
                lap: player.lap,
                checkpoint: player.checkpoint,
                finishTime: player.finishTime
            }));

        this.io.to(roomId).emit('raceEnd', {
            roomId,
            results
        });

        // Update user stats if logged in
        this.updateUserStats(results);

        // Clean up room after delay
        setTimeout(() => {
            this.rooms.delete(roomId);
        }, 30000); // 30 seconds
    }

    async updateUserStats(results) {
        try {
            for (const result of results) {
                const player = results.find(p => p.socketId === result.socketId);
                if (!player) continue;

                // Find user by socket ID (this would need to be tracked)
                // For now, skip user stats update
                // In production, you'd track socketId to userId mapping
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    handleDisconnect(socket) {
        this.leaveRoom(socket);
    }

    addPlayerToRoom(socket, roomId, playerData) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        const usedColors = room.players.map(p => p.color);
        const availableColors = colors.filter(c => !usedColors.includes(c));

        const player = {
            socketId: socket.id,
            name: playerData.name || `Player ${room.players.length + 1}`,
            color: availableColors[0] || colors[room.players.length % colors.length],
            ready: false,
            finished: false,
            lap: 0,
            checkpoint: 0,
            position: { x: 0, y: 0, rotation: 0 },
            speed: 0
        };

        room.players.push(player);
        this.playerSockets.set(socket.id, { roomId, player });
    }

    broadcastRoomUpdate(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        this.io.to(roomId).emit('roomUpdate', room);
    }

    broadcastRoomList() {
        const publicRooms = Array.from(this.rooms.values())
            .filter(room => !room.isPrivate)
            .map(room => ({
                id: room.id,
                name: room.name,
                players: room.players.length,
                maxPlayers: room.maxPlayers,
                status: room.status
            }));

        this.io.emit('roomList', publicRooms);
    }

    generateRoomId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Cleanup old rooms
    cleanupOldRooms() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [roomId, room] of this.rooms.entries()) {
            if (now - room.createdAt.getTime() > maxAge) {
                this.rooms.delete(roomId);
            }
        }
    }
}

module.exports = GameService;

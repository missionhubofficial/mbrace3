const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    maxPlayers: {
        type: Number,
        default: 8,
        min: 2,
        max: 8
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['waiting', 'countdown', 'racing', 'finished'],
        default: 'waiting'
    },
    players: [{
        socketId: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        name: {
            type: String,
            required: true
        },
        color: {
            type: String,
            default: '#3498db'
        },
        position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            rotation: { type: Number, default: 0 }
        },
        lap: {
            type: Number,
            default: 0
        },
        checkpoint: {
            type: Number,
            default: 0
        },
        speed: {
            type: Number,
            default: 0
        },
        ready: {
            type: Boolean,
            default: false
        },
        finished: {
            type: Boolean,
            default: false
        },
        finishTime: {
            type: Date,
            default: null
        },
        lapTimes: [{
            type: Number // in milliseconds
        }]
    }],
    settings: {
        laps: {
            type: Number,
            default: 3
        },
        trackId: {
            type: String,
            default: 'default'
        },
        aiDifficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        }
    },
    results: [{
        playerId: {
            type: String,
            required: true
        },
        position: {
            type: Number,
            required: true
        },
        totalTime: {
            type: Number,
            required: true
        },
        bestLapTime: {
            type: Number,
            required: true
        },
        averageLapTime: {
            type: Number,
            required: true
        },
        distance: {
            type: Number,
            default: 0
        }
    }],
    startedAt: {
        type: Date,
        default: null
    },
    finishedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
gameSchema.index({ roomId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ createdAt: -1 });
gameSchema.index({ 'players.userId': 1 });

// Pre-save middleware
gameSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance methods
gameSchema.methods.addPlayer = function(socketId, playerData) {
    if (this.status !== 'waiting') {
        throw new Error('Game is not accepting new players');
    }
    
    if (this.players.length >= this.maxPlayers) {
        throw new Error('Game is full');
    }
    
    const existingPlayer = this.players.find(p => p.socketId === socketId);
    if (existingPlayer) {
        throw new Error('Player already in game');
    }
    
    const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    const usedColors = this.players.map(p => p.color);
    const availableColors = colors.filter(c => !usedColors.includes(c));
    
    this.players.push({
        socketId,
        userId: playerData.userId || null,
        name: playerData.name || `Player ${this.players.length + 1}`,
        color: availableColors[0] || colors[this.players.length % colors.length],
        ...playerData
    });
    
    return this.save();
};

gameSchema.methods.removePlayer = function(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
    
    // If no players left, mark game as finished
    if (this.players.length === 0) {
        this.status = 'finished';
        this.finishedAt = new Date();
    }
    
    return this.save();
};

gameSchema.methods.updatePlayer = function(socketId, updateData) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) {
        throw new Error('Player not found');
    }
    
    Object.assign(player, updateData);
    return this.save();
};

gameSchema.methods.setPlayerReady = function(socketId, ready) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) {
        throw new Error('Player not found');
    }
    
    player.ready = ready;
    return this.save();
};

gameSchema.methods.canStart = function() {
    return this.status === 'waiting' && 
           this.players.length >= 2 && 
           this.players.every(p => p.ready);
};

gameSchema.methods.startGame = function() {
    if (!this.canStart()) {
        throw new Error('Game cannot be started');
    }
    
    this.status = 'countdown';
    this.startedAt = new Date();
    return this.save();
};

gameSchema.methods.startRacing = function() {
    if (this.status !== 'countdown') {
        throw new Error('Game is not in countdown phase');
    }
    
    this.status = 'racing';
    return this.save();
};

gameSchema.methods.finishPlayer = function(socketId, finishData) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) {
        throw new Error('Player not found');
    }
    
    player.finished = true;
    player.finishTime = new Date();
    player.lapTimes = finishData.lapTimes || [];
    
    // Check if all players finished
    const finishedPlayers = this.players.filter(p => p.finished);
    if (finishedPlayers.length === this.players.length) {
        this.finishGame();
    }
    
    return this.save();
};

gameSchema.methods.finishGame = function() {
    this.status = 'finished';
    this.finishedAt = new Date();
    
    // Calculate results
    this.calculateResults();
    return this.save();
};

gameSchema.methods.calculateResults = function() {
    const finishedPlayers = this.players
        .filter(p => p.finished)
        .sort((a, b) => {
            // Sort by lap, then by checkpoint, then by finish time
            if (a.lap !== b.lap) return b.lap - a.lap;
            if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;
            return a.finishTime - b.finishTime;
        });
    
    this.results = finishedPlayers.map((player, index) => ({
        playerId: player.socketId,
        position: index + 1,
        totalTime: player.finishTime - this.startedAt,
        bestLapTime: Math.min(...player.lapTimes),
        averageLapTime: player.lapTimes.reduce((a, b) => a + b, 0) / player.lapTimes.length,
        distance: this.calculateDistance(player)
    }));
};

gameSchema.methods.calculateDistance = function(player) {
    // Simple distance calculation based on laps and checkpoints
    const trackLength = 1000; // meters per lap
    return (player.lap * trackLength) + (player.checkpoint * trackLength / 4);
};

gameSchema.methods.getPlayerBySocketId = function(socketId) {
    return this.players.find(p => p.socketId === socketId);
};

gameSchema.methods.getPlayerByUserId = function(userId) {
    return this.players.find(p => p.userId && p.userId.toString() === userId.toString());
};

gameSchema.methods.getLeaderboard = function() {
    return this.results.sort((a, b) => a.position - b.position);
};

// Static methods
gameSchema.statics.findByRoomId = function(roomId) {
    return this.findOne({ roomId });
};

gameSchema.statics.getActiveGames = function() {
    return this.find({ status: { $in: ['waiting', 'countdown', 'racing'] } })
        .sort({ createdAt: -1 });
};

gameSchema.statics.getGamesByUser = function(userId) {
    return this.find({ 'players.userId': userId })
        .sort({ createdAt: -1 });
};

gameSchema.statics.cleanupOldGames = function() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    return this.deleteMany({
        status: 'finished',
        finishedAt: { $lt: cutoffTime }
    });
};

module.exports = mongoose.model('Game', gameSchema);

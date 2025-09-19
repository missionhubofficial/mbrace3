const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    maxPlayers: {
        type: Number,
        required: true,
        min: 2,
        max: 32
    },
    entryFee: {
        type: Number,
        required: true,
        min: 0
    },
    prizePool: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed', 'cancelled'],
        default: 'waiting'
    },
    type: {
        type: String,
        enum: ['single_elimination', 'double_elimination', 'round_robin'],
        default: 'single_elimination'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    players: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        position: {
            type: Number,
            default: null
        },
        prize: {
            type: Number,
            default: 0
        }
    }],
    bracket: [{
        round: {
            type: Number,
            required: true
        },
        match: {
            type: Number,
            required: true
        },
        player1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        player2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'completed'],
            default: 'pending'
        },
        gameId: {
            type: String,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        }
    }],
    currentRound: {
        type: Number,
        default: 0
    },
    settings: {
        raceLaps: {
            type: Number,
            default: 3
        },
        aiDifficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        trackId: {
            type: String,
            default: 'default'
        }
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
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
tournamentSchema.index({ status: 1, createdAt: -1 });
tournamentSchema.index({ creator: 1 });
tournamentSchema.index({ 'players.user': 1 });
tournamentSchema.index({ entryFee: 1 });
tournamentSchema.index({ prizePool: -1 });

// Pre-save middleware
tournamentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance methods
tournamentSchema.methods.addPlayer = function(userId) {
    if (this.status !== 'waiting') {
        throw new Error('Tournament is not accepting new players');
    }
    
    if (this.players.length >= this.maxPlayers) {
        throw new Error('Tournament is full');
    }
    
    const existingPlayer = this.players.find(p => p.user.toString() === userId.toString());
    if (existingPlayer) {
        throw new Error('Player already in tournament');
    }
    
    this.players.push({ user: userId });
    return this.save();
};

tournamentSchema.methods.removePlayer = function(userId) {
    if (this.status !== 'waiting') {
        throw new Error('Cannot remove player from active tournament');
    }
    
    this.players = this.players.filter(p => p.user.toString() !== userId.toString());
    return this.save();
};

tournamentSchema.methods.startTournament = function() {
    if (this.status !== 'waiting') {
        throw new Error('Tournament cannot be started');
    }
    
    if (this.players.length < 2) {
        throw new Error('Need at least 2 players to start tournament');
    }
    
    this.status = 'active';
    this.startedAt = new Date();
    this.generateBracket();
    return this.save();
};

tournamentSchema.methods.generateBracket = function() {
    this.bracket = [];
    this.currentRound = 0;
    
    const players = [...this.players];
    const numRounds = Math.ceil(Math.log2(players.length));
    
    // Shuffle players for random seeding
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    
    // Generate first round matches
    let matchId = 0;
    for (let i = 0; i < players.length; i += 2) {
        this.bracket.push({
            round: 0,
            match: matchId++,
            player1: players[i].user,
            player2: players[i + 1] ? players[i + 1].user : null,
            status: 'pending'
        });
    }
    
    // Generate subsequent rounds
    for (let round = 1; round < numRounds; round++) {
        const matchesInRound = Math.pow(2, numRounds - round - 1);
        for (let match = 0; match < matchesInRound; match++) {
            this.bracket.push({
                round: round,
                match: match,
                player1: null,
                player2: null,
                status: 'pending'
            });
        }
    }
};

tournamentSchema.methods.getCurrentMatches = function() {
    return this.bracket.filter(match => 
        match.round === this.currentRound && match.status === 'pending'
    );
};

tournamentSchema.methods.completeMatch = function(matchId, winnerId) {
    const match = this.bracket.find(m => 
        m.round === this.currentRound && m.match === matchId
    );
    
    if (!match) {
        throw new Error('Match not found');
    }
    
    if (match.status !== 'pending') {
        throw new Error('Match already completed');
    }
    
    match.winner = winnerId;
    match.status = 'completed';
    match.completedAt = new Date();
    
    // Advance winner to next round
    const nextRound = match.round + 1;
    const nextMatch = Math.floor(match.match / 2);
    const nextMatchIndex = this.bracket.findIndex(m => 
        m.round === nextRound && m.match === nextMatch
    );
    
    if (nextMatchIndex !== -1) {
        const nextMatchObj = this.bracket[nextMatchIndex];
        if (match.match % 2 === 0) {
            nextMatchObj.player1 = winnerId;
        } else {
            nextMatchObj.player2 = winnerId;
        }
        
        if (nextMatchObj.player1 && nextMatchObj.player2) {
            nextMatchObj.status = 'pending';
        }
    }
    
    // Check if round is complete
    const currentRoundMatches = this.bracket.filter(m => m.round === this.currentRound);
    const completedMatches = currentRoundMatches.filter(m => m.status === 'completed');
    
    if (completedMatches.length === currentRoundMatches.length) {
        this.currentRound++;
        
        // Check if tournament is complete
        const finalRound = this.bracket.filter(m => m.round === this.currentRound);
        if (finalRound.length === 1 && finalRound[0].status === 'completed') {
            this.completeTournament();
        }
    }
    
    return this.save();
};

tournamentSchema.methods.completeTournament = function() {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Find winner and distribute prizes
    const finalMatch = this.bracket.find(m => m.status === 'completed' && !m.player1 && !m.player2);
    if (finalMatch) {
        const winner = this.players.find(p => p.user.toString() === finalMatch.winner.toString());
        if (winner) {
            winner.position = 1;
            winner.prize = this.prizePool * 0.6; // 60% to winner
            
            // Distribute remaining prizes to other players
            const otherPlayers = this.players.filter(p => p.user.toString() !== finalMatch.winner.toString());
            const remainingPrize = this.prizePool * 0.4;
            const prizePerPlayer = remainingPrize / otherPlayers.length;
            
            otherPlayers.forEach((player, index) => {
                player.position = index + 2;
                player.prize = prizePerPlayer;
            });
        }
    }
    
    return this.save();
};

tournamentSchema.methods.getPrizeDistribution = function() {
    return this.players
        .filter(p => p.position)
        .sort((a, b) => a.position - b.position)
        .map(p => ({
            position: p.position,
            prize: p.prize,
            user: p.user
        }));
};

// Static methods
tournamentSchema.statics.getActiveTournaments = function() {
    return this.find({ status: { $in: ['waiting', 'active'] } })
        .populate('creator', 'name avatar')
        .populate('players.user', 'name avatar stats')
        .sort({ createdAt: -1 });
};

tournamentSchema.statics.getTournamentsByUser = function(userId) {
    return this.find({ 'players.user': userId })
        .populate('creator', 'name avatar')
        .populate('players.user', 'name avatar stats')
        .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Tournament', tournamentSchema);

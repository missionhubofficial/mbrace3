const Tournament = require('../models/Tournament');
const User = require('../models/User');

class TournamentService {
    constructor(io) {
        this.io = io;
        this.activeTournaments = new Map();
        this.playerTournaments = new Map();
    }

    async createTournament(socket, data) {
        try {
            if (!socket.userId) {
                throw new Error('Authentication required');
            }

            const tournament = new Tournament({
                name: data.name,
                maxPlayers: data.maxPlayers || 8,
                entryFee: data.entryFee || 0,
                prizePool: (data.maxPlayers || 8) * (data.entryFee || 0),
                creator: socket.userId,
                type: data.type || 'single_elimination',
                settings: data.settings || {}
            });

            await tournament.save();
            
            // Add creator as first player
            await tournament.addPlayer(socket.userId);
            
            this.activeTournaments.set(tournament._id.toString(), tournament);
            this.playerTournaments.set(socket.id, tournament._id.toString());
            
            socket.emit('tournamentCreated', tournament);
            this.broadcastTournamentList();
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    async joinTournament(socket, tournamentId) {
        try {
            if (!socket.userId) {
                throw new Error('Authentication required');
            }

            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                throw new Error('Tournament not found');
            }

            if (tournament.status !== 'waiting') {
                throw new Error('Tournament is not accepting new players');
            }

            // Check if user has enough coins
            const user = await User.findById(socket.userId);
            if (user.stats.coins < tournament.entryFee) {
                throw new Error('Insufficient coins');
            }

            // Deduct entry fee
            user.stats.coins -= tournament.entryFee;
            await user.save();

            // Add player to tournament
            await tournament.addPlayer(socket.userId);
            
            this.activeTournaments.set(tournament._id.toString(), tournament);
            this.playerTournaments.set(socket.id, tournament._id.toString());
            
            socket.emit('tournamentJoined', tournament);
            this.broadcastTournamentUpdate(tournament);
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    async leaveTournament(socket) {
        try {
            if (!socket.userId) {
                throw new Error('Authentication required');
            }

            const tournamentId = this.playerTournaments.get(socket.id);
            if (!tournamentId) {
                throw new Error('Not in any tournament');
            }

            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                throw new Error('Tournament not found');
            }

            if (tournament.status !== 'waiting') {
                throw new Error('Cannot leave active tournament');
            }

            // Refund entry fee
            const user = await User.findById(socket.userId);
            user.stats.coins += tournament.entryFee;
            await user.save();

            // Remove player from tournament
            await tournament.removePlayer(socket.userId);
            
            this.playerTournaments.delete(socket.id);
            
            // If no players left, delete tournament
            if (tournament.players.length === 0) {
                await Tournament.findByIdAndDelete(tournamentId);
                this.activeTournaments.delete(tournamentId);
            } else {
                this.activeTournaments.set(tournamentId, tournament);
                this.broadcastTournamentUpdate(tournament);
            }
            
            socket.emit('tournamentLeft');
            this.broadcastTournamentList();
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    async getTournaments(socket) {
        try {
            const tournaments = await Tournament.getActiveTournaments();
            socket.emit('tournamentList', tournaments);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    async startTournament(tournamentId) {
        try {
            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                throw new Error('Tournament not found');
            }

            if (tournament.status !== 'waiting') {
                throw new Error('Tournament cannot be started');
            }

            if (tournament.players.length < 2) {
                throw new Error('Need at least 2 players to start tournament');
            }

            await tournament.startTournament();
            this.activeTournaments.set(tournamentId, tournament);
            
            // Notify all players
            this.broadcastTournamentUpdate(tournament);
            
            // Start first round matches
            await this.startNextRound(tournament);
            
        } catch (error) {
            console.error('Error starting tournament:', error);
        }
    }

    async startNextRound(tournament) {
        const currentMatches = tournament.getCurrentMatches();
        
        for (const match of currentMatches) {
            if (match.player1 && match.player2) {
                // Start match
                match.status = 'active';
                match.gameId = this.generateGameId();
                
                // Notify players about match start
                this.io.emit('matchStart', {
                    tournamentId: tournament._id,
                    matchId: match._id,
                    player1: match.player1,
                    player2: match.player2,
                    gameId: match.gameId
                });
            }
        }
        
        await tournament.save();
    }

    async completeMatch(tournamentId, matchId, winnerId) {
        try {
            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                throw new Error('Tournament not found');
            }

            await tournament.completeMatch(matchId, winnerId);
            this.activeTournaments.set(tournamentId, tournament);
            
            // Broadcast tournament update
            this.broadcastTournamentUpdate(tournament);
            
            // Check if tournament is complete
            if (tournament.status === 'completed') {
                await this.distributePrizes(tournament);
            } else {
                // Start next round
                await this.startNextRound(tournament);
            }
            
        } catch (error) {
            console.error('Error completing match:', error);
        }
    }

    async distributePrizes(tournament) {
        try {
            const prizeDistribution = tournament.getPrizeDistribution();
            
            for (const prize of prizeDistribution) {
                const user = await User.findById(prize.user);
                if (user) {
                    user.stats.coins += prize.prize;
                    if (prize.position === 1) {
                        user.stats.tournamentsWon += 1;
                    }
                    await user.save();
                }
            }
            
            // Notify all players about tournament completion
            this.io.emit('tournamentCompleted', {
                tournamentId: tournament._id,
                results: prizeDistribution
            });
            
        } catch (error) {
            console.error('Error distributing prizes:', error);
        }
    }

    broadcastTournamentUpdate(tournament) {
        this.io.emit('tournamentUpdate', tournament);
    }

    broadcastTournamentList() {
        Tournament.getActiveTournaments().then(tournaments => {
            this.io.emit('tournamentList', tournaments);
        }).catch(error => {
            console.error('Error broadcasting tournament list:', error);
        });
    }

    handleDisconnect(socket) {
        const tournamentId = this.playerTournaments.get(socket.id);
        if (tournamentId) {
            this.playerTournaments.delete(socket.id);
            // Note: In production, you might want to handle disconnection differently
            // For now, we'll just remove the player from our tracking
        }
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Cleanup old tournaments
    async cleanupOldTournaments() {
        try {
            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            await Tournament.deleteMany({
                status: 'completed',
                completedAt: { $lt: cutoffDate }
            });
        } catch (error) {
            console.error('Error cleaning up old tournaments:', error);
        }
    }
}

module.exports = TournamentService;

const express = require('express');
const { body, validationResult } = require('express-validator');
const Tournament = require('../models/Tournament');
const AuthService = require('../services/AuthService');

const router = express.Router();
const authService = new AuthService();

// Get all tournaments
router.get('/', authService.optionalAuth, async (req, res) => {
    try {
        const tournaments = await Tournament.getActiveTournaments();
        res.json({ tournaments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tournament by ID
router.get('/:id', authService.optionalAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('creator', 'name avatar')
            .populate('players.user', 'name avatar stats')
            .populate('bracket.player1', 'name avatar')
            .populate('bracket.player2', 'name avatar')
            .populate('bracket.winner', 'name avatar');

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.json({ tournament });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create tournament
router.post('/', authService.authenticateToken, [
    body('name').trim().isLength({ min: 3, max: 50 }),
    body('maxPlayers').isInt({ min: 2, max: 32 }),
    body('entryFee').isInt({ min: 0 }),
    body('type').optional().isIn(['single_elimination', 'double_elimination', 'round_robin'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { name, maxPlayers, entryFee, type, settings } = req.body;
        
        const tournament = new Tournament({
            name,
            maxPlayers,
            entryFee,
            prizePool: maxPlayers * entryFee,
            creator: req.user.userId,
            type: type || 'single_elimination',
            settings: settings || {}
        });

        await tournament.save();
        
        // Add creator as first player
        await tournament.addPlayer(req.user.userId);
        
        const populatedTournament = await Tournament.findById(tournament._id)
            .populate('creator', 'name avatar')
            .populate('players.user', 'name avatar stats');

        res.status(201).json({ tournament: populatedTournament });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Join tournament
router.post('/:id/join', authService.authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'waiting') {
            return res.status(400).json({ error: 'Tournament is not accepting new players' });
        }

        // Check if user has enough coins
        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        if (user.stats.coins < tournament.entryFee) {
            return res.status(400).json({ error: 'Insufficient coins' });
        }

        // Deduct entry fee
        user.stats.coins -= tournament.entryFee;
        await user.save();

        // Add player to tournament
        await tournament.addPlayer(req.user.userId);
        
        const populatedTournament = await Tournament.findById(tournament._id)
            .populate('creator', 'name avatar')
            .populate('players.user', 'name avatar stats');

        res.json({ tournament: populatedTournament });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Leave tournament
router.post('/:id/leave', authService.authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'waiting') {
            return res.status(400).json({ error: 'Cannot leave active tournament' });
        }

        // Refund entry fee
        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        user.stats.coins += tournament.entryFee;
        await user.save();

        // Remove player from tournament
        await tournament.removePlayer(req.user.userId);
        
        // If no players left, delete tournament
        if (tournament.players.length === 0) {
            await Tournament.findByIdAndDelete(tournament._id);
            return res.json({ message: 'Tournament deleted' });
        }

        const populatedTournament = await Tournament.findById(tournament._id)
            .populate('creator', 'name avatar')
            .populate('players.user', 'name avatar stats');

        res.json({ tournament: populatedTournament });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start tournament (creator only)
router.post('/:id/start', authService.authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.creator.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only tournament creator can start the tournament' });
        }

        if (tournament.status !== 'waiting') {
            return res.status(400).json({ error: 'Tournament cannot be started' });
        }

        if (tournament.players.length < 2) {
            return res.status(400).json({ error: 'Need at least 2 players to start tournament' });
        }

        await tournament.startTournament();
        
        const populatedTournament = await Tournament.findById(tournament._id)
            .populate('creator', 'name avatar')
            .populate('players.user', 'name avatar stats')
            .populate('bracket.player1', 'name avatar')
            .populate('bracket.player2', 'name avatar');

        res.json({ tournament: populatedTournament });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Complete match
router.post('/:id/matches/:matchId/complete', authService.authenticateToken, [
    body('winnerId').isMongoId()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { id: tournamentId, matchId } = req.params;
        const { winnerId } = req.body;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'active') {
            return res.status(400).json({ error: 'Tournament is not active' });
        }

        await tournament.completeMatch(matchId, winnerId);
        
        const populatedTournament = await Tournament.findById(tournament._id)
            .populate('creator', 'name avatar')
            .populate('players.user', 'name avatar stats')
            .populate('bracket.player1', 'name avatar')
            .populate('bracket.player2', 'name avatar')
            .populate('bracket.winner', 'name avatar');

        res.json({ tournament: populatedTournament });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get tournament bracket
router.get('/:id/bracket', authService.optionalAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('bracket.player1', 'name avatar')
            .populate('bracket.player2', 'name avatar')
            .populate('bracket.winner', 'name avatar');

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.json({ bracket: tournament.bracket });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tournament results
router.get('/:id/results', authService.optionalAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'completed') {
            return res.status(400).json({ error: 'Tournament not completed yet' });
        }

        const results = tournament.getPrizeDistribution();
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's tournaments
router.get('/user/:userId', authService.optionalAuth, async (req, res) => {
    try {
        const tournaments = await Tournament.getTournamentsByUser(req.params.userId);
        res.json({ tournaments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

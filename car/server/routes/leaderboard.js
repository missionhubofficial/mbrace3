const express = require('express');
const LeaderboardService = require('../services/LeaderboardService');
const AuthService = require('../services/AuthService');

const router = express.Router();
const leaderboardService = new LeaderboardService();
const authService = new AuthService();

// Get leaderboard
router.get('/:type?', authService.optionalAuth, async (req, res) => {
    try {
        const { type = 'global' } = req.params;
        const { limit = 100 } = req.query;
        
        let leaderboard;
        
        switch (type) {
            case 'global':
                leaderboard = await leaderboardService.getGlobalLeaderboard(parseInt(limit));
                break;
            case 'wins':
                leaderboard = await leaderboardService.getWinsLeaderboard(parseInt(limit));
                break;
            case 'coins':
                leaderboard = await leaderboardService.getCoinsLeaderboard(parseInt(limit));
                break;
            case 'level':
                leaderboard = await leaderboardService.getLevelLeaderboard(parseInt(limit));
                break;
            case 'friends':
                if (!req.user) {
                    return res.status(401).json({ error: 'Authentication required for friends leaderboard' });
                }
                leaderboard = await leaderboardService.getFriendsLeaderboard(req.user.userId, parseInt(limit));
                break;
            default:
                return res.status(400).json({ error: 'Invalid leaderboard type' });
        }

        res.json({ leaderboard, type, limit: parseInt(limit) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's rank
router.get('/rank/:type', authService.authenticateToken, async (req, res) => {
    try {
        const { type } = req.params;
        const rank = await leaderboardService.getUserRank(req.user.userId, type);
        
        if (rank === null) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ rank, type });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get leaderboard stats
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await leaderboardService.getLeaderboardStats();
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

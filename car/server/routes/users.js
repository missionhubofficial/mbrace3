const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuthService = require('../services/AuthService');

const router = express.Router();
const authService = new AuthService();

// Get user profile
router.get('/:id', authService.optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name avatar stats level achievements createdAt')
            .populate('friends', 'name avatar stats level');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: user.toPublicJSON() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user stats
router.get('/:id/stats', authService.optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('stats level achievements');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            stats: user.stats,
            level: user.stats.level,
            achievements: user.achievements
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user preferences
router.put('/preferences', authService.authenticateToken, [
    body('sound').optional().isObject(),
    body('graphics').optional().isObject(),
    body('controls').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update preferences
        if (req.body.sound) {
            user.preferences.sound = { ...user.preferences.sound, ...req.body.sound };
        }
        if (req.body.graphics) {
            user.preferences.graphics = { ...user.preferences.graphics, ...req.body.graphics };
        }
        if (req.body.controls) {
            user.preferences.controls = { ...user.preferences.controls, ...req.body.controls };
        }

        await user.save();

        res.json({ 
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user achievements
router.get('/:id/achievements', authService.optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('achievements');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ achievements: user.achievements });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add achievement (admin only)
router.post('/:id/achievements', authService.authenticateToken, [
    body('id').notEmpty(),
    body('name').notEmpty(),
    body('description').notEmpty(),
    body('icon').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        // Check if user is admin (simplified check)
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const achievement = {
            id: req.body.id,
            name: req.body.name,
            description: req.body.description,
            icon: req.body.icon || null
        };

        await user.addAchievement(achievement);

        res.json({ 
            message: 'Achievement added successfully',
            achievement
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search users
router.get('/search/:query', authService.optionalAuth, async (req, res) => {
    try {
        const { query } = req.params;
        const { limit = 20 } = req.query;

        const users = await User.find({
            $and: [
                { isActive: true },
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        })
        .select('name avatar stats level')
        .limit(parseInt(limit));

        res.json({ users: users.map(user => user.toPublicJSON()) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get top players
router.get('/top/:type', authService.optionalAuth, async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 10 } = req.query;

        let users;
        
        switch (type) {
            case 'wins':
                users = await User.getTopPlayers(parseInt(limit));
                break;
            case 'level':
                users = await User.find({ isActive: true })
                    .select('name avatar stats level')
                    .sort({ 'stats.level': -1, 'stats.experience': -1 })
                    .limit(parseInt(limit));
                break;
            case 'coins':
                users = await User.find({ isActive: true })
                    .select('name avatar stats')
                    .sort({ 'stats.coins': -1 })
                    .limit(parseInt(limit));
                break;
            default:
                return res.status(400).json({ error: 'Invalid type' });
        }

        res.json({ users: users.map(user => user.toPublicJSON()) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's game history
router.get('/:id/games', authService.optionalAuth, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        // This would require a Game model with user references
        // For now, return empty array
        res.json({ games: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's tournament history
router.get('/:id/tournaments', authService.optionalAuth, async (req, res) => {
    try {
        const Tournament = require('../models/Tournament');
        const tournaments = await Tournament.getTournamentsByUser(req.params.id);
        
        res.json({ tournaments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

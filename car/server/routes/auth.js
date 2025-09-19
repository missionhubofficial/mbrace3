const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');

const router = express.Router();
const authService = new AuthService();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2, max: 50 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { email, password, name } = req.body;
        const result = await authService.register({ email, password, name });
        
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { email, password } = req.body;
        const result = await authService.login(email, password);
        
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Google Login
router.post('/google', [
    body('id').notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 50 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { id, email, name, picture } = req.body;
        const result = await authService.googleLogin({ id, email, name, picture });
        
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Guest Login
router.post('/guest', async (req, res) => {
    try {
        const result = await authService.guestLogin();
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        const result = await authService.refreshToken(token);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Get User Profile
router.get('/profile', authService.authenticateToken, async (req, res) => {
    try {
        const user = await authService.getUserById(req.user.userId);
        res.json({ user });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Update User Profile
router.put('/profile', authService.authenticateToken, [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('avatar').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const user = await authService.updateUser(req.user.userId, req.body);
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Change Password
router.put('/password', authService.authenticateToken, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user.userId, currentPassword, newPassword);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add Friend
router.post('/friends', authService.authenticateToken, [
    body('friendId').isMongoId()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { friendId } = req.body;
        await authService.addFriend(req.user.userId, friendId);
        res.json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Remove Friend
router.delete('/friends/:friendId', authService.authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.params;
        await authService.removeFriend(req.user.userId, friendId);
        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get Friends
router.get('/friends', authService.authenticateToken, async (req, res) => {
    try {
        const friends = await authService.getFriends(req.user.userId);
        res.json({ friends });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete Account
router.delete('/account', authService.authenticateToken, async (req, res) => {
    try {
        await authService.deleteUser(req.user.userId);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

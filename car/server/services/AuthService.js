const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.jwtExpiry = process.env.JWT_EXPIRY || '7d';
    }

    async register(userData) {
        try {
            const { email, password, name } = userData;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            // Create new user
            const user = new User({
                email,
                password,
                name,
                provider: 'local'
            });

            await user.save();

            // Generate token
            const token = this.generateToken(user);

            return {
                user: user.toPublicJSON(),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    async login(email, password) {
        try {
            // Find user by email
            const user = await User.findByEmail(email);
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = this.generateToken(user);

            return {
                user: user.toPublicJSON(),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    async googleLogin(googleData) {
        try {
            const { id, email, name, picture } = googleData;

            // Check if user exists
            let user = await User.findByProvider('google', id);
            
            if (!user) {
                // Check if user exists with this email
                user = await User.findByEmail(email);
                
                if (user) {
                    // Link Google account to existing user
                    user.provider = 'google';
                    user.providerId = id;
                    user.avatar = picture;
                    await user.save();
                } else {
                    // Create new user
                    user = new User({
                        email,
                        name,
                        avatar: picture,
                        provider: 'google',
                        providerId: id
                    });
                    await user.save();
                }
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = this.generateToken(user);

            return {
                user: user.toPublicJSON(),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    async guestLogin() {
        try {
            // Create guest user
            const user = new User({
                name: `Guest_${Date.now()}`,
                provider: 'guest',
                isGuest: true
            });

            await user.save();

            // Generate token
            const token = this.generateToken(user);

            return {
                user: user.toPublicJSON(),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    generateToken(user) {
        const payload = {
            userId: user._id,
            email: user.email,
            name: user.name,
            isGuest: user.isGuest
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async refreshToken(token) {
        try {
            const decoded = this.verifyToken(token);
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Generate new token
            const newToken = this.generateToken(user);

            return {
                user: user.toPublicJSON(),
                token: newToken
            };
        } catch (error) {
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return user.toPublicJSON();
        } catch (error) {
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Update allowed fields
            const allowedFields = ['name', 'avatar', 'preferences'];
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    user[field] = updateData[field];
                }
            }

            await user.save();
            return user.toPublicJSON();
        } catch (error) {
            throw error;
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.provider !== 'local') {
                throw new Error('Cannot change password for social login users');
            }

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            await user.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Soft delete - mark as inactive
            user.isActive = false;
            await user.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    async addFriend(userId, friendId) {
        try {
            const user = await User.findById(userId);
            const friend = await User.findById(friendId);
            
            if (!user || !friend) {
                throw new Error('User or friend not found');
            }

            if (user.friends.includes(friendId)) {
                throw new Error('User is already a friend');
            }

            user.friends.push(friendId);
            await user.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    async removeFriend(userId, friendId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.friends = user.friends.filter(id => id.toString() !== friendId.toString());
            await user.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    async getFriends(userId) {
        try {
            const user = await User.findById(userId).populate('friends', 'name avatar stats level');
            if (!user) {
                throw new Error('User not found');
            }

            return user.friends.map(friend => friend.toPublicJSON());
        } catch (error) {
            throw error;
        }
    }

    // Middleware for protected routes
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        try {
            const decoded = this.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(403).json({ error: 'Invalid token' });
        }
    }

    // Optional authentication middleware
    optionalAuth(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = this.verifyToken(token);
                req.user = decoded;
            } catch (error) {
                // Token is invalid, but we continue without user
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();
    }
}

module.exports = AuthService;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function() {
            return !this.isGuest;
        },
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.isGuest && this.provider === 'local';
        },
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'guest'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    preferences: {
        sound: {
            enabled: { type: Boolean, default: true },
            volume: { type: Number, default: 50, min: 0, max: 100 }
        },
        graphics: {
            quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
        },
        controls: {
            invert: { type: Boolean, default: false },
            sensitivity: { type: Number, default: 1, min: 0.1, max: 2 }
        }
    },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }, // in milliseconds
        bestLapTime: { type: Number, default: null },
        totalDistance: { type: Number, default: 0 }, // in meters
        tournamentsWon: { type: Number, default: 0 },
        coins: { type: Number, default: 1000 }, // in-game currency
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 }
    },
    achievements: [{
        id: String,
        name: String,
        description: String,
        unlockedAt: { type: Date, default: Date.now },
        icon: String
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastLogin: {
        type: Date,
        default: Date.now
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
userSchema.index({ email: 1 });
userSchema.index({ providerId: 1 });
userSchema.index({ 'stats.level': -1 });
userSchema.index({ 'stats.coins': -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    this.updatedAt = Date.now();
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        name: this.name,
        avatar: this.avatar,
        stats: this.stats,
        level: this.stats.level,
        achievements: this.achievements,
        lastLogin: this.lastLogin
    };
};

userSchema.methods.updateStats = function(gameResult) {
    this.stats.gamesPlayed += 1;
    this.stats.totalTime += gameResult.duration || 0;
    this.stats.totalDistance += gameResult.distance || 0;
    
    if (gameResult.position === 1) {
        this.stats.wins += 1;
        this.stats.experience += 100;
    } else {
        this.stats.losses += 1;
        this.stats.experience += Math.max(10, 50 - (gameResult.position - 1) * 10);
    }
    
    if (gameResult.lapTime && (!this.stats.bestLapTime || gameResult.lapTime < this.stats.bestLapTime)) {
        this.stats.bestLapTime = gameResult.lapTime;
    }
    
    // Level up logic
    const requiredExp = this.stats.level * 1000;
    if (this.stats.experience >= requiredExp) {
        this.stats.level += 1;
        this.stats.coins += this.stats.level * 100; // Bonus coins for leveling up
    }
    
    this.lastLogin = new Date();
    return this.save();
};

userSchema.methods.addAchievement = function(achievement) {
    const exists = this.achievements.some(ach => ach.id === achievement.id);
    if (!exists) {
        this.achievements.push(achievement);
        return this.save();
    }
    return Promise.resolve(this);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByProvider = function(provider, providerId) {
    return this.findOne({ provider, providerId });
};

userSchema.statics.getLeaderboard = function(limit = 100) {
    return this.find({ isActive: true })
        .select('name avatar stats level achievements')
        .sort({ 'stats.level': -1, 'stats.experience': -1 })
        .limit(limit);
};

userSchema.statics.getTopPlayers = function(limit = 10) {
    return this.find({ isActive: true })
        .select('name avatar stats')
        .sort({ 'stats.wins': -1, 'stats.gamesPlayed': -1 })
        .limit(limit);
};

module.exports = mongoose.model('User', userSchema);

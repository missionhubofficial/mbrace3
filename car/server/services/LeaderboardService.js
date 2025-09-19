const User = require('../models/User');

class LeaderboardService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getLeaderboard(socket, data) {
        try {
            const { type = 'global', limit = 100 } = data;
            const cacheKey = `${type}_${limit}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    socket.emit('leaderboardUpdate', cached.data);
                    return;
                }
            }

            let leaderboard;
            
            switch (type) {
                case 'global':
                    leaderboard = await this.getGlobalLeaderboard(limit);
                    break;
                case 'wins':
                    leaderboard = await this.getWinsLeaderboard(limit);
                    break;
                case 'coins':
                    leaderboard = await this.getCoinsLeaderboard(limit);
                    break;
                case 'level':
                    leaderboard = await this.getLevelLeaderboard(limit);
                    break;
                case 'friends':
                    leaderboard = await this.getFriendsLeaderboard(socket.userId, limit);
                    break;
                default:
                    throw new Error('Invalid leaderboard type');
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: leaderboard,
                timestamp: Date.now()
            });

            socket.emit('leaderboardUpdate', leaderboard);
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    async getGlobalLeaderboard(limit = 100) {
        try {
            const users = await User.find({ isActive: true })
                .select('name avatar stats level achievements')
                .sort({ 'stats.level': -1, 'stats.experience': -1 })
                .limit(limit);

            return users.map((user, index) => ({
                rank: index + 1,
                name: user.name,
                avatar: user.avatar,
                level: user.stats.level,
                experience: user.stats.experience,
                gamesPlayed: user.stats.gamesPlayed,
                wins: user.stats.wins,
                coins: user.stats.coins,
                achievements: user.achievements.length
            }));
        } catch (error) {
            console.error('Error getting global leaderboard:', error);
            return [];
        }
    }

    async getWinsLeaderboard(limit = 100) {
        try {
            const users = await User.find({ isActive: true })
                .select('name avatar stats')
                .sort({ 'stats.wins': -1, 'stats.gamesPlayed': -1 })
                .limit(limit);

            return users.map((user, index) => ({
                rank: index + 1,
                name: user.name,
                avatar: user.avatar,
                wins: user.stats.wins,
                losses: user.stats.losses,
                winRate: user.stats.gamesPlayed > 0 ? 
                    (user.stats.wins / user.stats.gamesPlayed * 100).toFixed(1) : 0,
                gamesPlayed: user.stats.gamesPlayed
            }));
        } catch (error) {
            console.error('Error getting wins leaderboard:', error);
            return [];
        }
    }

    async getCoinsLeaderboard(limit = 100) {
        try {
            const users = await User.find({ isActive: true })
                .select('name avatar stats')
                .sort({ 'stats.coins': -1 })
                .limit(limit);

            return users.map((user, index) => ({
                rank: index + 1,
                name: user.name,
                avatar: user.avatar,
                coins: user.stats.coins,
                level: user.stats.level,
                tournamentsWon: user.stats.tournamentsWon
            }));
        } catch (error) {
            console.error('Error getting coins leaderboard:', error);
            return [];
        }
    }

    async getLevelLeaderboard(limit = 100) {
        try {
            const users = await User.find({ isActive: true })
                .select('name avatar stats')
                .sort({ 'stats.level': -1, 'stats.experience': -1 })
                .limit(limit);

            return users.map((user, index) => ({
                rank: index + 1,
                name: user.name,
                avatar: user.avatar,
                level: user.stats.level,
                experience: user.stats.experience,
                totalTime: user.stats.totalTime,
                bestLapTime: user.stats.bestLapTime
            }));
        } catch (error) {
            console.error('Error getting level leaderboard:', error);
            return [];
        }
    }

    async getFriendsLeaderboard(userId, limit = 100) {
        try {
            if (!userId) {
                return [];
            }

            const user = await User.findById(userId).populate('friends', 'name avatar stats level');
            if (!user || !user.friends) {
                return [];
            }

            const friends = user.friends
                .sort((a, b) => b.stats.level - a.stats.level || b.stats.experience - a.stats.experience)
                .slice(0, limit);

            return friends.map((friend, index) => ({
                rank: index + 1,
                name: friend.name,
                avatar: friend.avatar,
                level: friend.stats.level,
                experience: friend.stats.experience,
                gamesPlayed: friend.stats.gamesPlayed,
                wins: friend.stats.wins
            }));
        } catch (error) {
            console.error('Error getting friends leaderboard:', error);
            return [];
        }
    }

    async updateUserStats(userId, gameResult) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            await user.updateStats(gameResult);
            
            // Clear cache to force refresh
            this.clearCache();
            
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    async addAchievement(userId, achievement) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            await user.addAchievement(achievement);
            
            // Clear cache to force refresh
            this.clearCache();
            
        } catch (error) {
            console.error('Error adding achievement:', error);
        }
    }

    clearCache() {
        this.cache.clear();
    }

    // Get user's rank in a specific leaderboard
    async getUserRank(userId, type = 'global') {
        try {
            const user = await User.findById(userId);
            if (!user) return null;

            let count;
            switch (type) {
                case 'global':
                    count = await User.countDocuments({
                        isActive: true,
                        $or: [
                            { 'stats.level': { $gt: user.stats.level } },
                            { 
                                'stats.level': user.stats.level,
                                'stats.experience': { $gt: user.stats.experience }
                            }
                        ]
                    });
                    break;
                case 'wins':
                    count = await User.countDocuments({
                        isActive: true,
                        $or: [
                            { 'stats.wins': { $gt: user.stats.wins } },
                            { 
                                'stats.wins': user.stats.wins,
                                'stats.gamesPlayed': { $gt: user.stats.gamesPlayed }
                            }
                        ]
                    });
                    break;
                case 'coins':
                    count = await User.countDocuments({
                        isActive: true,
                        'stats.coins': { $gt: user.stats.coins }
                    });
                    break;
                default:
                    return null;
            }

            return count + 1;
        } catch (error) {
            console.error('Error getting user rank:', error);
            return null;
        }
    }

    // Get leaderboard stats
    async getLeaderboardStats() {
        try {
            const totalUsers = await User.countDocuments({ isActive: true });
            const totalGames = await User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: null, total: { $sum: '$stats.gamesPlayed' } } }
            ]);
            
            const totalCoins = await User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: null, total: { $sum: '$stats.coins' } } }
            ]);

            return {
                totalUsers,
                totalGames: totalGames[0]?.total || 0,
                totalCoins: totalCoins[0]?.total || 0
            };
        } catch (error) {
            console.error('Error getting leaderboard stats:', error);
            return {
                totalUsers: 0,
                totalGames: 0,
                totalCoins: 0
            };
        }
    }
}

module.exports = LeaderboardService;

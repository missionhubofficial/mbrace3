// Achievement definitions for MissionHub Car Game
export const ACHIEVEMENTS = {
    // Racing achievements
    FIRST_WIN: {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first race',
        icon: '🏆',
        condition: (stats) => stats.wins >= 1,
        reward: { coins: 100, experience: 50 }
    },
    
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a lap in under 30 seconds',
        icon: '⚡',
        condition: (stats) => stats.bestLapTime && stats.bestLapTime < 30000,
        reward: { coins: 200, experience: 100 }
    },
    
    PERFECT_LAP: {
        id: 'perfect_lap',
        name: 'Perfect Lap',
        description: 'Complete a race without hitting any walls',
        icon: '✨',
        condition: (stats) => stats.perfectLaps >= 1,
        reward: { coins: 150, experience: 75 }
    },
    
    // Multiplayer achievements
    TEAM_PLAYER: {
        id: 'team_player',
        name: 'Team Player',
        description: 'Play 10 multiplayer races',
        icon: '👥',
        condition: (stats) => stats.multiplayerRaces >= 10,
        reward: { coins: 300, experience: 150 }
    },
    
    CHAMPION: {
        id: 'champion',
        name: 'Champion',
        description: 'Win 10 multiplayer races',
        icon: '🥇',
        condition: (stats) => stats.multiplayerWins >= 10,
        reward: { coins: 500, experience: 250 }
    },
    
    // Tournament achievements
    TOURNAMENT_WINNER: {
        id: 'tournament_winner',
        name: 'Tournament Winner',
        description: 'Win your first tournament',
        icon: '🏅',
        condition: (stats) => stats.tournamentsWon >= 1,
        reward: { coins: 1000, experience: 500 }
    },
    
    GRAND_SLAM: {
        id: 'grand_slam',
        name: 'Grand Slam',
        description: 'Win 5 tournaments',
        icon: '👑',
        condition: (stats) => stats.tournamentsWon >= 5,
        reward: { coins: 2500, experience: 1000 }
    },
    
    // Level achievements
    RISING_STAR: {
        id: 'rising_star',
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: '⭐',
        condition: (stats) => stats.level >= 10,
        reward: { coins: 500, experience: 0 }
    },
    
    VETERAN: {
        id: 'veteran',
        name: 'Veteran',
        description: 'Reach level 25',
        icon: '🎖️',
        condition: (stats) => stats.level >= 25,
        reward: { coins: 1000, experience: 0 }
    },
    
    LEGEND: {
        id: 'legend',
        name: 'Legend',
        description: 'Reach level 50',
        icon: '🌟',
        condition: (stats) => stats.level >= 50,
        reward: { coins: 2500, experience: 0 }
    },
    
    // Distance achievements
    ROAD_WARRIOR: {
        id: 'road_warrior',
        name: 'Road Warrior',
        description: 'Drive 1000 kilometers total',
        icon: '🛣️',
        condition: (stats) => stats.totalDistance >= 1000000, // 1000km in meters
        reward: { coins: 750, experience: 300 }
    },
    
    MARATHON_DRIVER: {
        id: 'marathon_driver',
        name: 'Marathon Driver',
        description: 'Drive 5000 kilometers total',
        icon: '🏃',
        condition: (stats) => stats.totalDistance >= 5000000, // 5000km in meters
        reward: { coins: 1500, experience: 600 }
    },
    
    // Time achievements
    ENDURANCE_RACER: {
        id: 'endurance_racer',
        name: 'Endurance Racer',
        description: 'Race for 10 hours total',
        icon: '⏰',
        condition: (stats) => stats.totalTime >= 36000000, // 10 hours in milliseconds
        reward: { coins: 800, experience: 400 }
    },
    
    // Streak achievements
    WINNING_STREAK: {
        id: 'winning_streak',
        name: 'Winning Streak',
        description: 'Win 5 races in a row',
        icon: '🔥',
        condition: (stats) => stats.currentWinStreak >= 5,
        reward: { coins: 600, experience: 300 }
    },
    
    UNSTOPPABLE: {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Win 10 races in a row',
        icon: '💪',
        condition: (stats) => stats.currentWinStreak >= 10,
        reward: { coins: 1200, experience: 600 }
    },
    
    // Special achievements
    NIGHT_OWL: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Play a race between midnight and 6 AM',
        icon: '🦉',
        condition: (stats) => stats.nightRaces >= 1,
        reward: { coins: 200, experience: 100 }
    },
    
    EARLY_BIRD: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Play a race between 6 AM and 12 PM',
        icon: '🐦',
        condition: (stats) => stats.morningRaces >= 1,
        reward: { coins: 200, experience: 100 }
    },
    
    SOCIAL_BUTTERFLY: {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 10 friends',
        icon: '🦋',
        condition: (stats) => stats.friendsCount >= 10,
        reward: { coins: 400, experience: 200 }
    },
    
    COLLECTOR: {
        id: 'collector',
        name: 'Collector',
        description: 'Earn 10,000 coins total',
        icon: '💰',
        condition: (stats) => stats.totalCoinsEarned >= 10000,
        reward: { coins: 500, experience: 250 }
    },
    
    // Secret achievements
    SECRET_ACHIEVER: {
        id: 'secret_achiever',
        name: 'Secret Achiever',
        description: 'Find and unlock a secret achievement',
        icon: '🎭',
        condition: (stats) => stats.secretAchievements >= 1,
        reward: { coins: 1000, experience: 500 }
    },
    
    // Completion achievements
    COMPLETIONIST: {
        id: 'completionist',
        name: 'Completionist',
        description: 'Unlock all achievements',
        icon: '💎',
        condition: (stats) => stats.achievementsUnlocked >= Object.keys(ACHIEVEMENTS).length - 1, // -1 to exclude this one
        reward: { coins: 5000, experience: 2000 }
    }
};

// Helper function to check if an achievement should be unlocked
export function checkAchievements(userStats, currentAchievements = []) {
    const newAchievements = [];
    
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        // Skip if already unlocked
        if (currentAchievements.some(ach => ach.id === achievement.id)) {
            continue;
        }
        
        // Check if condition is met
        if (achievement.condition(userStats)) {
            newAchievements.push({
                ...achievement,
                unlockedAt: new Date()
            });
        }
    }
    
    return newAchievements;
}

// Helper function to get achievement progress
export function getAchievementProgress(achievementId, userStats) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;
    
    // This would need to be implemented based on specific achievement logic
    // For now, return a simple progress indicator
    return {
        id: achievementId,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        progress: 0, // Would calculate actual progress
        maxProgress: 1,
        isUnlocked: achievement.condition(userStats)
    };
}

// Helper function to get all achievements with progress
export function getAllAchievementsWithProgress(userStats, currentAchievements = []) {
    return Object.entries(ACHIEVEMENTS).map(([key, achievement]) => ({
        ...achievement,
        isUnlocked: currentAchievements.some(ach => ach.id === achievement.id),
        progress: getAchievementProgress(key, userStats)
    }));
}

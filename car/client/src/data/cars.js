// Car definitions for MissionHub Car Game
export const CARS = {
    BASIC: {
        id: 'basic',
        name: 'Basic Racer',
        description: 'A reliable starter car with balanced stats',
        rarity: 'common',
        unlockLevel: 1,
        price: 0,
        stats: {
            speed: 100,
            acceleration: 80,
            handling: 70,
            braking: 60,
            durability: 80
        },
        color: '#3498db',
        sprite: 'car_basic',
        unlockCondition: null
    },
    
    SPEEDSTER: {
        id: 'speedster',
        name: 'Speedster',
        description: 'Built for speed, sacrifices handling for raw power',
        rarity: 'uncommon',
        unlockLevel: 5,
        price: 500,
        stats: {
            speed: 150,
            acceleration: 120,
            handling: 40,
            braking: 50,
            durability: 60
        },
        color: '#e74c3c',
        sprite: 'car_speedster',
        unlockCondition: (stats) => stats.level >= 5
    },
    
    TANK: {
        id: 'tank',
        name: 'Heavy Tank',
        description: 'Slow but nearly indestructible',
        rarity: 'uncommon',
        unlockLevel: 8,
        price: 750,
        stats: {
            speed: 60,
            acceleration: 40,
            handling: 50,
            braking: 90,
            durability: 150
        },
        color: '#95a5a6',
        sprite: 'car_tank',
        unlockCondition: (stats) => stats.level >= 8
    },
    
    NIMBLE: {
        id: 'nimble',
        name: 'Nimble Racer',
        description: 'Excellent handling and acceleration',
        rarity: 'rare',
        unlockLevel: 12,
        price: 1200,
        stats: {
            speed: 110,
            acceleration: 140,
            handling: 130,
            braking: 80,
            durability: 70
        },
        color: '#27ae60',
        sprite: 'car_nimble',
        unlockCondition: (stats) => stats.level >= 12
    },
    
    LIGHTNING: {
        id: 'lightning',
        name: 'Lightning Bolt',
        description: 'Extreme speed with decent handling',
        rarity: 'rare',
        unlockLevel: 15,
        price: 2000,
        stats: {
            speed: 180,
            acceleration: 160,
            handling: 80,
            braking: 70,
            durability: 50
        },
        color: '#f39c12',
        sprite: 'car_lightning',
        unlockCondition: (stats) => stats.level >= 15
    },
    
    BALANCED: {
        id: 'balanced',
        name: 'Balanced Pro',
        description: 'Well-rounded performance in all areas',
        rarity: 'epic',
        unlockLevel: 20,
        price: 3000,
        stats: {
            speed: 130,
            acceleration: 110,
            handling: 120,
            braking: 100,
            durability: 100
        },
        color: '#9b59b6',
        sprite: 'car_balanced',
        unlockCondition: (stats) => stats.level >= 20
    },
    
    LEGENDARY: {
        id: 'legendary',
        name: 'Legendary Racer',
        description: 'The ultimate racing machine',
        rarity: 'legendary',
        unlockLevel: 30,
        price: 5000,
        stats: {
            speed: 200,
            acceleration: 180,
            handling: 150,
            braking: 120,
            durability: 120
        },
        color: '#e67e22',
        sprite: 'car_legendary',
        unlockCondition: (stats) => stats.level >= 30 && stats.tournamentsWon >= 5
    },
    
    MYSTERY: {
        id: 'mystery',
        name: 'Mystery Car',
        description: 'A mysterious car with unknown capabilities',
        rarity: 'mystery',
        unlockLevel: 25,
        price: 0,
        stats: {
            speed: Math.floor(Math.random() * 100) + 100,
            acceleration: Math.floor(Math.random() * 100) + 100,
            handling: Math.floor(Math.random() * 100) + 100,
            braking: Math.floor(Math.random() * 100) + 100,
            durability: Math.floor(Math.random() * 100) + 100
        },
        color: '#2c3e50',
        sprite: 'car_mystery',
        unlockCondition: (stats) => stats.level >= 25 && stats.achievementsUnlocked >= 10
    }
};

// Car rarity definitions
export const CAR_RARITY = {
    common: {
        name: 'Common',
        color: '#95a5a6',
        dropRate: 0.5,
        multiplier: 1.0
    },
    uncommon: {
        name: 'Uncommon',
        color: '#27ae60',
        dropRate: 0.3,
        multiplier: 1.2
    },
    rare: {
        name: 'Rare',
        color: '#3498db',
        dropRate: 0.15,
        multiplier: 1.5
    },
    epic: {
        name: 'Epic',
        color: '#9b59b6',
        dropRate: 0.04,
        multiplier: 2.0
    },
    legendary: {
        name: 'Legendary',
        color: '#e67e22',
        dropRate: 0.009,
        multiplier: 3.0
    },
    mystery: {
        name: 'Mystery',
        color: '#2c3e50',
        dropRate: 0.001,
        multiplier: 5.0
    }
};

// Helper function to get car by ID
export function getCarById(carId) {
    return CARS[carId] || CARS.BASIC;
}

// Helper function to get available cars for user
export function getAvailableCars(userStats) {
    return Object.values(CARS).filter(car => {
        if (!car.unlockCondition) return true;
        return car.unlockCondition(userStats);
    });
}

// Helper function to get locked cars for user
export function getLockedCars(userStats) {
    return Object.values(CARS).filter(car => {
        if (!car.unlockCondition) return false;
        return !car.unlockCondition(userStats);
    });
}

// Helper function to get cars by rarity
export function getCarsByRarity(rarity) {
    return Object.values(CARS).filter(car => car.rarity === rarity);
}

// Helper function to get random car
export function getRandomCar() {
    const cars = Object.values(CARS);
    return cars[Math.floor(Math.random() * cars.length)];
}

// Helper function to get car stats with multipliers
export function getCarStatsWithMultipliers(carId, userLevel = 1) {
    const car = getCarById(carId);
    const rarity = CAR_RARITY[car.rarity];
    const levelMultiplier = 1 + (userLevel - 1) * 0.05; // 5% increase per level
    
    return {
        speed: Math.round(car.stats.speed * rarity.multiplier * levelMultiplier),
        acceleration: Math.round(car.stats.acceleration * rarity.multiplier * levelMultiplier),
        handling: Math.round(car.stats.handling * rarity.multiplier * levelMultiplier),
        braking: Math.round(car.stats.braking * rarity.multiplier * levelMultiplier),
        durability: Math.round(car.stats.durability * rarity.multiplier * levelMultiplier)
    };
}

// Helper function to calculate car performance score
export function getCarPerformanceScore(carId, userLevel = 1) {
    const stats = getCarStatsWithMultipliers(carId, userLevel);
    return Math.round(
        (stats.speed * 0.3) +
        (stats.acceleration * 0.25) +
        (stats.handling * 0.25) +
        (stats.braking * 0.1) +
        (stats.durability * 0.1)
    );
}

// Helper function to get car recommendations based on track
export function getCarRecommendations(trackId, userStats) {
    const track = require('./tracks').getTrackById(trackId);
    const availableCars = getAvailableCars(userStats);
    
    // Score cars based on track characteristics
    const scoredCars = availableCars.map(car => {
        let score = 0;
        const stats = getCarStatsWithMultipliers(car.id, userStats.level);
        
        // Speed is important for long tracks
        if (track.length > 2000) {
            score += stats.speed * 0.4;
        } else {
            score += stats.speed * 0.2;
        }
        
        // Handling is important for difficult tracks
        if (track.difficulty === 'hard' || track.difficulty === 'expert') {
            score += stats.handling * 0.4;
        } else {
            score += stats.handling * 0.2;
        }
        
        // Acceleration is always important
        score += stats.acceleration * 0.3;
        
        // Braking is important for tracks with obstacles
        if (track.obstacles.length > 0) {
            score += stats.braking * 0.2;
        } else {
            score += stats.braking * 0.1;
        }
        
        return { car, score };
    });
    
    // Sort by score and return top 3
    return scoredCars
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.car);
}

// Helper function to check if user can afford car
export function canAffordCar(carId, userCoins) {
    const car = getCarById(carId);
    return userCoins >= car.price;
}

// Helper function to get car upgrade cost
export function getCarUpgradeCost(carId, currentLevel) {
    const car = getCarById(carId);
    const baseCost = car.price || 100;
    return Math.round(baseCost * Math.pow(1.5, currentLevel));
}

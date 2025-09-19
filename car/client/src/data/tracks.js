// Track definitions for MissionHub Car Game
export const TRACKS = {
    DEFAULT: {
        id: 'default',
        name: 'Speedway Circuit',
        description: 'A classic oval track perfect for beginners',
        difficulty: 'easy',
        laps: 3,
        length: 1000, // meters
        width: 200, // meters
        checkpoints: [
            { x: 0.5, y: 0.2, radius: 50 }, // Top
            { x: 0.8, y: 0.5, radius: 50 }, // Right
            { x: 0.5, y: 0.8, radius: 50 }, // Bottom
            { x: 0.2, y: 0.5, radius: 50 }  // Left
        ],
        obstacles: [],
        background: '#2c3e50',
        trackColor: '#8B4513',
        borderColor: '#000000',
        startPositions: [
            { x: 0.5, y: 0.7, rotation: 0 },
            { x: 0.45, y: 0.7, rotation: 0 },
            { x: 0.55, y: 0.7, rotation: 0 },
            { x: 0.4, y: 0.7, rotation: 0 },
            { x: 0.6, y: 0.7, rotation: 0 },
            { x: 0.35, y: 0.7, rotation: 0 },
            { x: 0.65, y: 0.7, rotation: 0 },
            { x: 0.3, y: 0.7, rotation: 0 }
        ]
    },
    
    MOUNTAIN_PASS: {
        id: 'mountain_pass',
        name: 'Mountain Pass',
        description: 'A challenging mountain road with sharp turns',
        difficulty: 'hard',
        laps: 3,
        length: 1500,
        width: 150,
        checkpoints: [
            { x: 0.1, y: 0.1, radius: 40 },
            { x: 0.3, y: 0.2, radius: 40 },
            { x: 0.6, y: 0.1, radius: 40 },
            { x: 0.8, y: 0.3, radius: 40 },
            { x: 0.9, y: 0.6, radius: 40 },
            { x: 0.7, y: 0.8, radius: 40 },
            { x: 0.4, y: 0.9, radius: 40 },
            { x: 0.2, y: 0.7, radius: 40 }
        ],
        obstacles: [
            { x: 0.5, y: 0.3, width: 20, height: 20, type: 'rock' },
            { x: 0.7, y: 0.6, width: 15, height: 15, type: 'tree' }
        ],
        background: '#2d5016',
        trackColor: '#8B7355',
        borderColor: '#4a4a4a',
        startPositions: [
            { x: 0.1, y: 0.1, rotation: 0.5 },
            { x: 0.08, y: 0.1, rotation: 0.5 },
            { x: 0.12, y: 0.1, rotation: 0.5 },
            { x: 0.06, y: 0.1, rotation: 0.5 },
            { x: 0.14, y: 0.1, rotation: 0.5 },
            { x: 0.04, y: 0.1, rotation: 0.5 },
            { x: 0.16, y: 0.1, rotation: 0.5 },
            { x: 0.02, y: 0.1, rotation: 0.5 }
        ]
    },
    
    CITY_STREETS: {
        id: 'city_streets',
        name: 'City Streets',
        description: 'Navigate through busy city traffic',
        difficulty: 'medium',
        laps: 2,
        length: 2000,
        width: 100,
        checkpoints: [
            { x: 0.2, y: 0.2, radius: 30 },
            { x: 0.5, y: 0.1, radius: 30 },
            { x: 0.8, y: 0.2, radius: 30 },
            { x: 0.9, y: 0.5, radius: 30 },
            { x: 0.8, y: 0.8, radius: 30 },
            { x: 0.5, y: 0.9, radius: 30 },
            { x: 0.2, y: 0.8, radius: 30 },
            { x: 0.1, y: 0.5, radius: 30 }
        ],
        obstacles: [
            { x: 0.3, y: 0.3, width: 25, height: 25, type: 'car' },
            { x: 0.6, y: 0.4, width: 25, height: 25, type: 'car' },
            { x: 0.4, y: 0.7, width: 25, height: 25, type: 'car' },
            { x: 0.7, y: 0.6, width: 25, height: 25, type: 'car' }
        ],
        background: '#34495e',
        trackColor: '#7f8c8d',
        borderColor: '#2c3e50',
        startPositions: [
            { x: 0.2, y: 0.2, rotation: 0.25 },
            { x: 0.18, y: 0.2, rotation: 0.25 },
            { x: 0.22, y: 0.2, rotation: 0.25 },
            { x: 0.16, y: 0.2, rotation: 0.25 },
            { x: 0.24, y: 0.2, rotation: 0.25 },
            { x: 0.14, y: 0.2, rotation: 0.25 },
            { x: 0.26, y: 0.2, rotation: 0.25 },
            { x: 0.12, y: 0.2, rotation: 0.25 }
        ]
    },
    
    DESERT_RALLY: {
        id: 'desert_rally',
        name: 'Desert Rally',
        description: 'High-speed desert racing with jumps',
        difficulty: 'hard',
        laps: 4,
        length: 3000,
        width: 300,
        checkpoints: [
            { x: 0.1, y: 0.1, radius: 60 },
            { x: 0.3, y: 0.05, radius: 60 },
            { x: 0.6, y: 0.1, radius: 60 },
            { x: 0.8, y: 0.2, radius: 60 },
            { x: 0.9, y: 0.5, radius: 60 },
            { x: 0.8, y: 0.8, radius: 60 },
            { x: 0.6, y: 0.9, radius: 60 },
            { x: 0.3, y: 0.95, radius: 60 },
            { x: 0.1, y: 0.8, radius: 60 },
            { x: 0.05, y: 0.5, radius: 60 }
        ],
        obstacles: [
            { x: 0.4, y: 0.3, width: 30, height: 30, type: 'cactus' },
            { x: 0.6, y: 0.7, width: 30, height: 30, type: 'cactus' },
            { x: 0.2, y: 0.6, width: 30, height: 30, type: 'cactus' }
        ],
        background: '#f39c12',
        trackColor: '#e67e22',
        borderColor: '#d35400',
        startPositions: [
            { x: 0.1, y: 0.1, rotation: 0.1 },
            { x: 0.08, y: 0.1, rotation: 0.1 },
            { x: 0.12, y: 0.1, rotation: 0.1 },
            { x: 0.06, y: 0.1, rotation: 0.1 },
            { x: 0.14, y: 0.1, rotation: 0.1 },
            { x: 0.04, y: 0.1, rotation: 0.1 },
            { x: 0.16, y: 0.1, rotation: 0.1 },
            { x: 0.02, y: 0.1, rotation: 0.1 }
        ]
    },
    
    ICE_TRACK: {
        id: 'ice_track',
        name: 'Ice Track',
        description: 'Slippery ice racing with reduced traction',
        difficulty: 'expert',
        laps: 2,
        length: 1200,
        width: 180,
        checkpoints: [
            { x: 0.2, y: 0.2, radius: 45 },
            { x: 0.5, y: 0.1, radius: 45 },
            { x: 0.8, y: 0.2, radius: 45 },
            { x: 0.9, y: 0.5, radius: 45 },
            { x: 0.8, y: 0.8, radius: 45 },
            { x: 0.5, y: 0.9, radius: 45 },
            { x: 0.2, y: 0.8, radius: 45 },
            { x: 0.1, y: 0.5, radius: 45 }
        ],
        obstacles: [
            { x: 0.4, y: 0.4, width: 20, height: 20, type: 'ice_patch' },
            { x: 0.6, y: 0.6, width: 20, height: 20, type: 'ice_patch' }
        ],
        background: '#85c1e9',
        trackColor: '#ffffff',
        borderColor: '#2980b9',
        startPositions: [
            { x: 0.2, y: 0.2, rotation: 0.25 },
            { x: 0.18, y: 0.2, rotation: 0.25 },
            { x: 0.22, y: 0.2, rotation: 0.25 },
            { x: 0.16, y: 0.2, rotation: 0.25 },
            { x: 0.24, y: 0.2, rotation: 0.25 },
            { x: 0.14, y: 0.2, rotation: 0.25 },
            { x: 0.26, y: 0.2, rotation: 0.25 },
            { x: 0.12, y: 0.2, rotation: 0.25 }
        ],
        physics: {
            friction: 0.3, // Reduced friction for ice
            drag: 0.8,
            bounce: 0.1
        }
    }
};

// Helper function to get track by ID
export function getTrackById(trackId) {
    return Object.values(TRACKS).find(track => track.id === trackId) || TRACKS.DEFAULT;
}

// Helper function to get tracks by difficulty
export function getTracksByDifficulty(difficulty) {
    return Object.values(TRACKS).filter(track => track.difficulty === difficulty);
}

// Helper function to get all track IDs
export function getAllTrackIds() {
    return Object.keys(TRACKS);
}

// Helper function to get random track
export function getRandomTrack() {
    const tracks = Object.values(TRACKS);
    return tracks[Math.floor(Math.random() * tracks.length)];
}

// Helper function to get track statistics
export function getTrackStats(trackId) {
    const track = getTrackById(trackId);
    if (!track) return null;
    
    return {
        id: track.id,
        name: track.name,
        difficulty: track.difficulty,
        laps: track.laps,
        length: track.length,
        checkpoints: track.checkpoints.length,
        obstacles: track.obstacles.length,
        estimatedTime: Math.round(track.length * track.laps / 1000 * 60), // Rough estimate in seconds
        maxPlayers: track.startPositions.length
    };
}

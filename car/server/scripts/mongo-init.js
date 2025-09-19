// MongoDB initialization script
db = db.getSiblingDB('missionhub');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'provider'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50
        },
        provider: {
          bsonType: 'string',
          enum: ['local', 'google', 'guest']
        }
      }
    }
  }
});

db.createCollection('tournaments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'maxPlayers', 'entryFee', 'creator'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 50
        },
        maxPlayers: {
          bsonType: 'int',
          minimum: 2,
          maximum: 32
        },
        entryFee: {
          bsonType: 'int',
          minimum: 0
        }
      }
    }
  }
});

db.createCollection('games', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['roomId', 'name', 'maxPlayers'],
      properties: {
        roomId: {
          bsonType: 'string'
        },
        name: {
          bsonType: 'string'
        },
        maxPlayers: {
          bsonType: 'int',
          minimum: 2,
          maximum: 8
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
db.users.createIndex({ providerId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ 'stats.level': -1 });
db.users.createIndex({ 'stats.coins': -1 });
db.users.createIndex({ createdAt: -1 });

db.tournaments.createIndex({ status: 1, createdAt: -1 });
db.tournaments.createIndex({ creator: 1 });
db.tournaments.createIndex({ 'players.user': 1 });
db.tournaments.createIndex({ entryFee: 1 });
db.tournaments.createIndex({ prizePool: -1 });

db.games.createIndex({ roomId: 1 }, { unique: true });
db.games.createIndex({ status: 1 });
db.games.createIndex({ createdAt: -1 });
db.games.createIndex({ 'players.userId': 1 });

// Insert sample data (optional)
db.users.insertOne({
  name: 'Admin User',
  email: 'admin@missionhub.com',
  provider: 'local',
  isActive: true,
  stats: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    totalTime: 0,
    bestLapTime: null,
    totalDistance: 0,
    tournamentsWon: 0,
    coins: 10000,
    level: 1,
    experience: 0
  },
  preferences: {
    sound: { enabled: true, volume: 50 },
    graphics: { quality: 'high' },
    controls: { invert: false, sensitivity: 1 }
  },
  achievements: [],
  friends: [],
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');

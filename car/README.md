# MissionHub Car Game 🏎️

A production-ready, cross-platform multiplayer racing game built with Phaser 3, Node.js, and Socket.IO. Features real-time multiplayer, tournament system, leaderboards, and mobile support.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- Redis 7.2+
- Docker & Docker Compose (optional)

### One-Command Setup
```bash
# Clone and start everything with Docker
git clone https://github.com/yourusername/missionhub-car-game.git
cd missionhub-car-game
docker-compose up -d
```

**That's it!** 🎉 The game will be available at:
- **Web Game**: http://localhost:3000
- **API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🎮 Features

### Core Gameplay
- **Realistic Car Physics**: Top-down 2D racing with acceleration, braking, and steering
- **AI Bots**: Adjustable difficulty AI opponents for single-player mode
- **Multiple Tracks**: Various racing environments with checkpoints
- **Lap System**: 3-lap races with lap time tracking

### Multiplayer
- **Real-time Racing**: 2-8 players per room with Socket.IO synchronization
- **Room System**: Create/join public or private racing rooms
- **Matchmaking**: Automatic player pairing and ready-check system
- **Collision Detection**: Server-validated collision system

### Tournament System
- **Bracket Tournaments**: Single/double elimination and round-robin formats
- **Entry Fees**: In-game currency system with prize pools
- **Automated Management**: Auto-pairing, result tracking, and prize distribution
- **Tournament History**: Complete tournament records and statistics

### Social Features
- **Leaderboards**: Global, friends, and category-specific rankings
- **User Profiles**: Stats, achievements, and progress tracking
- **Friend System**: Add friends and compare performance
- **Achievements**: Unlockable rewards and milestones

### Mobile Support
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Touch Controls**: Optimized mobile controls with virtual buttons
- **Android APK**: Build native Android app with Capacitor
- **Cross-Platform**: Same codebase for web and mobile

## 🛠️ Development Setup

### Manual Installation

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/missionhub-car-game.git
cd missionhub-car-game
```

2. **Install Dependencies**
```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Edit configuration
nano .env
```

4. **Start Development Servers**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/missionhub
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=7d

# Client
CLIENT_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🏗️ Project Structure

```
missionhub-car-game/
├── client/                 # Phaser 3 Frontend
│   ├── src/
│   │   ├── scenes/        # Game scenes (Menu, Game, Lobby, Tournament)
│   │   ├── managers/      # Auth, Socket, UI managers
│   │   └── styles/        # CSS styles
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js Backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── config/           # Database config
├── docker-compose.yml     # Docker services
├── .github/workflows/     # CI/CD pipeline
└── README.md
```

## 🎯 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/guest` - Guest login
- `GET /api/auth/profile` - Get user profile

### Game Endpoints
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `POST /api/tournaments/:id/join` - Join tournament
- `GET /api/leaderboard/:type` - Get leaderboard

### Socket.IO Events
- `createRoom` - Create multiplayer room
- `joinRoom` - Join multiplayer room
- `playerUpdate` - Send player position updates
- `raceComplete` - Submit race results

## 🚀 Deployment

### Docker Deployment (Recommended)

1. **Production Build**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Environment Setup**
```bash
# Set production environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb://your-mongo-host:27017/missionhub
export REDIS_URL=redis://your-redis-host:6379
```

### Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create missionhub-car-game

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Deploy
git push heroku main
```

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd client && vercel --prod
```

#### DigitalOcean/AWS (Full Stack)
```bash
# Use provided Docker Compose
docker-compose up -d

# Or use Kubernetes manifests
kubectl apply -f k8s/
```

### Android APK Build

1. **Setup Android Development**
```bash
# Install Android Studio and SDK
# Set ANDROID_HOME environment variable

# Install Capacitor
cd client
npm install -g @capacitor/cli
npx cap add android
```

2. **Build APK**
```bash
# Build web version
npm run build

# Build Android APK
npx cap build android

# APK will be in: android/app/build/outputs/apk/release/
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Client tests only
cd client && npm test

# Server tests only
cd server && npm test
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 📊 Performance

### Optimization Features
- **Object Pooling**: Efficient memory management for game objects
- **LOD System**: Level-of-detail rendering for better performance
- **Asset Compression**: Optimized images and sounds
- **Code Splitting**: Lazy loading of game modules
- **CDN Ready**: Static assets optimized for CDN delivery

### Performance Targets
- **60 FPS** on desktop
- **30 FPS** on mobile
- **< 3s** initial load time
- **< 100ms** network latency for multiplayer

## 🔒 Security

### Implemented Security Features
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API request throttling
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured cross-origin policies
- **Helmet.js**: Security headers
- **SQL Injection Prevention**: MongoDB parameterized queries

### Anti-Cheat Measures
- **Server Authority**: All game state validated server-side
- **Position Validation**: Client position updates verified
- **Time Validation**: Lap times and race completion validated
- **Rate Limiting**: Prevents spam and abuse

## 🎨 Customization

### Adding New Tracks
1. Create track data in `client/src/data/tracks.js`
2. Add track graphics to `client/public/assets/tracks/`
3. Update track selection in game scenes

### Adding New Cars
1. Add car sprites to `client/public/assets/cars/`
2. Define car properties in `client/src/data/cars.js`
3. Update car selection UI

### Modifying Game Physics
1. Edit physics constants in `client/src/scenes/GameScene.js`
2. Adjust car acceleration, braking, and turning values
3. Test with different difficulty levels

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commits

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Phaser 3** - Game framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Redis** - Caching and sessions
- **Docker** - Containerization

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/missionhub-car-game/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/missionhub-car-game/discussions)
- **Email**: support@missionhub.example.com

## 🗺️ Roadmap

### Version 2.0
- [ ] 3D graphics with Three.js
- [ ] VR support
- [ ] More car customization
- [ ] Weather effects
- [ ] Replay system

### Version 2.1
- [ ] Mobile app stores
- [ ] Push notifications
- [ ] Offline mode
- [ ] Cloud saves

---

**Made with ❤️ by the MissionHub Team**

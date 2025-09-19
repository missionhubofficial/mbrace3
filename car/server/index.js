const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/users');

// Import services
const GameService = require('./services/GameService');
const TournamentService = require('./services/TournamentService');
const LeaderboardService = require('./services/LeaderboardService');
const AuthService = require('./services/AuthService');

// Import database
const connectDB = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Initialize services
const gameService = new GameService(io);
const tournamentService = new TournamentService(io);
const leaderboardService = new LeaderboardService();
const authService = new AuthService();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Authentication middleware for socket
    socket.use((packet, next) => {
        const token = packet[1]?.token || socket.handshake.auth?.token;
        if (packet[0] === 'authenticate' || packet[0] === 'ping') {
            return next();
        }
        
        if (!token) {
            return next(new Error('Authentication required'));
        }
        
        try {
            const decoded = authService.verifyToken(token);
            socket.userId = decoded.userId;
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Game events
    socket.on('createRoom', (data) => gameService.createRoom(socket, data));
    socket.on('joinRoom', (roomId) => gameService.joinRoom(socket, roomId));
    socket.on('leaveRoom', () => gameService.leaveRoom(socket));
    socket.on('getRooms', () => gameService.getRooms(socket));
    socket.on('startGame', () => gameService.startGame(socket));
    socket.on('playerUpdate', (data) => gameService.updatePlayer(socket, data));
    socket.on('playerAction', (data) => gameService.handlePlayerAction(socket, data));
    socket.on('raceComplete', (data) => gameService.handleRaceComplete(socket, data));
    socket.on('collision', (data) => gameService.handleCollision(socket, data));

    // Tournament events
    socket.on('createTournament', (data) => tournamentService.createTournament(socket, data));
    socket.on('joinTournament', (tournamentId) => tournamentService.joinTournament(socket, tournamentId));
    socket.on('leaveTournament', () => tournamentService.leaveTournament(socket));
    socket.on('getTournaments', () => tournamentService.getTournaments(socket));

    // Leaderboard events
    socket.on('getLeaderboard', (data) => leaderboardService.getLeaderboard(socket, data));

    // Ping/pong for connection health
    socket.on('ping', (startTime) => {
        socket.emit('pong', startTime);
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
        gameService.handleDisconnect(socket);
        tournamentService.handleDisconnect(socket);
    });

    // Error handling
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = { app, server, io };

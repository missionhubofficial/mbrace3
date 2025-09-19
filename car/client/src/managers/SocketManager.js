export class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.eventHandlers = new Map();
    }

    connect(serverUrl = 'http://localhost:3001') {
        try {
            // Import socket.io-client dynamically
            import('socket.io-client').then(({ io }) => {
                this.socket = io(serverUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    forceNew: true
                });

                this.setupEventListeners();
            }).catch(error => {
                console.error('Failed to load socket.io-client:', error);
                this.handleConnectionError();
            });
        } catch (error) {
            console.error('Socket connection error:', error);
            this.handleConnectionError();
        }
    }

    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.emit('disconnected', reason);
            
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, don't reconnect
                return;
            }
            
            this.attemptReconnect();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.handleConnectionError();
        });

        // Game events
        this.socket.on('playerJoined', (data) => {
            this.emit('playerJoined', data);
        });

        this.socket.on('playerLeft', (data) => {
            this.emit('playerLeft', data);
        });

        this.socket.on('playerUpdate', (data) => {
            this.emit('playerUpdate', data);
        });

        this.socket.on('raceStart', (data) => {
            this.emit('raceStart', data);
        });

        this.socket.on('raceEnd', (data) => {
            this.emit('raceEnd', data);
        });

        // Room events
        this.socket.on('roomList', (data) => {
            this.emit('roomList', data);
        });

        this.socket.on('roomCreated', (data) => {
            this.emit('roomCreated', data);
        });

        this.socket.on('roomJoined', (data) => {
            this.emit('roomJoined', data);
        });

        this.socket.on('roomLeft', (data) => {
            this.emit('roomLeft', data);
        });

        // Tournament events
        this.socket.on('tournamentList', (data) => {
            this.emit('tournamentList', data);
        });

        this.socket.on('tournamentCreated', (data) => {
            this.emit('tournamentCreated', data);
        });

        this.socket.on('tournamentJoined', (data) => {
            this.emit('tournamentJoined', data);
        });

        this.socket.on('tournamentUpdate', (data) => {
            this.emit('tournamentUpdate', data);
        });

        this.socket.on('bracketUpdate', (data) => {
            this.emit('bracketUpdate', data);
        });

        // Leaderboard events
        this.socket.on('leaderboardUpdate', (data) => {
            this.emit('leaderboardUpdate', data);
        });

        // Error events
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('error', error);
        });
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            this.emit('reconnectFailed');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    handleConnectionError() {
        this.isConnected = false;
        this.emit('connectionError');
    }

    // Event system
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Socket communication methods
    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }

    // Room management
    createRoom(roomData) {
        this.emit('createRoom', roomData);
    }

    joinRoom(roomId) {
        this.emit('joinRoom', roomId);
    }

    leaveRoom() {
        this.emit('leaveRoom');
    }

    getRooms() {
        this.emit('getRooms');
    }

    startGame() {
        this.emit('startGame');
    }

    // Player updates
    sendPlayerUpdate(playerData) {
        this.emit('playerUpdate', playerData);
    }

    sendPlayerAction(action, data) {
        this.emit('playerAction', { action, data });
    }

    // Tournament management
    createTournament(tournamentData) {
        this.emit('createTournament', tournamentData);
    }

    joinTournament(tournamentId) {
        this.emit('joinTournament', tournamentId);
    }

    leaveTournament() {
        this.emit('leaveTournament');
    }

    getTournaments() {
        this.emit('getTournaments');
    }

    // Race management
    sendRaceComplete(results) {
        this.emit('raceComplete', results);
    }

    sendCollision(collisionData) {
        this.emit('collision', collisionData);
    }

    // Leaderboard
    getLeaderboard(type = 'global') {
        this.emit('getLeaderboard', { type });
    }

    // Utility methods
    isConnected() {
        return this.isConnected;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Ping/pong for connection health
    ping() {
        if (this.socket && this.isConnected) {
            const startTime = Date.now();
            this.socket.emit('ping', startTime);
            
            this.socket.once('pong', (startTime) => {
                const latency = Date.now() - startTime;
                this.emit('ping', latency);
            });
        }
    }

    // Get connection info
    getConnectionInfo() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            socketId: this.socket ? this.socket.id : null
        };
    }
}

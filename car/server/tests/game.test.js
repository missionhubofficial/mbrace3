const request = require('supertest');
const app = require('../index');

describe('Game API Tests', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Create test user and get auth token
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        
        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    });

    describe('Authentication', () => {
        test('should register new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });

        test('should login existing user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });

        test('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Tournament API', () => {
        test('should create tournament', async () => {
            const response = await request(app)
                .post('/api/tournaments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Tournament',
                    maxPlayers: 8,
                    entryFee: 100,
                    type: 'single_elimination'
                });

            expect(response.status).toBe(201);
            expect(response.body.tournament).toHaveProperty('name', 'Test Tournament');
        });

        test('should get tournaments list', async () => {
            const response = await request(app)
                .get('/api/tournaments');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('tournaments');
            expect(Array.isArray(response.body.tournaments)).toBe(true);
        });

        test('should join tournament', async () => {
            // First create a tournament
            const createResponse = await request(app)
                .post('/api/tournaments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Join Test Tournament',
                    maxPlayers: 8,
                    entryFee: 50
                });

            const tournamentId = createResponse.body.tournament._id;

            // Then join it
            const response = await request(app)
                .post(`/api/tournaments/${tournamentId}/join`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('Leaderboard API', () => {
        test('should get global leaderboard', async () => {
            const response = await request(app)
                .get('/api/leaderboard/global');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('leaderboard');
            expect(Array.isArray(response.body.leaderboard)).toBe(true);
        });

        test('should get wins leaderboard', async () => {
            const response = await request(app)
                .get('/api/leaderboard/wins');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('leaderboard');
        });

        test('should get user rank', async () => {
            const response = await request(app)
                .get('/api/leaderboard/rank/global')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('rank');
            expect(typeof response.body.rank).toBe('number');
        });
    });

    describe('User API', () => {
        test('should get user profile', async () => {
            const response = await request(app)
                .get(`/api/users/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty('name', 'Test User');
        });

        test('should update user preferences', async () => {
            const response = await request(app)
                .put('/api/users/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    sound: { enabled: false, volume: 30 },
                    graphics: { quality: 'high' }
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Preferences updated successfully');
        });

        test('should search users', async () => {
            const response = await request(app)
                .get('/api/users/search/test');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('users');
            expect(Array.isArray(response.body.users)).toBe(true);
        });
    });

    describe('Health Check', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });
    });
});

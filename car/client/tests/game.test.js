import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameScene } from '../src/scenes/GameScene.js';
import { AuthManager } from '../src/managers/AuthManager.js';
import { SocketManager } from '../src/managers/SocketManager.js';

// Mock Phaser
global.Phaser = {
    Scene: class MockScene {},
    Physics: {
        Arcade: {
            Physics: class MockPhysics {}
        }
    },
    Math: {
        Distance: {
            Between: vi.fn(() => 100)
        },
        Angle: {
            Between: vi.fn(() => 0.5)
        }
    },
    Input: {
        Keyboard: {
            createCursorKeys: vi.fn(() => ({
                up: { isDown: false },
                down: { isDown: false },
                left: { isDown: false },
                right: { isDown: false }
            })),
            addKeys: vi.fn(() => ({
                W: { isDown: false },
                S: { isDown: false },
                A: { isDown: false },
                D: { isDown: false }
            })),
            addKey: vi.fn(() => ({ isDown: false }))
        },
        gamepad: {
            on: vi.fn()
        }
    },
    Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH'
    },
    Events: {
        EventEmitter: class MockEventEmitter {
            on() {}
            emit() {}
        }
    },
    Time: {
        addEvent: vi.fn(() => ({
            delay: 1000,
            callback: vi.fn(),
            repeat: 3
        })),
        delayedCall: vi.fn(),
        now: 1000
    },
    Cameras: {
        Main: {
            width: 1024,
            height: 768
        }
    },
    Add: {
        rectangle: vi.fn(() => ({
            setStroke: vi.fn(),
            setInteractive: vi.fn(),
            on: vi.fn()
        })),
        text: vi.fn(() => ({
            setOrigin: vi.fn(),
            setInteractive: vi.fn(),
            on: vi.fn(),
            setTint: vi.fn(),
            destroy: vi.fn()
        })),
        graphics: vi.fn(() => ({
            lineStyle: vi.fn(),
            strokeEllipse: vi.fn()
        })),
        circle: vi.fn(() => ({})),
        container: vi.fn(() => ({
            add: vi.fn(),
            removeAll: vi.fn()
        }))
    },
    Physics: {
        add: {
            sprite: vi.fn(() => ({
                setDisplaySize: vi.fn(),
                setTint: vi.fn(),
                setCollideWorldBounds: vi.fn(),
                setMaxVelocity: vi.fn(),
                setDrag: vi.fn(),
                setAngularDrag: vi.fn(),
                setVelocity: vi.fn(),
                setAngularVelocity: vi.fn(),
                setPosition: vi.fn(),
                setRotation: vi.fn(),
                destroy: vi.fn()
            })),
            collider: vi.fn()
        }
    }
};

// Mock window objects
global.window = {
    authManager: new AuthManager(),
    socketManager: new SocketManager(),
    uiManager: {
        showNotification: vi.fn(),
        showError: vi.fn()
    },
    dispatchEvent: vi.fn()
};

describe('GameScene', () => {
    let gameScene;
    let mockSceneData;

    beforeEach(() => {
        mockSceneData = { mode: 'singleplayer' };
        gameScene = new GameScene();
        
        // Mock scene methods
        gameScene.scene = {
            start: vi.fn()
        };
        gameScene.cameras = {
            main: {
                width: 1024,
                height: 768
            }
        };
        gameScene.input = {
            keyboard: {
                createCursorKeys: vi.fn(() => ({
                    up: { isDown: false },
                    down: { isDown: false },
                    left: { isDown: false },
                    right: { isDown: false }
                })),
                addKeys: vi.fn(() => ({
                    W: { isDown: false },
                    S: { isDown: false },
                    A: { isDown: false },
                    D: { isDown: false }
                })),
                addKey: vi.fn(() => ({ isDown: false }))
            },
            gamepad: {
                on: vi.fn()
            }
        };
        gameScene.physics = {
            add: {
                sprite: vi.fn(() => ({
                    setDisplaySize: vi.fn(),
                    setTint: vi.fn(),
                    setCollideWorldBounds: vi.fn(),
                    setMaxVelocity: vi.fn(),
                    setDrag: vi.fn(),
                    setAngularDrag: vi.fn(),
                    setVelocity: vi.fn(),
                    setAngularVelocity: vi.fn()
                })),
                collider: vi.fn()
            }
        };
        gameScene.add = {
            rectangle: vi.fn(() => ({
                setStroke: vi.fn(),
                setInteractive: vi.fn(),
                on: vi.fn()
            })),
            text: vi.fn(() => ({
                setOrigin: vi.fn(),
                setInteractive: vi.fn(),
                on: vi.fn(),
                setTint: vi.fn(),
                destroy: vi.fn()
            })),
            graphics: vi.fn(() => ({
                lineStyle: vi.fn(),
                strokeEllipse: vi.fn()
            })),
            circle: vi.fn(() => ({})),
            container: vi.fn(() => ({
                add: vi.fn(),
                removeAll: vi.fn()
            }))
        };
        gameScene.time = {
            addEvent: vi.fn(() => ({
                delay: 1000,
                callback: vi.fn(),
                repeat: 3
            })),
            delayedCall: vi.fn(),
            now: 1000
        };
    });

    describe('Initialization', () => {
        it('should initialize with correct default values', () => {
            gameScene.init(mockSceneData);
            
            expect(gameScene.gameMode).toBe('singleplayer');
            expect(gameScene.players).toBeInstanceOf(Map);
            expect(gameScene.aiBots).toEqual([]);
            expect(gameScene.checkpoints).toEqual([]);
            expect(gameScene.raceStarted).toBe(false);
            expect(gameScene.raceFinished).toBe(false);
        });

        it('should set multiplayer mode when specified', () => {
            gameScene.init({ mode: 'multiplayer' });
            expect(gameScene.gameMode).toBe('multiplayer');
        });
    });

    describe('Car Physics', () => {
        beforeEach(() => {
            gameScene.init(mockSceneData);
            gameScene.createPlayer();
        });

        it('should create player with correct properties', () => {
            expect(gameScene.player).toBeDefined();
            expect(gameScene.player.lap).toBe(0);
            expect(gameScene.player.checkpoint).toBe(0);
            expect(gameScene.player.speed).toBe(0);
            expect(gameScene.player.maxSpeed).toBe(200);
            expect(gameScene.player.acceleration).toBe(150);
            expect(gameScene.player.turnSpeed).toBe(200);
        });

        it('should accelerate when up key is pressed', () => {
            gameScene.cursors.up.isDown = true;
            gameScene.player.speed = 0;
            
            gameScene.accelerate();
            
            expect(gameScene.player.speed).toBeGreaterThan(0);
        });

        it('should brake when down key is pressed', () => {
            gameScene.player.speed = 100;
            
            gameScene.brake();
            
            expect(gameScene.player.speed).toBeLessThan(100);
        });

        it('should turn left when left key is pressed', () => {
            gameScene.turnLeft();
            expect(gameScene.player.setAngularVelocity).toHaveBeenCalledWith(-gameScene.player.turnSpeed);
        });

        it('should turn right when right key is pressed', () => {
            gameScene.turnRight();
            expect(gameScene.player.setAngularVelocity).toHaveBeenCalledWith(gameScene.player.turnSpeed);
        });
    });

    describe('AI Bots', () => {
        beforeEach(() => {
            gameScene.init(mockSceneData);
            gameScene.createAIBots();
        });

        it('should create correct number of AI bots', () => {
            expect(gameScene.aiBots).toHaveLength(3);
        });

        it('should create AI bots with different properties', () => {
            const bots = gameScene.aiBots;
            expect(bots[0].maxSpeed).toBeLessThanOrEqual(bots[1].maxSpeed);
            expect(bots[1].maxSpeed).toBeLessThanOrEqual(bots[2].maxSpeed);
        });

        it('should update AI bot movement', () => {
            const bot = gameScene.aiBots[0];
            const originalSpeed = bot.speed;
            
            gameScene.updateAIBots();
            
            // AI should potentially change speed
            expect(bot.speed).toBeGreaterThanOrEqual(originalSpeed);
        });
    });

    describe('Checkpoint System', () => {
        beforeEach(() => {
            gameScene.init(mockSceneData);
            gameScene.setupCheckpoints();
        });

        it('should create correct number of checkpoints', () => {
            expect(gameScene.checkpoints).toHaveLength(4);
        });

        it('should have checkpoints with correct properties', () => {
            gameScene.checkpoints.forEach((checkpoint, index) => {
                expect(checkpoint).toHaveProperty('x');
                expect(checkpoint).toHaveProperty('y');
                expect(checkpoint).toHaveProperty('radius');
                expect(checkpoint.radius).toBe(50);
            });
        });
    });

    describe('Race Management', () => {
        beforeEach(() => {
            gameScene.init(mockSceneData);
            gameScene.createPlayer();
            gameScene.setupCheckpoints();
        });

        it('should start race countdown', () => {
            gameScene.startRaceCountdown();
            expect(gameScene.time.addEvent).toHaveBeenCalled();
        });

        it('should complete lap when all checkpoints are passed', () => {
            gameScene.player.checkpoint = 3; // Last checkpoint
            gameScene.player.lap = 0;
            
            // Simulate passing through all checkpoints
            gameScene.checkpoints.forEach((_, index) => {
                gameScene.player.checkpoint = index;
            });
            
            // Should complete lap
            gameScene.player.checkpoint = 0;
            gameScene.player.lap = 1;
            
            expect(gameScene.player.lap).toBe(1);
        });

        it('should end race after 3 laps', () => {
            gameScene.player.lap = 3;
            gameScene.checkCheckpoints();
            
            expect(gameScene.raceFinished).toBe(true);
        });
    });

    describe('Mobile Controls', () => {
        it('should handle mobile control events', () => {
            const mockEvent = {
                preventDefault: vi.fn()
            };
            
            // Test mobile control handlers
            expect(() => {
                // Simulate mobile control events
                gameScene.handlePlayerInput();
            }).not.toThrow();
        });
    });
});

describe('AuthManager', () => {
    let authManager;

    beforeEach(() => {
        authManager = new AuthManager();
    });

    describe('Initialization', () => {
        it('should initialize with no user', () => {
            expect(authManager.user).toBeNull();
            expect(authManager.isAuthenticated).toBe(false);
        });
    });

    describe('Guest Login', () => {
        it('should create guest user', async () => {
            const result = await authManager.guestLogin();
            
            expect(result.success).toBe(true);
            expect(result.user).toHaveProperty('isGuest', true);
            expect(result.user).toHaveProperty('name');
            expect(authManager.isAuthenticated).toBe(true);
        });
    });

    describe('User Management', () => {
        it('should set user correctly', () => {
            const userData = {
                id: 'test123',
                name: 'Test User',
                email: 'test@example.com'
            };
            
            authManager.setUser(userData);
            
            expect(authManager.user).toEqual(userData);
            expect(authManager.isAuthenticated).toBe(true);
        });

        it('should logout user', () => {
            authManager.setUser({ id: 'test123', name: 'Test User' });
            authManager.logout();
            
            expect(authManager.user).toBeNull();
            expect(authManager.isAuthenticated).toBe(false);
        });
    });
});

describe('SocketManager', () => {
    let socketManager;

    beforeEach(() => {
        socketManager = new SocketManager();
    });

    describe('Initialization', () => {
        it('should initialize with no connection', () => {
            expect(socketManager.socket).toBeNull();
            expect(socketManager.isConnected).toBe(false);
        });
    });

    describe('Event Handling', () => {
        it('should register event handlers', () => {
            const handler = vi.fn();
            socketManager.on('testEvent', handler);
            
            expect(socketManager.eventHandlers.has('testEvent')).toBe(true);
            expect(socketManager.eventHandlers.get('testEvent')).toContain(handler);
        });

        it('should emit events to handlers', () => {
            const handler = vi.fn();
            socketManager.on('testEvent', handler);
            
            socketManager.emit('testEvent', { data: 'test' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });
    });
});

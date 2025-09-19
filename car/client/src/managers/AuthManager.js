export class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check for stored auth data
        const storedUser = localStorage.getItem('missionhub_user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
                this.isAuthenticated = true;
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.clearAuth();
            }
        }
    }

    async loginWithEmail(email, password) {
        try {
            // In production, this would make an API call to your backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const userData = await response.json();
                this.setUser(userData);
                return { success: true, user: userData };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async loginWithGoogle() {
        try {
            // In production, integrate with Firebase Auth
            // For now, simulate Google login
            const mockUser = {
                id: 'google_' + Date.now(),
                email: 'user@gmail.com',
                name: 'Google User',
                avatar: 'https://via.placeholder.com/50',
                provider: 'google'
            };
            
            this.setUser(mockUser);
            return { success: true, user: mockUser };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: 'Google login failed' };
        }
    }

    async register(email, password, name) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name }),
            });

            if (response.ok) {
                const userData = await response.json();
                this.setUser(userData);
                return { success: true, user: userData };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async guestLogin() {
        const guestUser = {
            id: 'guest_' + Date.now(),
            name: 'Guest Player',
            email: null,
            avatar: null,
            provider: 'guest',
            isGuest: true
        };
        
        this.setUser(guestUser);
        return { success: true, user: guestUser };
    }

    setUser(userData) {
        this.user = userData;
        this.isAuthenticated = true;
        localStorage.setItem('missionhub_user', JSON.stringify(userData));
        
        // Emit auth change event
        window.dispatchEvent(new CustomEvent('authChange', { 
            detail: { user: userData, isAuthenticated: true } 
        }));
    }

    logout() {
        this.clearAuth();
        
        // Emit auth change event
        window.dispatchEvent(new CustomEvent('authChange', { 
            detail: { user: null, isAuthenticated: false } 
        }));
    }

    clearAuth() {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('missionhub_user');
    }

    isLoggedIn() {
        return this.isAuthenticated && this.user !== null;
    }

    getCurrentUser() {
        return this.user;
    }

    getUserId() {
        return this.user ? this.user.id : null;
    }

    getUserName() {
        return this.user ? this.user.name : 'Guest';
    }

    getUserEmail() {
        return this.user ? this.user.email : null;
    }

    isGuest() {
        return this.user && this.user.isGuest;
    }

    // Token management for API calls
    getAuthToken() {
        return this.user ? this.user.token : null;
    }

    // Check if token is expired
    isTokenValid() {
        if (!this.user || !this.user.token) return false;
        
        try {
            const payload = JSON.parse(atob(this.user.token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (error) {
            return false;
        }
    }

    // Refresh token if needed
    async refreshToken() {
        if (!this.isTokenValid()) {
            try {
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    this.user.token = data.token;
                    this.setUser(this.user);
                    return true;
                } else {
                    this.logout();
                    return false;
                }
            } catch (error) {
                console.error('Token refresh error:', error);
                this.logout();
                return false;
            }
        }
        return true;
    }

    // Get user preferences
    getPreferences() {
        return this.user ? this.user.preferences || {} : {};
    }

    // Update user preferences
    async updatePreferences(preferences) {
        if (!this.isLoggedIn()) return false;

        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                },
                body: JSON.stringify({ preferences }),
            });

            if (response.ok) {
                this.user.preferences = { ...this.user.preferences, ...preferences };
                this.setUser(this.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Preferences update error:', error);
            return false;
        }
    }

    // Get user stats
    async getUserStats() {
        if (!this.isLoggedIn()) return null;

        try {
            const response = await fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Stats fetch error:', error);
            return null;
        }
    }
}

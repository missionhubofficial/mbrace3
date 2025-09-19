export class UIManager {
    constructor() {
        this.notifications = [];
        this.modals = [];
        this.isMobile = this.detectMobile();
        this.setupEventListeners();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupEventListeners() {
        // Listen for auth changes
        window.addEventListener('authChange', (event) => {
            this.updateAuthUI(event.detail);
        });

        // Listen for connection status
        if (window.socketManager) {
            window.socketManager.on('connected', () => {
                this.showNotification('Connected to server', 'success');
            });

            window.socketManager.on('disconnected', () => {
                this.showNotification('Disconnected from server', 'warning');
            });

            window.socketManager.on('connectionError', () => {
                this.showNotification('Connection error', 'error');
            });
        }
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto remove after duration
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }

    renderNotification(notification) {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.type}`;
        notificationEl.id = `notification-${notification.id}`;
        
        notificationEl.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${notification.message}</span>
                <button class="notification-close" onclick="window.uiManager.removeNotification(${notification.id})">×</button>
            </div>
        `;
        
        container.appendChild(notificationEl);
        
        // Animate in
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 10);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    removeNotification(id) {
        const notificationEl = document.getElementById(`notification-${id}`);
        if (notificationEl) {
            notificationEl.classList.add('hide');
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    // Modal system
    showModal(title, content, options = {}) {
        const modal = {
            id: Date.now(),
            title,
            content,
            options: {
                closable: true,
                size: 'medium',
                ...options
            }
        };

        this.modals.push(modal);
        this.renderModal(modal);
        return modal.id;
    }

    renderModal(modal) {
        const modalEl = document.createElement('div');
        modalEl.className = 'modal-overlay';
        modalEl.id = `modal-${modal.id}`;
        
        modalEl.innerHTML = `
            <div class="modal modal-${modal.options.size}">
                <div class="modal-header">
                    <h3 class="modal-title">${modal.title}</h3>
                    ${modal.options.closable ? '<button class="modal-close" onclick="window.uiManager.closeModal(' + modal.id + ')">×</button>' : ''}
                </div>
                <div class="modal-content">
                    ${modal.content}
                </div>
                <div class="modal-footer">
                    ${modal.options.buttons || ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modalEl);
        
        // Animate in
        setTimeout(() => {
            modalEl.classList.add('show');
        }, 10);
    }

    closeModal(id) {
        const modalEl = document.getElementById(`modal-${id}`);
        if (modalEl) {
            modalEl.classList.add('hide');
            setTimeout(() => {
                modalEl.remove();
            }, 300);
        }
        
        this.modals = this.modals.filter(m => m.id !== id);
    }

    // Loading overlay
    showLoading(message = 'Loading...') {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.id = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(loadingEl);
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.remove();
        }
    }

    // Toast messages
    showToast(message, type = 'info', duration = 2000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    // Update auth UI
    updateAuthUI(authData) {
        const { user, isAuthenticated } = authData;
        
        // Update any auth-related UI elements
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const authState = element.getAttribute('data-auth');
            if (authState === 'authenticated' && isAuthenticated) {
                element.style.display = 'block';
            } else if (authState === 'guest' && !isAuthenticated) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    // Mobile-specific UI adjustments
    adjustForMobile() {
        if (this.isMobile) {
            // Add mobile-specific classes
            document.body.classList.add('mobile');
            
            // Adjust viewport for mobile
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
            }
        }
    }

    // Game UI helpers
    showGameUI() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.display = 'block';
        }
    }

    hideGameUI() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.display = 'none';
        }
    }

    updateGameStats(stats) {
        // Update game statistics display
        const speedEl = document.getElementById('speed-display');
        if (speedEl) {
            speedEl.textContent = `Speed: ${Math.round(stats.speed || 0)}`;
        }
        
        const lapEl = document.getElementById('lap-display');
        if (lapEl) {
            lapEl.textContent = `Lap: ${stats.lap || 1}/3`;
        }
        
        const positionEl = document.getElementById('position-display');
        if (positionEl) {
            positionEl.textContent = `Position: ${stats.position || 1}`;
        }
    }

    // Settings UI
    showSettings() {
        const settingsContent = `
            <div class="settings-section">
                <h4>Audio</h4>
                <label>
                    <input type="checkbox" id="sound-enabled" checked> Enable Sound
                </label>
                <label>
                    <input type="range" id="sound-volume" min="0" max="100" value="50"> Volume
                </label>
            </div>
            <div class="settings-section">
                <h4>Graphics</h4>
                <label>
                    <select id="graphics-quality">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </label>
            </div>
            <div class="settings-section">
                <h4>Controls</h4>
                <label>
                    <input type="checkbox" id="invert-controls"> Invert Controls
                </label>
                <label>
                    <input type="range" id="sensitivity" min="0.1" max="2" step="0.1" value="1"> Sensitivity
                </label>
            </div>
        `;
        
        const buttons = `
            <button onclick="window.uiManager.saveSettings()" class="btn btn-primary">Save</button>
            <button onclick="window.uiManager.closeModal(${this.modals[this.modals.length - 1]?.id})" class="btn btn-secondary">Cancel</button>
        `;
        
        this.showModal('Settings', settingsContent, { buttons });
    }

    saveSettings() {
        const settings = {
            sound: {
                enabled: document.getElementById('sound-enabled').checked,
                volume: document.getElementById('sound-volume').value
            },
            graphics: {
                quality: document.getElementById('graphics-quality').value
            },
            controls: {
                invert: document.getElementById('invert-controls').checked,
                sensitivity: parseFloat(document.getElementById('sensitivity').value)
            }
        };
        
        // Save to localStorage
        localStorage.setItem('missionhub_settings', JSON.stringify(settings));
        
        // Update auth manager if logged in
        if (window.authManager && window.authManager.isLoggedIn()) {
            window.authManager.updatePreferences({ settings });
        }
        
        this.showToast('Settings saved!', 'success');
        this.closeModal(this.modals[this.modals.length - 1]?.id);
    }

    loadSettings() {
        const stored = localStorage.getItem('missionhub_settings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
        
        return {
            sound: { enabled: true, volume: 50 },
            graphics: { quality: 'medium' },
            controls: { invert: false, sensitivity: 1 }
        };
    }

    // Error handling
    showError(message, details = null) {
        console.error('UI Error:', message, details);
        this.showNotification(message, 'error', 5000);
    }

    // Success messages
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Warning messages
    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    // Info messages
    showInfo(message) {
        this.showNotification(message, 'info');
    }
}

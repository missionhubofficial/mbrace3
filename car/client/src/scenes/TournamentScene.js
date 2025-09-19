import Phaser from 'phaser';

export class TournamentScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TournamentScene' });
        this.tournaments = [];
        this.currentTournament = null;
        this.bracket = [];
        this.round = 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
        
        // Title
        this.add.text(width / 2, 50, 'Tournament Hub', {
            fontSize: '36px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Create tournament button
        const createTournamentBtn = this.add.text(width / 2, 120, 'Create Tournament', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.createTournament();
        });
        
        // Join tournament button
        const joinTournamentBtn = this.add.text(width / 2, 160, 'Join Tournament', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.showJoinTournament();
        });
        
        // Back button
        const backBtn = this.add.text(50, 50, '← Back', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        }).setOrigin(0, 0)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Tournament list container
        this.tournamentListContainer = this.add.container(0, 0);
        
        // Setup Socket.IO
        this.setupSocketIO();
        
        // Load tournaments
        this.loadTournaments();
    }

    setupSocketIO() {
        if (!window.socketManager) return;
        
        // Tournament events
        window.socketManager.on('tournamentList', (tournaments) => {
            this.updateTournamentList(tournaments);
        });
        
        window.socketManager.on('tournamentCreated', (tournament) => {
            this.tournaments.push(tournament);
            this.updateTournamentList(this.tournaments);
        });
        
        window.socketManager.on('tournamentJoined', (tournament) => {
            this.currentTournament = tournament;
            this.showTournamentDetails(tournament);
        });
        
        window.socketManager.on('tournamentUpdate', (tournament) => {
            this.currentTournament = tournament;
            this.updateTournamentDetails(tournament);
        });
        
        window.socketManager.on('bracketUpdate', (bracket) => {
            this.bracket = bracket;
            this.updateBracket();
        });
        
        window.socketManager.on('matchStart', (match) => {
            this.scene.start('GameScene', { mode: 'tournament', match: match });
        });
    }

    createTournament() {
        const { width, height } = this.cameras.main;
        
        // Tournament creation modal
        const modal = this.add.rectangle(width / 2, height / 2, 500, 400, 0x2c3e50, 0.9);
        modal.setStroke(2, 0x3498db);
        
        this.add.text(width / 2, height / 2 - 150, 'Create Tournament', {
            fontSize: '24px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Tournament name input (simplified)
        this.add.text(width / 2 - 100, height / 2 - 80, 'Name:', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        const nameInput = this.add.text(width / 2 + 50, height / 2 - 80, 'My Tournament', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);
        
        // Max players
        this.add.text(width / 2 - 100, height / 2 - 40, 'Max Players:', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        const playersInput = this.add.text(width / 2 + 50, height / 2 - 40, '8', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);
        
        // Entry fee
        this.add.text(width / 2 - 100, height / 2, 'Entry Fee:', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        const feeInput = this.add.text(width / 2 + 50, height / 2, '100', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);
        
        // Create button
        const createBtn = this.add.text(width / 2, height / 2 + 80, 'Create', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.createTournamentRequest({
                name: nameInput.text,
                maxPlayers: parseInt(playersInput.text),
                entryFee: parseInt(feeInput.text)
            });
            modal.destroy();
        });
        
        // Cancel button
        const cancelBtn = this.add.text(width / 2, height / 2 + 120, 'Cancel', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            modal.destroy();
        });
    }

    createTournamentRequest(tournamentData) {
        if (window.socketManager) {
            window.socketManager.emit('createTournament', tournamentData);
        } else {
            // Fallback for offline mode
            const tournament = {
                id: Date.now().toString(),
                name: tournamentData.name,
                maxPlayers: tournamentData.maxPlayers,
                entryFee: tournamentData.entryFee,
                players: 1,
                status: 'waiting',
                prizePool: tournamentData.entryFee * tournamentData.maxPlayers,
                bracket: []
            };
            this.tournaments.push(tournament);
            this.updateTournamentList(this.tournaments);
        }
    }

    showJoinTournament() {
        const { width, height } = this.cameras.main;
        
        // Join tournament modal
        const modal = this.add.rectangle(width / 2, height / 2, 600, 500, 0x2c3e50, 0.9);
        modal.setStroke(2, 0x3498db);
        
        this.add.text(width / 2, height / 2 - 200, 'Join Tournament', {
            fontSize: '24px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Tournament list
        this.tournaments.forEach((tournament, index) => {
            const y = height / 2 - 120 + index * 60;
            
            const tournamentBg = this.add.rectangle(width / 2, y, 500, 50, 0x34495e);
            tournamentBg.setStroke(2, 0x3498db);
            
            const tournamentText = this.add.text(width / 2 - 200, y, `${tournament.name} (${tournament.players}/${tournament.maxPlayers})`, {
                fontSize: '16px',
                fill: '#ecf0f1',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            const prizeText = this.add.text(width / 2, y, `Prize: ${tournament.prizePool}`, {
                fontSize: '14px',
                fill: '#f39c12',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            const joinBtn = this.add.text(width / 2 + 150, y, 'Join', {
                fontSize: '14px',
                fill: '#ecf0f1',
                fontFamily: 'Arial',
                backgroundColor: '#3498db',
                padding: { x: 10, y: 5 }
            }).setOrigin(0, 0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.joinTournament(tournament.id);
                modal.destroy();
            });
            
            if (tournament.players >= tournament.maxPlayers) {
                joinBtn.setTint(0x7f8c8d);
                joinBtn.removeInteractive();
            }
        });
        
        // Close button
        const closeBtn = this.add.text(width / 2 + 280, height / 2 - 220, '×', {
            fontSize: '24px',
            fill: '#e74c3c',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            modal.destroy();
        });
    }

    joinTournament(tournamentId) {
        if (window.socketManager) {
            window.socketManager.emit('joinTournament', tournamentId);
        } else {
            // Fallback for offline mode
            const tournament = this.tournaments.find(t => t.id === tournamentId);
            if (tournament) {
                this.currentTournament = tournament;
                this.showTournamentDetails(tournament);
            }
        }
    }

    loadTournaments() {
        if (window.socketManager) {
            window.socketManager.emit('getTournaments');
        } else {
            // Mock tournaments for offline testing
            this.tournaments = [
                { id: '1', name: 'Weekly Championship', players: 4, maxPlayers: 8, entryFee: 100, prizePool: 800, status: 'waiting' },
                { id: '2', name: 'Speed Demon Cup', players: 8, maxPlayers: 8, entryFee: 50, prizePool: 400, status: 'full' },
                { id: '3', name: 'Beginner Tournament', players: 2, maxPlayers: 4, entryFee: 25, prizePool: 100, status: 'waiting' }
            ];
            this.updateTournamentList(this.tournaments);
        }
    }

    updateTournamentList(tournaments) {
        this.tournaments = tournaments;
        
        // Clear existing tournament list
        this.tournamentListContainer.removeAll();
        
        const { width, height } = this.cameras.main;
        
        // Tournament list title
        this.tournamentListContainer.add(this.add.text(width / 2, 220, 'Available Tournaments', {
            fontSize: '24px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5));
        
        // Display tournaments
        tournaments.forEach((tournament, index) => {
            const y = 280 + index * 80;
            
            // Tournament background
            const tournamentBg = this.add.rectangle(width / 2, y, width - 100, 70, 0x34495e);
            tournamentBg.setStroke(2, 0x3498db);
            
            // Tournament info
            const tournamentText = this.add.text(width / 2 - 250, y - 15, tournament.name, {
                fontSize: '18px',
                fill: '#ecf0f1',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            const playersText = this.add.text(width / 2 - 250, y + 15, `Players: ${tournament.players}/${tournament.maxPlayers}`, {
                fontSize: '14px',
                fill: '#bdc3c7',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            const prizeText = this.add.text(width / 2, y, `Prize Pool: ${tournament.prizePool}`, {
                fontSize: '16px',
                fill: '#f39c12',
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0.5);
            
            const entryText = this.add.text(width / 2 + 100, y, `Entry: ${tournament.entryFee}`, {
                fontSize: '14px',
                fill: '#bdc3c7',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            // Join button
            const joinBtn = this.add.text(width / 2 + 200, y, 'Join', {
                fontSize: '16px',
                fill: '#ecf0f1',
                fontFamily: 'Arial',
                backgroundColor: '#3498db',
                padding: { x: 15, y: 8 }
            }).setOrigin(0, 0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.joinTournament(tournament.id);
            });
            
            // Disable join button if tournament is full
            if (tournament.players >= tournament.maxPlayers) {
                joinBtn.setTint(0x7f8c8d);
                joinBtn.removeInteractive();
            }
            
            this.tournamentListContainer.add([tournamentBg, tournamentText, playersText, prizeText, entryText, joinBtn]);
        });
    }

    showTournamentDetails(tournament) {
        const { width, height } = this.cameras.main;
        
        // Clear tournament list
        this.tournamentListContainer.removeAll();
        
        // Tournament details background
        const tournamentDetailsBg = this.add.rectangle(width / 2, height / 2, width - 100, height - 200, 0x2c3e50);
        tournamentDetailsBg.setStroke(2, 0x3498db);
        
        // Tournament title
        this.add.text(width / 2, 150, tournament.name, {
            fontSize: '28px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Tournament info
        this.add.text(width / 2, 200, `Players: ${tournament.players}/${tournament.maxPlayers}`, {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 230, `Prize Pool: ${tournament.prizePool}`, {
            fontSize: '20px',
            fill: '#f39c12',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 260, `Entry Fee: ${tournament.entryFee}`, {
            fontSize: '18px',
            fill: '#bdc3c7',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Bracket display
        this.add.text(width / 2, 320, 'Tournament Bracket', {
            fontSize: '24px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Bracket container
        this.bracketContainer = this.add.container(0, 0);
        
        // Leave tournament button
        const leaveBtn = this.add.text(width / 2, height - 100, 'Leave Tournament', {
            fontSize: '18px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.leaveTournament();
        });
        
        this.tournamentListContainer.add([tournamentDetailsBg, leaveBtn]);
        
        // Update bracket
        this.updateBracket();
    }

    updateBracket() {
        if (!this.bracketContainer) return;
        
        this.bracketContainer.removeAll();
        
        const { width, height } = this.cameras.main;
        
        // Simple bracket visualization
        if (this.bracket.length > 0) {
            this.bracket.forEach((match, index) => {
                const y = 360 + index * 60;
                
                const matchText = this.add.text(width / 2, y, `Match ${index + 1}: ${match.player1 || 'TBD'} vs ${match.player2 || 'TBD'}`, {
                    fontSize: '16px',
                    fill: '#ecf0f1',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                if (match.winner) {
                    matchText.setText(`Match ${index + 1}: ${match.winner} WINS!`);
                    matchText.setTint(0x27ae60);
                }
                
                this.bracketContainer.add(matchText);
            });
        } else {
            this.add.text(width / 2, 360, 'Bracket will be generated when tournament starts', {
                fontSize: '16px',
                fill: '#bdc3c7',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
    }

    updateTournamentDetails(tournament) {
        // Update tournament details if needed
        this.currentTournament = tournament;
    }

    leaveTournament() {
        if (window.socketManager) {
            window.socketManager.emit('leaveTournament');
        }
        
        this.currentTournament = null;
        this.bracket = [];
        this.loadTournaments();
    }
}

/**
 * Game State Manager
 * Manages different game states (menu, playing, door selection, game over)
 */
export const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    DOOR_SELECTION: 'door_selection',
    GAME_OVER: 'game_over'
};

export class StateManager {
    constructor() {
        this.currentState = GameState.MENU;
        this.previousState = null;
    }

    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this._updateUI();
    }

    getState() {
        return this.currentState;
    }

    _updateUI() {
        // Hide all screens
        const screens = ['menu-screen', 'hud', 'door-selection-screen', 'game-over-screen'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.remove('active');
        });

        // Show appropriate screen
        switch (this.currentState) {
            case GameState.MENU:
                document.getElementById('menu-screen').classList.add('active');
                break;
            case GameState.PLAYING:
                document.getElementById('hud').classList.add('active');
                break;
            case GameState.DOOR_SELECTION:
                document.getElementById('door-selection-screen').classList.add('active');
                break;
            case GameState.GAME_OVER:
                document.getElementById('game-over-screen').classList.add('active');
                break;
        }
    }
}

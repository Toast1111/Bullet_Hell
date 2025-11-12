/**
 * Input Manager
 * Handles keyboard and mouse input
 */
export class InputManager {
    constructor() {
        this.keys = new Set();
        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            justPressed: false
        };

        this._setupEventListeners();
    }

    _setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });

        const canvas = document.getElementById('game-canvas');
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', () => {
            this.mouse.pressed = true;
            this.mouse.justPressed = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.pressed = false;
        });
    }

    isKeyPressed(key) {
        return this.keys.has(key.toLowerCase());
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    isMousePressed() {
        return this.mouse.pressed;
    }

    wasMouseJustPressed() {
        const result = this.mouse.justPressed;
        this.mouse.justPressed = false;
        return result;
    }

    update() {
        // Reset per-frame input states
        this.mouse.justPressed = false;
    }
}

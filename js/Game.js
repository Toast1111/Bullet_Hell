import { Renderer } from './core/Renderer.js';
import { InputManager } from './core/InputManager.js';
import { StateManager, GameState } from './core/StateManager.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { LevelGenerator, LevelType } from './levels/LevelGenerator.js';
import { Player } from './entities/Player.js';
import { Vector2D } from './utils/math.js';

/**
 * Main Game Class
 * Orchestrates all game systems
 */
export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager();
        this.stateManager = new StateManager();
        this.collisionSystem = new CollisionSystem();
        this.levelGenerator = new LevelGenerator(this.renderer.width, this.renderer.height);

        this.bounds = {
            width: this.renderer.width,
            height: this.renderer.height
        };

        this.reset();
        this._setupEventListeners();
        
        this.lastTime = 0;
        this.running = false;
    }

    reset() {
        this.player = new Player(this.renderer.width / 2, this.renderer.height / 2);
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.currentLevel = null;
        this.levelNumber = 1;
        this.doorOptions = [];
    }

    _setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            this.reset();
            this.startGame();
        });
    }

    startGame() {
        this.reset();
        this.loadLevel(1, LevelType.ELIMINATION, []);
        this.stateManager.setState(GameState.PLAYING);
        if (!this.running) {
            this.running = true;
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    loadLevel(levelNumber, type, modifiers) {
        this.levelNumber = levelNumber;
        this.currentLevel = this.levelGenerator.generateLevel(levelNumber, type, modifiers);
        this.enemies = this.currentLevel.enemies;
        this.playerBullets = [];
        this.enemyBullets = [];
        
        // Reset player position
        this.player.position = new Vector2D(this.renderer.width / 2, this.renderer.height / 2);
        this.player.velocity = new Vector2D(0, 0);

        this._updateUI();
    }

    _updateUI() {
        // Update HUD
        document.getElementById('level-number').textContent = `Level: ${this.levelNumber}`;
        
        const modifierText = this.currentLevel.modifiers
            .map(m => m.name)
            .join(', ');
        document.getElementById('modifiers').textContent = modifierText || 'No Modifiers';

        document.getElementById('objective-text').textContent = this.currentLevel.objective.description;

        this._updateHealthBar();
    }

    _updateHealthBar() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-fill').style.width = `${healthPercent}%`;
    }

    showDoorSelection() {
        this.doorOptions = this.levelGenerator.generateDoorOptions();
        const doorContainer = document.getElementById('door-container');
        doorContainer.innerHTML = '';

        this.doorOptions.forEach((door, index) => {
            const doorDiv = document.createElement('div');
            doorDiv.className = 'door-option';
            
            const typeName = door.type === LevelType.ELIMINATION ? 'Elimination' : 'Capture Point';
            const modifiers = door.modifiers.map(m => m.name).join(', ') || 'No Modifiers';
            
            doorDiv.innerHTML = `
                <h3>Door ${index + 1}</h3>
                <p><strong>Type:</strong> ${typeName}</p>
                <p class="door-modifier">${modifiers}</p>
            `;

            doorDiv.addEventListener('click', () => {
                this.selectDoor(index);
            });

            doorContainer.appendChild(doorDiv);
        });

        this.stateManager.setState(GameState.DOOR_SELECTION);
    }

    selectDoor(index) {
        const door = this.doorOptions[index];
        this.loadLevel(this.levelNumber + 1, door.type, door.modifiers);
        this.stateManager.setState(GameState.PLAYING);
    }

    gameOver() {
        document.getElementById('final-level').textContent = `Level Reached: ${this.levelNumber}`;
        this.stateManager.setState(GameState.GAME_OVER);
    }

    update(deltaTime) {
        if (this.stateManager.getState() !== GameState.PLAYING) return;

        // Handle input
        this._handleInput(deltaTime);

        // Update player
        this.player.update(deltaTime, this.bounds);

        // Update enemies
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(deltaTime, this.player, this.enemyBullets, this.enemies);
            }
        }

        // Update bullets
        for (const bullet of this.playerBullets) {
            bullet.update(deltaTime, this.bounds);
        }

        for (const bullet of this.enemyBullets) {
            bullet.update(deltaTime, this.bounds);
        }

        // Update capture point if exists
        if (this.currentLevel.capturePoint) {
            this.currentLevel.capturePoint.update(deltaTime, this.player);
        }

        // Handle collisions
        const collisionResults = this.collisionSystem.checkCollisions(
            this.player,
            this.enemies,
            this.playerBullets,
            this.enemyBullets
        );

        // Update UI if player was hit
        if (collisionResults.playerHit) {
            this._updateHealthBar();
        }

        // Cleanup inactive entities
        this.enemies = this.collisionSystem.cleanupInactive(this.enemies);
        this.playerBullets = this.collisionSystem.cleanupInactive(this.playerBullets);
        this.enemyBullets = this.collisionSystem.cleanupInactive(this.enemyBullets);

        // Check win conditions
        this._checkObjectiveComplete();

        // Check lose condition
        if (this.player.health <= 0) {
            this.gameOver();
        }

        // Update input manager
        this.input.update();
    }

    _handleInput(deltaTime) {
        const moveDir = new Vector2D(0, 0);

        if (this.input.isKeyPressed('w') || this.input.isKeyPressed('arrowup')) {
            moveDir.y -= 1;
        }
        if (this.input.isKeyPressed('s') || this.input.isKeyPressed('arrowdown')) {
            moveDir.y += 1;
        }
        if (this.input.isKeyPressed('a') || this.input.isKeyPressed('arrowleft')) {
            moveDir.x -= 1;
        }
        if (this.input.isKeyPressed('d') || this.input.isKeyPressed('arrowright')) {
            moveDir.x += 1;
        }

        if (moveDir.x !== 0 || moveDir.y !== 0) {
            this.player.move(moveDir);
        } else {
            this.player.stop();
        }

        // Automatic shooting toward mouse position
        const mousePos = this.input.getMousePosition();
        this.player.shoot(new Vector2D(mousePos.x, mousePos.y), this.playerBullets);
    }

    _checkObjectiveComplete() {
        let complete = false;

        if (this.currentLevel.objective.type === 'elimination') {
            const enemiesAlive = this.enemies.filter(e => e.active).length;
            if (enemiesAlive === 0 && this.enemies.length > 0) {
                complete = true;
            }
        } else if (this.currentLevel.objective.type === 'capture_point') {
            if (this.currentLevel.capturePoint && this.currentLevel.capturePoint.isCaptured()) {
                complete = true;
            }
        }

        if (complete) {
            this.showDoorSelection();
        }
    }

    render() {
        this.renderer.clear();

        if (this.stateManager.getState() === GameState.PLAYING) {
            // Render capture point
            if (this.currentLevel.capturePoint) {
                this.currentLevel.capturePoint.render(this.renderer);
            }

            // Render entities
            for (const enemy of this.enemies) {
                if (enemy.active) {
                    enemy.render(this.renderer);
                }
            }

            for (const bullet of this.playerBullets) {
                if (bullet.active) {
                    bullet.render(this.renderer);
                }
            }

            for (const bullet of this.enemyBullets) {
                if (bullet.active) {
                    bullet.render(this.renderer);
                }
            }

            this.player.render(this.renderer);

            // Render debug info
            this._renderDebugInfo();
        }
    }

    _renderDebugInfo() {
        const enemiesAlive = this.enemies.filter(e => e.active).length;
        this.renderer.drawText(
            `Enemies: ${enemiesAlive}`,
            10,
            this.renderer.height - 10,
            '#666',
            12
        );
    }

    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

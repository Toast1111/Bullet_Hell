import { Renderer } from './core/Renderer.js';
import { InputManager } from './core/InputManager.js';
import { StateManager, GameState } from './core/StateManager.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { LevelGenerator, LevelType } from './levels/LevelGenerator.js';
import { Player } from './entities/Player.js';
import { Portal } from './entities/Portal.js';
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
        this.portals = [];
        this.obstacles = [];
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
        this.portals = [];
        this.obstacles = this.currentLevel.obstacles || [];
        
        // Update bounds based on level size
        this.bounds = {
            width: this.currentLevel.width,
            height: this.currentLevel.height
        };
        
        // Reset player position to center
        this.player.position = new Vector2D(this.currentLevel.width / 2, this.currentLevel.height / 2);
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

    showPortals() {
        this.doorOptions = this.levelGenerator.generateDoorOptions();
        this.portals = [];

        // Spawn portals at North, East, and West walls
        const positions = [
            { x: this.currentLevel.width / 2, y: 60, dir: 'north' },
            { x: this.currentLevel.width - 60, y: this.currentLevel.height / 2, dir: 'east' },
            { x: 60, y: this.currentLevel.height / 2, dir: 'west' }
        ];

        for (let i = 0; i < 3; i++) {
            const portal = new Portal(
                positions[i].x,
                positions[i].y,
                positions[i].dir,
                this.doorOptions[i]
            );
            this.portals.push(portal);
        }
    }

    selectPortal(index) {
        const door = this.doorOptions[index];
        this.loadLevel(this.levelNumber + 1, door.type, door.modifiers);
    }

    gameOver() {
        document.getElementById('final-level').textContent = `Level Reached: ${this.levelNumber}`;
        this.stateManager.setState(GameState.GAME_OVER);
    }

    update(deltaTime) {
        if (this.stateManager.getState() !== GameState.PLAYING) return;

        // Handle input
        this._handleInput(deltaTime);

        // Update player with obstacle collision
        this.player.update(deltaTime, this.bounds);
        this._handlePlayerObstacleCollision();

        // Update enemies
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(deltaTime, this.player, this.enemyBullets, this.enemies);
            }
        }

        // Update bullets and check obstacle collisions
        for (const bullet of this.playerBullets) {
            bullet.update(deltaTime, this.bounds);
            this._checkBulletObstacleCollision(bullet);
        }

        for (const bullet of this.enemyBullets) {
            bullet.update(deltaTime, this.bounds);
            this._checkBulletObstacleCollision(bullet);
        }

        // Update capture point if exists
        if (this.currentLevel.capturePoint) {
            this.currentLevel.capturePoint.update(deltaTime, this.player);
        }

        // Update portals
        for (const portal of this.portals) {
            portal.update(deltaTime);
        }

        // Check portal interactions
        this._checkPortalInteraction();

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

        // Automatic shooting toward closest enemy
        const closestEnemy = this._findClosestEnemy();
        if (closestEnemy) {
            this.player.shoot(closestEnemy.position, this.playerBullets);
        }
    }

    _findClosestEnemy() {
        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            
            const distance = this.player.position.distance(enemy.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        return closestEnemy;
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

        if (complete && this.portals.length === 0) {
            this.showPortals();
        }
    }

    _checkPortalInteraction() {
        for (let i = 0; i < this.portals.length; i++) {
            const portal = this.portals[i];
            if (portal.canInteract(this.player)) {
                this.selectPortal(i);
                break;
            }
        }
    }

    _handlePlayerObstacleCollision() {
        for (const obstacle of this.obstacles) {
            const bounds = obstacle.getBounds();
            const playerX = this.player.position.x;
            const playerY = this.player.position.y;
            const playerRadius = this.player.radius;

            // Check if player overlaps with obstacle
            const closestX = Math.max(bounds.x, Math.min(playerX, bounds.x + bounds.width));
            const closestY = Math.max(bounds.y, Math.min(playerY, bounds.y + bounds.height));

            const distanceX = playerX - closestX;
            const distanceY = playerY - closestY;
            const distanceSquared = distanceX * distanceX + distanceY * distanceY;

            if (distanceSquared < playerRadius * playerRadius) {
                // Push player out of obstacle
                const distance = Math.sqrt(distanceSquared);
                if (distance > 0) {
                    const pushX = (distanceX / distance) * (playerRadius - distance);
                    const pushY = (distanceY / distance) * (playerRadius - distance);
                    this.player.position.x += pushX;
                    this.player.position.y += pushY;
                }
            }
        }
    }

    _checkBulletObstacleCollision(bullet) {
        if (!bullet.active) return;
        
        for (const obstacle of this.obstacles) {
            if (obstacle.containsPoint(bullet.position.x, bullet.position.y)) {
                bullet.active = false;
                break;
            }
        }
    }

    render() {
        this.renderer.clear();

        if (this.stateManager.getState() === GameState.PLAYING) {
            // Render obstacles
            for (const obstacle of this.obstacles) {
                obstacle.render(this.renderer);
            }

            // Render capture point
            if (this.currentLevel.capturePoint) {
                this.currentLevel.capturePoint.render(this.renderer);
            }

            // Render portals
            for (const portal of this.portals) {
                portal.render(this.renderer);
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
        
        if (this.portals.length > 0) {
            this.renderer.drawText(
                'Enter a portal to continue!',
                this.renderer.width / 2,
                this.renderer.height - 30,
                '#00ffff',
                16,
                'center'
            );
        }
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

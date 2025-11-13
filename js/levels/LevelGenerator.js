import { Random } from '../utils/math.js';
import { Enemy, SpreadEnemy } from '../entities/Enemy.js';
import { CapturePoint } from '../entities/CapturePoint.js';
import { Obstacle } from '../entities/Obstacle.js';

/**
 * Level Types
 */
export const LevelType = {
    ELIMINATION: 'elimination',
    CAPTURE_POINT: 'capture_point'
};

/**
 * Level Modifiers
 */
export const Modifiers = {
    FAST_ENEMIES: { name: 'Fast Enemies', speedMultiplier: 1.5 },
    MORE_ENEMIES: { name: 'More Enemies', enemyMultiplier: 1.5 },
    BULLET_HELL: { name: 'Bullet Hell', fireRateMultiplier: 2 },
    ELITE_ENEMIES: { name: 'Elite Enemies', healthMultiplier: 2 }
};

/**
 * Level Generator
 * Procedurally generates levels
 */
export class LevelGenerator {
    constructor(baseWidth, baseHeight) {
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
    }

    generateLevel(levelNumber, type, modifiers = []) {
        // Keep level size same as canvas for now (no camera system needed)
        const width = this.baseWidth;
        const height = this.baseHeight;

        const level = {
            type,
            number: levelNumber,
            modifiers,
            enemies: [],
            capturePoint: null,
            objective: null,
            obstacles: [],
            width,
            height
        };

        // Apply difficulty scaling
        const difficulty = 1 + (levelNumber - 1) * 0.3;

        // Generate obstacles/cover
        level.obstacles = this._generateObstacles(width, height, levelNumber);

        if (type === LevelType.ELIMINATION) {
            level.objective = this._generateEliminationObjective(difficulty, modifiers);
            level.enemies = this._generateEnemies(level.objective.targetCount, modifiers, difficulty, width, height, level.obstacles);
        } else if (type === LevelType.CAPTURE_POINT) {
            level.objective = this._generateCaptureObjective();
            level.capturePoint = new CapturePoint(
                width / 2,
                height / 2,
                3.0
            );
            const enemyCount = Math.floor(5 * difficulty);
            level.enemies = this._generateEnemies(enemyCount, modifiers, difficulty, width, height, level.obstacles);
        }

        return level;
    }

    _generateEliminationObjective(difficulty, modifiers) {
        let targetCount = Math.floor(5 + difficulty * 3);
        
        if (modifiers.includes(Modifiers.MORE_ENEMIES)) {
            targetCount = Math.floor(targetCount * Modifiers.MORE_ENEMIES.enemyMultiplier);
        }

        return {
            type: 'elimination',
            targetCount,
            currentCount: 0,
            description: `Eliminate ${targetCount} enemies`
        };
    }

    _generateCaptureObjective() {
        return {
            type: 'capture_point',
            description: 'Capture the point'
        };
    }

    _generateObstacles(width, height, levelNumber) {
        const obstacles = [];
        const obstacleCount = Random.int(3, 8); // 3-8 obstacles per level
        const margin = 80;

        for (let i = 0; i < obstacleCount; i++) {
            const obstacleWidth = Random.range(40, 100);
            const obstacleHeight = Random.range(40, 100);
            
            let x, y, attempts = 0;
            let validPosition = false;

            // Try to find a valid position (not in center, not overlapping other obstacles)
            while (!validPosition && attempts < 50) {
                x = Random.range(margin, width - margin - obstacleWidth);
                y = Random.range(margin, height - margin - obstacleHeight);
                
                // Check not in center
                const centerX = width / 2;
                const centerY = height / 2;
                const distFromCenter = Math.sqrt(Math.pow(x + obstacleWidth/2 - centerX, 2) + Math.pow(y + obstacleHeight/2 - centerY, 2));
                
                if (distFromCenter > 150) {
                    // Check not overlapping with existing obstacles
                    validPosition = true;
                    for (const obs of obstacles) {
                        if (this._rectanglesOverlap(x, y, obstacleWidth, obstacleHeight, 
                                                      obs.position.x, obs.position.y, obs.width, obs.height)) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            }

            if (validPosition) {
                obstacles.push(new Obstacle(x, y, obstacleWidth, obstacleHeight));
            }
        }

        return obstacles;
    }

    _rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        const margin = 20; // Add margin between obstacles
        return !(x1 + w1 + margin < x2 || x2 + w2 + margin < x1 || 
                 y1 + h1 + margin < y2 || y2 + h2 + margin < y1);
    }

    _generateEnemies(count, modifiers, difficulty, width, height, obstacles) {
        const enemies = [];
        const margin = 50;

        for (let i = 0; i < count; i++) {
            let x, y, validPosition = false, attempts = 0;
            
            // Find valid spawn position
            while (!validPosition && attempts < 100) {
                x = Random.range(margin, width - margin);
                y = Random.range(margin, height - margin);
                
                // Check not in center
                const distFromCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
                
                if (distFromCenter > 100) {
                    // Check not inside obstacles
                    validPosition = true;
                    for (const obstacle of obstacles) {
                        if (obstacle.containsPoint(x, y)) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            }

            if (!validPosition) {
                // Fallback position if we couldn't find a valid spot
                x = Random.range(margin, width - margin);
                y = Random.range(margin, height - margin);
            }

            // 20% chance for special enemy type
            const enemy = Random.boolean(0.2) 
                ? new SpreadEnemy(x, y)
                : new Enemy(x, y);

            // Apply modifiers
            this._applyModifiersToEnemy(enemy, modifiers, difficulty);
            
            enemies.push(enemy);
        }

        return enemies;
    }

    _applyModifiersToEnemy(enemy, modifiers, difficulty) {
        // Base difficulty scaling
        enemy.health *= difficulty;
        enemy.maxHealth = enemy.health;

        if (modifiers.includes(Modifiers.FAST_ENEMIES)) {
            enemy.speed *= Modifiers.FAST_ENEMIES.speedMultiplier;
        }

        if (modifiers.includes(Modifiers.BULLET_HELL)) {
            enemy.shootDelay /= Modifiers.BULLET_HELL.fireRateMultiplier;
        }

        if (modifiers.includes(Modifiers.ELITE_ENEMIES)) {
            enemy.health *= Modifiers.ELITE_ENEMIES.healthMultiplier;
            enemy.maxHealth = enemy.health;
        }
    }

    generateDoorOptions() {
        const types = [LevelType.ELIMINATION, LevelType.CAPTURE_POINT];
        const doors = [];

        for (let i = 0; i < 3; i++) {
            const type = Random.choice(types);
            const modifierList = Object.values(Modifiers);
            
            // Randomly select 0-2 modifiers
            const modifierCount = Random.int(0, 2);
            const selectedModifiers = [];
            
            for (let j = 0; j < modifierCount; j++) {
                const modifier = Random.choice(modifierList);
                if (!selectedModifiers.includes(modifier)) {
                    selectedModifiers.push(modifier);
                }
            }

            doors.push({
                type,
                modifiers: selectedModifiers
            });
        }

        return doors;
    }
}
